import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const RECIPIENT_WALLET = '0x5b99070C84aB6297F2c1a25490c53eE483C8B499'

// x402 payment configuration
const paywallConfig = {
  '/api/products/business-starter': {
    price: '1.00', // $1 for testing
    currency: 'USD',
    network: 'eip155:8453', // Base mainnet
  },
  '/api/products/x402-kit': {
    price: '1.00', // $1 for testing
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
      if (payment.protocol !== 'x402' || !payment.authorization) {
        throw new Error('Invalid payment format')
      }

      // In production, verify the EIP-3009 signature here:
      // 1. Verify the signature is valid
      // 2. Check that the authorization hasn't been used
      // 3. Verify the amount matches the price
      // 4. Submit to facilitator and wait for on-chain confirmation
      
      // For now, log and allow through
      console.log('[x402] Payment received:', {
        network: payment.network,
        hasAuthorization: !!payment.authorization,
      })
      
      // Allow the request to proceed
      return NextResponse.next()
    } catch (err) {
      console.error('[x402] Payment verification failed:', err)
      return new NextResponse(
        JSON.stringify({ error: 'Invalid payment' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
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
