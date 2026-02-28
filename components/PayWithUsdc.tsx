'use client'

import { useState } from 'react'
import { useAccount, useConnect, useDisconnect, useWalletClient, useChainId, useSwitchChain, usePublicClient } from 'wagmi'
import { base } from 'wagmi/chains'
import { parseUnits, type Address } from 'viem'

interface PayWithUsdcProps {
  productUrl: string
  price: string
  onSuccess?: (data: any) => void
}

// Base mainnet USDC contract
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address

// ERC-20 ABI for balanceOf
const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

export function PayWithUsdc({ productUrl, price, onSuccess }: PayWithUsdcProps) {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  
  const [status, setStatus] = useState<'idle' | 'checking' | 'approving' | 'paying' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string>('')
  const [step, setStep] = useState<string>('')

  const handlePayment = async () => {
    if (!isConnected) {
      const injectedConnector = connectors.find((c) => c.id === 'injected')
      if (injectedConnector) {
        connect({ connector: injectedConnector })
      }
      return
    }

    // Check if on Base network
    if (chainId !== base.id) {
      try {
        await switchChain({ chainId: base.id })
      } catch (err: any) {
        setError('Please switch to Base network in your wallet')
        return
      }
    }

    setStatus('checking')
    setError('')
    setStep('Checking USDC balance...')

    try {
      if (!publicClient || !walletClient || !address) {
        throw new Error('Wallet not ready')
      }

      // Step 1: Get payment requirements
      const response = await fetch(productUrl)
      
      if (response.status !== 402) {
        throw new Error('Product endpoint not configured for crypto payments')
      }

      const paymentData = await response.json()
      const paymentRequired = paymentData.paymentRequired

      if (!paymentRequired) {
        throw new Error('No payment requirements returned')
      }

      // Parse amount ($1 = 1,000,000 USDC with 6 decimals)
      const amountInDollars = parseFloat(paymentRequired.amount)
      const usdcAmount = parseUnits(amountInDollars.toString(), 6)

      // Step 2: Check USDC balance
      const balance = await publicClient.readContract({
        address: USDC_BASE,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      })

      if (balance < usdcAmount) {
        const balanceFormatted = (Number(balance) / 1e6).toFixed(2)
        throw new Error(`Insufficient USDC. You have $${balanceFormatted}, need $${amountInDollars}`)
      }

      setStep(`Confirming payment of $${price}...`)
      setStatus('paying')

      // Step 3: Use x402 SDK to create payment
      const { x402HTTPClient } = await import('@x402/core/client')
      const { x402Client } = await import('@x402/core/client')
      const { ExactEvmScheme, toClientEvmSigner } = await import('@x402/evm')
      
      // Create signer from wallet
      const signer = toClientEvmSigner({
        address: address,
        signTypedData: async (message: any) => {
          return await walletClient.signTypedData(message)
        },
      }, publicClient)

      // Create x402 client
      const x402 = new x402Client().register(
        paymentRequired.network,
        new ExactEvmScheme(signer)
      )
      
      const httpClient = new x402HTTPClient(x402)

      // Step 4: Make payment and get proof
      setStep('Creating payment authorization...')
      
      const paymentProof = await httpClient.payAndRetry(
        productUrl,
        undefined,
        {
          headers: {},
          body: undefined,
        }
      )

      setStep('Payment successful!')
      setStatus('success')
      
      // The x402 SDK handled the retry, response should be the product download
      if (paymentProof.ok) {
        const data = await paymentProof.json()
        if (onSuccess) {
          setTimeout(() => onSuccess(data), 500)
        }
      } else {
        throw new Error('Payment processed but download failed')
      }
      
    } catch (err: any) {
      console.error('Payment error:', err)
      setStatus('error')
      setError(err.message || err.shortMessage || 'Payment failed')
      setStep('')
    }
  }

  if (status === 'success') {
    return (
      <div style={{ padding: '16px', background: '#10b981', color: 'white', borderRadius: '8px' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
          ✓ Payment confirmed!
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {step}
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div>
        <div style={{ padding: '16px', background: '#ef4444', color: 'white', borderRadius: '8px', marginBottom: '12px' }}>
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>Payment Error</div>
          <div style={{ fontSize: '14px' }}>{error}</div>
        </div>
        <button 
          onClick={() => { setStatus('idle'); setError(''); setStep(''); }}
          style={{ 
            padding: '10px 20px', 
            background: '#6366f1', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          Try Again
        </button>
      </div>
    )
  }

  const isWrongNetwork = isConnected && chainId !== base.id
  const isProcessing = status === 'checking' || status === 'approving' || status === 'paying'

  return (
    <div>
      <button
        onClick={handlePayment}
        disabled={isProcessing}
        style={{
          width: '100%',
          padding: '14px 24px',
          background: isProcessing ? '#9ca3af' : isWrongNetwork ? '#f59e0b' : isConnected ? '#3b82f6' : '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isProcessing ? 'wait' : 'pointer',
          fontSize: '16px',
          fontWeight: '600',
          transition: 'all 0.2s',
        }}
      >
        {isProcessing
          ? step || 'Processing...'
          : isWrongNetwork
          ? 'Switch to Base Network'
          : isConnected
          ? `Pay ${price} USDC`
          : 'Connect Wallet'}
      </button>
      
      {isConnected && (
        <div style={{ marginTop: '10px', fontSize: '13px', color: '#6b7280', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            {address?.slice(0, 6)}...{address?.slice(-4)}
            {chainId !== base.id && <span style={{ color: '#f59e0b', marginLeft: '8px', fontWeight: '600' }}>⚠ Wrong network</span>}
          </span>
          <button 
            onClick={() => disconnect()} 
            style={{ 
              fontSize: '12px', 
              color: '#6366f1',
              textDecoration: 'underline', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            Disconnect
          </button>
        </div>
      )}
      
      {isConnected && chainId === base.id && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#059669', background: '#d1fae5', padding: '10px', borderRadius: '6px', border: '1px solid #10b981' }}>
          <strong>Real USDC payment:</strong> You need {price} USDC on Base network. This will actually transfer USDC from your wallet.
        </div>
      )}
    </div>
  )
}
