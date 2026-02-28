import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'

// In-memory store of valid download tokens (in production, use Redis or database)
const validTokens = new Map<string, { product: string; expiresAt: number }>()

// Generate a secure download token after payment verification
export function generateDownloadToken(product: string): string {
  const token = randomBytes(32).toString('hex')
  const expiresAt = Date.now() + 3600000 // 1 hour expiry
  
  validTokens.set(token, { product, expiresAt })
  
  // Clean up expired tokens
  for (const [key, value] of validTokens.entries()) {
    if (value.expiresAt < Date.now()) {
      validTokens.delete(key)
    }
  }
  
  return token
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const token = searchParams.get('token')
  const product = searchParams.get('product')

  if (!token || !product) {
    return new NextResponse('Missing token or product parameter', { status: 400 })
  }

  // Verify token
  const tokenData = validTokens.get(token)
  
  if (!tokenData) {
    return new NextResponse('Invalid or expired download token', { status: 403 })
  }

  if (tokenData.expiresAt < Date.now()) {
    validTokens.delete(token)
    return new NextResponse('Download token expired', { status: 403 })
  }

  if (tokenData.product !== product) {
    return new NextResponse('Token does not match product', { status: 403 })
  }

  // Token is valid - invalidate it (one-time use)
  validTokens.delete(token)

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
