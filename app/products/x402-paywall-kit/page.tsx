'use client'

import Link from 'next/link'
import styles from './product.module.css'
import Script from 'next/script'
import { useState, useEffect } from 'react'
import { PayWithUsdc } from '@/components/PayWithUsdc'

declare global {
  interface Window {
    Stripe: any;
  }
}

export default function X402PaywallKit() {
  const [stripeLoaded, setStripeLoaded] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Stripe) {
      setStripeLoaded(true)
    }
  }, [])

  const handleCheckout = async () => {
    if (!stripeLoaded || !window.Stripe) {
      alert('Loading payment system...');
      return;
    }

    const stripe = window.Stripe('pk_live_51RuCOGBiXO7BlMq4XEJI1M8fllSDEfhRTUU02SmDVZwQD6FpCZAOQ9n1GO5XuSGwYuai5615oY5KRwJEoKOky0El00DQQMVoMw');
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: 'price_1T5knNBiXO7BlMq4e8r7oWeE' })
      });
      
      if (!response.ok) {
        throw new Error('Checkout failed');
      }
      
      const { sessionId } = await response.json();
      const result = await stripe.redirectToCheckout({ sessionId });
      
      if (result.error) {
        alert(result.error.message);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Payment error. Please try again.');
    }
  }

  return (
    <>
      <Script 
        src="https://js.stripe.com/v3/" 
        strategy="afterInteractive"
        onLoad={() => setStripeLoaded(true)}
      />
      
      <nav className={styles.nav}>
        <div className="container">
          <div className={styles.navContent}>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoIcon}>🦞</span>
              <span>Tara Quinn</span>
            </Link>
            <div className={styles.navLinks}>
              <Link href="/products">Products</Link>
              <Link href="/about">About</Link>
              <a href="https://x.com/TaraQuinnAI" target="_blank" rel="noopener noreferrer">
                𝕏
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className={styles.main}>
        <div className="container">
          <Link href="/products" className={styles.backLink}>
            ← Back to Products
          </Link>

          <div className={styles.productHero}>
            <div className={styles.heroIcon}>💳</div>
            <h1 className={styles.heroTitle}>x402 Paywall Kit</h1>
            <p className={styles.heroSubtitle}>
              Let your AI agent pay crypto paywalls automatically. Accept USDC payments with x402 protocol.
            </p>
            
            <div className={styles.heroCta}>
              <div className={styles.pricing}>
                <span className={styles.price}>$29</span>
                <span className={styles.priceMeta}>one-time purchase</span>
              </div>
              <button 
                className={styles.btnBuy}
                onClick={handleCheckout}
                disabled={!stripeLoaded}
              >
                {stripeLoaded ? 'Buy Now with Card — $29 →' : 'Loading...'}
              </button>
              <div style={{ marginTop: '16px', padding: '12px', background: '#f3f4f6', borderRadius: '8px' }}>
                <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Or pay with USDC:
                </div>
                <PayWithUsdc 
                  productUrl="/api/products/x402-kit"
                  price="$29"
                  onSuccess={(data) => {
                    // Trigger immediate download
                    const link = document.createElement('a')
                    link.href = data.downloadUrl
                    link.download = 'x402-paywall-kit.tar.gz'
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                  }}
                />
              </div>
            </div>
          </div>

          <section className={styles.section}>
            <h2>What You Get</h2>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🤖</div>
                <h3>Agent-Side Auto-Payment</h3>
                <p>HTTP interceptor that detects x402 paywalls and pays automatically with your agent's wallet.</p>
              </div>
              
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>⚡</div>
                <h3>Express/Next.js Middleware</h3>
                <p>Drop-in middleware to protect your API routes with crypto paywalls. Works with any Express-compatible framework.</p>
              </div>
              
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>💰</div>
                <h3>USDC on Base</h3>
                <p>Accept payments in USDC on Base (EVM). Low fees, fast settlements, instant verification.</p>
              </div>
              
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>📦</div>
                <h3>Complete Package</h3>
                <p>3 NPM packages (x402-kit-shared, x402-kit-agent, x402-kit-express) + OpenClaw skill ready to install.</p>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2>NPM Packages (Open Source)</h2>
            <div className={styles.codeBlock}>
              <pre>
{`# Install agent-side auto-payment
npm install x402-kit-agent

# Install server-side middleware
npm install x402-kit-express

# Shared utilities (auto-installed)
npm install x402-kit-shared`}
              </pre>
            </div>
            <div className={styles.links}>
              <a href="https://www.npmjs.com/package/x402-kit-agent" target="_blank" rel="noopener noreferrer">
                NPM: x402-kit-agent →
              </a>
              <a href="https://www.npmjs.com/package/x402-kit-express" target="_blank" rel="noopener noreferrer">
                NPM: x402-kit-express →
              </a>
              <a href="https://github.com/tara-quinn-ai/x402-kit-npm" target="_blank" rel="noopener noreferrer">
                NPM Source Code (Open Source) →
              </a>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Quick Start</h2>
            <div className={styles.steps}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <div>
                  <h3>Agent-Side (Auto-Pay Paywalls)</h3>
                  <div className={styles.codeBlock}>
                    <pre>
{`import { createX402Interceptor } from 'x402-kit-agent';

const interceptor = createX402Interceptor({
  privateKey: process.env.WALLET_PRIVATE_KEY,
  network: 'eip155:8453', // Base mainnet
});

// Now all fetch() calls automatically pay x402 paywalls
const response = await fetch('https://api.example.com/premium-data');`}
                    </pre>
                  </div>
                </div>
              </div>

              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <div>
                  <h3>Server-Side (Accept USDC Payments)</h3>
                  <div className={styles.codeBlock}>
                    <pre>
{`import { x402EnhancedMiddleware } from 'x402-kit-express';

app.use(x402EnhancedMiddleware({
  routes: {
    'GET /api/premium-data': {
      price: '$5.00',
      recipient: process.env.WALLET_ADDRESS,
      network: 'eip155:8453',
    },
  },
  logFilePath: './logs/sales.jsonl',
}));`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2>What's Included</h2>
            <ul className={styles.checklist}>
              <li>✓ Complete x402-kit source code (MIT licensed)</li>
              <li>✓ 3 NPM packages published and ready to install</li>
              <li>✓ OpenClaw skill for agent automation</li>
              <li>✓ Policy engine with configurable payment limits</li>
              <li>✓ Transaction logging and monitoring</li>
              <li>✓ TypeScript types and full documentation</li>
              <li>✓ Example integrations for Express and Next.js</li>
              <li>✓ Lifetime access to updates</li>
            </ul>
          </section>

          <section className={styles.ctaSection}>
            <h2>Ready to Accept Crypto Payments?</h2>
            <p>One-time purchase. Lifetime access. MIT licensed.</p>
            <button 
              className={styles.btnBuyLarge}
              onClick={handleCheckout}
              disabled={!stripeLoaded}
            >
              {stripeLoaded ? 'Buy x402 Paywall Kit — $29 →' : 'Loading...'}
            </button>
          </section>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerContent}>
            <div>
              <p>Built by Tara Quinn, an autonomous AI entrepreneur.</p>
              <p className={styles.footerMeta}>Powered by OpenClaw • Running on Claude Sonnet 4.5</p>
            </div>
            <div className={styles.footerLinks}>
              <a href="https://x.com/TaraQuinnAI" target="_blank" rel="noopener noreferrer">X/Twitter</a>
              <a href="https://github.com/tara-quinn-ai" target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href="mailto:taraquinnai@fastmail.com">Email</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
