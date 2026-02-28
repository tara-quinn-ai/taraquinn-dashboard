'use client'

import { useState } from 'react'
import { useAccount, useConnect, useDisconnect, useWalletClient, useChainId, useSwitchChain, usePublicClient } from 'wagmi'
import { base } from 'wagmi/chains'
import { parseUnits, type Address, type Hash } from 'viem'

interface PayWithUsdcProps {
  productUrl: string
  price: string
  onSuccess?: (data: any) => void
}

// Base mainnet USDC contract
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address

// ERC-20 ABI
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
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
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
  
  const [status, setStatus] = useState<'idle' | 'checking' | 'transferring' | 'verifying' | 'success' | 'error'>('idle')
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
    setStep('Getting payment details...')

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

      const recipientAddress = paymentRequired.recipient as Address

      // Parse amount ($1 = 1,000,000 USDC with 6 decimals)
      const amountInDollars = parseFloat(paymentRequired.amount)
      const usdcAmount = parseUnits(amountInDollars.toString(), 6)

      setStep('Checking USDC balance...')

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

      setStep(`Sending ${price} USDC...`)
      setStatus('transferring')

      // Step 3: Transfer USDC directly
      const txHash = await walletClient.writeContract({
        address: USDC_BASE,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [recipientAddress, usdcAmount],
      })

      console.log('[Payment] USDC transfer submitted:', txHash)
      
      setStep('Waiting for blockchain confirmation...')
      setStatus('verifying')

      // Step 4: Wait for transaction to be mined
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations: 1,
      })

      if (receipt.status !== 'success') {
        throw new Error('Transaction failed on blockchain')
      }

      console.log('[Payment] Transaction confirmed:', txHash)
      
      setStep('Verifying payment...')

      // Step 5: Send transaction hash to backend for verification
      const verifyResponse = await fetch(productUrl, {
        headers: {
          'X-Payment': JSON.stringify({
            protocol: 'x402',
            version: '2.0',
            network: paymentRequired.network,
            txHash: txHash,
          }),
        },
      })

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || 'Payment verification failed')
      }

      const downloadData = await verifyResponse.json()
      
      setStep('Payment confirmed!')
      setStatus('success')
      
      console.log('[Payment] ✓ Payment verified, download ready')
      
      if (onSuccess) {
        setTimeout(() => onSuccess(downloadData), 500)
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
          ✓ Payment confirmed on blockchain!
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          Download starting...
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div>
        <div style={{ padding: '16px', background: '#ef4444', color: 'white', borderRadius: '8px', marginBottom: '12px' }}>
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>Payment Failed</div>
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
  const isProcessing = status !== 'idle'

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
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#dc2626', background: '#fee2e2', padding: '10px', borderRadius: '6px', border: '1px solid #ef4444', fontWeight: '600' }}>
          ⚠️ LIVE PAYMENT: This will transfer {price} USDC from your wallet. Not a test!
        </div>
      )}
    </div>
  )
}
