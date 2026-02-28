'use client'

import { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

interface PayWithUsdcProps {
  productUrl: string
  price: string
  onSuccess?: (data: any) => void
}

export function PayWithUsdc({ productUrl, price, onSuccess }: PayWithUsdcProps) {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string>('')

  const handlePayment = async () => {
    if (!isConnected) {
      // Connect wallet first
      const injectedConnector = connectors.find((c) => c.id === 'injected')
      if (injectedConnector) {
        connect({ connector: injectedConnector })
      }
      return
    }

    setStatus('loading')
    setError('')

    try {
      // Step 1: Fetch to trigger 402 response
      const response = await fetch(productUrl)
      
      if (response.status !== 402) {
        throw new Error('Expected 402 Payment Required')
      }

      const paymentData = await response.json()
      
      // Step 2: TESTING MODE - Mock payment
      // In production, this would:
      // 1. Check wallet USDC balance (must have >= $1 USDC on Base)
      // 2. Sign an EIP-3009 transferWithAuthorization message
      // 3. Send the signed authorization to the x402 facilitator
      // 4. Facilitator verifies and settles on-chain
      // 5. Return payment proof
      
      console.log('[TESTING] Mock payment - no USDC actually transferred')
      console.log('[TESTING] In production, would require', price, 'USDC on Base')
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Step 3: Retry request with payment proof
      const finalResponse = await fetch(productUrl, {
        headers: {
          'X-Payment': 'mock-signature-for-testing',
        },
      })

      if (finalResponse.ok) {
        const data = await finalResponse.json()
        setStatus('success')
        if (onSuccess) {
          onSuccess(data)
        }
      } else {
        throw new Error('Payment verification failed')
      }
    } catch (err: any) {
      setStatus('error')
      setError(err.message || 'Payment failed')
    }
  }

  if (status === 'success') {
    return (
      <div style={{ padding: '16px', background: '#10b981', color: 'white', borderRadius: '8px' }}>
        ✓ Payment successful! Download starting...
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div>
        <div style={{ padding: '16px', background: '#ef4444', color: 'white', borderRadius: '8px', marginBottom: '8px' }}>
          Error: {error}
        </div>
        <button onClick={() => setStatus('idle')} style={{ padding: '12px 24px' }}>
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={handlePayment}
        disabled={status === 'loading'}
        style={{
          padding: '12px 24px',
          background: isConnected ? '#3b82f6' : '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: status === 'loading' ? 'wait' : 'pointer',
          fontSize: '16px',
          fontWeight: '600',
        }}
      >
        {status === 'loading'
          ? 'Processing...'
          : isConnected
          ? `Pay ${price} USDC`
          : 'Connect Wallet'}
      </button>
      {isConnected && (
        <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
          Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
          {' '}
          <button onClick={() => disconnect()} style={{ fontSize: '12px', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}
