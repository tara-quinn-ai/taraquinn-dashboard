import { randomBytes } from 'crypto'

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

// Verify and consume a download token
export function verifyDownloadToken(token: string, product: string): boolean {
  const tokenData = validTokens.get(token)
  
  if (!tokenData) {
    return false
  }

  if (tokenData.expiresAt < Date.now()) {
    validTokens.delete(token)
    return false
  }

  if (tokenData.product !== product) {
    return false
  }

  // Token is valid - invalidate it (one-time use)
  validTokens.delete(token)
  return true
}
