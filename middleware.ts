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

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const config = paywallConfig[path as keyof typeof paywallConfig]
  
  if (!config) {
    return NextResponse.next()
  }

  // Check for x402 payment header
  const paymentHeader = request.headers.get('x-payment')
  
  if (paymentHeader) {
    // TESTING MODE: Mock payment verification
    // In production, this would verify the EIP-3009 signature
    // and check that USDC was actually transferred
    console.log('[x402 MOCK] Payment header received:', paymentHeader)
    return NextResponse.next()
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
