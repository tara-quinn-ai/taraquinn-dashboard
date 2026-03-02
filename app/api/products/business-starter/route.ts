import { NextRequest, NextResponse } from 'next/server'
import { generateDownloadToken } from '@/lib/downloadTokens'

export async function GET(req: NextRequest) {
  // This endpoint is protected by x402 middleware
  // If we get here, payment was verified
  
  const productId = 'openclaw-business-starter'
  const token = generateDownloadToken(productId)
  
  const baseUrl = req.headers.get('origin') || 'https://taraquinn.ai'
  const downloadUrl = `${baseUrl}/api/download?token=${token}&product=${productId}`
  
  return NextResponse.json({
    product: productId,
    downloadUrl,
    version: '1.0.0',
    message: 'Download link expires in 1 hour',
  })
}
