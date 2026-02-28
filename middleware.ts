import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createPublicClient, http, parseUnits } from 'viem'
import { base } from 'viem/chains'

const RECIPIENT_WALLET = '0x5b99070C84aB6297F2c1a25490c53eE483C8B499'
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

// Create public client for Base using public RPC (not blocked by Cloudflare)
const publicClient = createPublicClient({
  chain: base,
  transport: http('https://base-rpc.publicnode.com'),
})

// ERC-20 Transfer event signature
const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

// x402 payment configuration
const paywallConfig = {
  '/api/products/business-starter': {
    price: '19.00',
    currency: 'USD',
    network: 'eip155:8453', // Base mainnet
  },
  '/api/products/x402-kit': {
    price: '29.00',
    currency: 'USD',
    network: 'eip155:8453', // Base mainnet
  },
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const config = paywallConfig[path as keyof typeof paywallConfig]
  
  if (!config) {
    return NextResponse.next()
  }

  // Check for x402 payment header
  const paymentHeader = request.headers.get('x-payment')
  
  if (paymentHeader) {
    try {
      const payment = JSON.parse(paymentHeader)
      
      // Verify payment structure
      if (payment.protocol !== 'x402' || !payment.txHash) {
        console.error('[x402] Invalid payment format - missing txHash')
        throw new Error('Invalid payment format - transaction hash required')
      }

      console.log('[x402] Verifying transaction:', payment.txHash)

      // Wait for the transaction receipt (with retries)
      let receipt
      let attempts = 0
      const maxAttempts = 10
      
      while (!receipt && attempts < maxAttempts) {
        try {
          receipt = await publicClient.getTransactionReceipt({
            hash: payment.txHash as `0x${string}`,
          })
          if (receipt) break
        } catch (err) {
          // Transaction not found yet, wait and retry
          attempts++
          if (attempts >= maxAttempts) {
            throw new Error('Transaction not found after maximum retries')
          }
          console.log(`[x402] Transaction not found, retrying (${attempts}/${maxAttempts})...`)
          await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
        }
      }

      if (!receipt || receipt.status !== 'success') {
        console.error('[x402] Transaction failed or not confirmed')
        throw new Error('Transaction not confirmed')
      }
      
      console.log('[x402] Transaction confirmed in block:', receipt.blockNumber)

      // Verify the transaction contains a USDC transfer to our wallet
      const expectedAmount = parseUnits(config.price, 6) // USDC has 6 decimals
      
      let transferFound = false
      for (const log of receipt.logs) {
        // Check if this is a Transfer event from USDC contract
        if (
          log.address.toLowerCase() === USDC_BASE.toLowerCase() &&
          log.topics[0] === TRANSFER_EVENT_SIGNATURE
        ) {
          // topics[1] = from, topics[2] = to, data = amount
          const to = '0x' + log.topics[2]?.slice(-40) // Last 40 chars of topic[2]
          const amount = BigInt(log.data)

          console.log('[x402] Transfer found:', {
            to,
            amount: amount.toString(),
            expected: expectedAmount.toString(),
          })

          if (
            to.toLowerCase() === RECIPIENT_WALLET.toLowerCase() &&
            amount >= expectedAmount
          ) {
            transferFound = true
            break
          }
        }
      }

      if (!transferFound) {
        console.error('[x402] No valid USDC transfer found in transaction')
        throw new Error('Payment verification failed - no valid transfer found')
      }

      console.log('[x402] ✓ Payment verified! TxHash:', payment.txHash)
      
      // Payment verified - allow access
      return NextResponse.next()
      
    } catch (err: any) {
      console.error('[x402] Payment verification failed:', err.message)
      return new NextResponse(
        JSON.stringify({ 
          error: 'Payment verification failed',
          details: err.message 
        }),
        { 
          status: 402,
          headers: { 'Content-Type': 'application/json' } 
        }
      )
    }
  }

  // Return 402 Payment Required with x402 payment details
  return new NextResponse(
    JSON.stringify({
      error: 'Payment Required',
      paymentRequired: {
        protocol: 'x402',
        version: '2.0',
        recipient: RECIPIENT_WALLET,
        amount: config.price,
        currency: config.currency,
        network: config.network,
        description: `Purchase ${path.split('/').pop()}`,
      },
    }),
    {
      status: 402,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': `x402 recipient="${RECIPIENT_WALLET}" amount="${config.price}" currency="${config.currency}" network="${config.network}"`,
      },
    }
  )
}

export const config = {
  matcher: ['/api/products/:path*'],
}
