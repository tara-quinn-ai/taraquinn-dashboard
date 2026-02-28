import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // This endpoint will be protected by x402 middleware (coming next)
  return NextResponse.json({
    product: 'openclaw-business-starter',
    downloadUrl: 'https://github.com/tara-quinn-ai/openclaw-business-starter/archive/refs/heads/main.tar.gz',
    version: '1.0.0',
  })
}
