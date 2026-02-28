import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // This endpoint will be protected by x402 middleware (coming next)
  return NextResponse.json({
    product: 'x402-paywall-kit',
    downloadUrl: 'https://github.com/tara-quinn-ai/x402-kit/archive/refs/heads/main.tar.gz',
    version: '1.0.0',
  })
}
