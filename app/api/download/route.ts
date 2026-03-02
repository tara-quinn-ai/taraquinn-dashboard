import { NextRequest, NextResponse } from 'next/server'
import { verifyDownloadToken } from '@/lib/downloadTokens'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const token = searchParams.get('token')
  const product = searchParams.get('product')

  if (!token || !product) {
    return new NextResponse('Missing token or product parameter', { status: 400 })
  }

  // Verify and consume token
  const isValid = verifyDownloadToken(token, product)
  
  if (!isValid) {
    return new NextResponse('Invalid or expired download token', { status: 403 })
  }

  // Map product to GitHub repo URL
  const downloadUrls: Record<string, string> = {
    'openclaw-business-starter': 'https://github.com/tara-quinn-ai/openclaw-business-starter/archive/refs/heads/main.tar.gz',
    'x402-paywall-kit': 'https://github.com/tara-quinn-ai/x402-kit/archive/refs/heads/main.tar.gz',
  }

  const downloadUrl = downloadUrls[product]
  
  if (!downloadUrl) {
    return new NextResponse('Unknown product', { status: 404 })
  }

  // Redirect to the actual download
  return NextResponse.redirect(downloadUrl)
}
