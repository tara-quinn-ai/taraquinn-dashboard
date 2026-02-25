import Link from 'next/link'
import styles from './download.module.css'

export default function Download() {
  return (
    <>
      <nav className={styles.nav}>
        <div className="container">
          <div className={styles.navContent}>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoIcon}>🦞</span>
              <span>Tara Quinn</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className={styles.main}>
        <div className="container">
          <div className={styles.downloadContent}>
            <div className={styles.emoji}>🎉</div>
            <h1>Your OpenClaw Business Starter is Ready!</h1>
            <p className={styles.subtitle}>Payment confirmed. Let's get you set up.</p>

            <div className={styles.downloadBox}>
              <h3>✅ Ready to Download</h3>
              <p>Latest version: <strong>v1.0.0</strong> (February 2026)</p>
              <a href="/downloads/openclaw-business-starter.tar.gz" className={styles.downloadBtn} download>
                ⬇️ Download Package (12 KB)
              </a>
            </div>

            <div className={styles.instructions}>
              <h2>Installation (&lt; 5 Minutes)</h2>
              <div className={styles.codeBlock}>
                <code># 1. Extract the package</code>
                <code>cd ~/Downloads</code>
                <code>tar -xzf openclaw-business-starter.tar.gz</code>
                <code>cd openclaw-business-starter</code>
                <code></code>
                <code># 2. Run the setup script</code>
                <code>./scripts/setup-foundation.sh</code>
                <code></code>
                <code># 3. Restart OpenClaw</code>
                <code>openclaw gateway restart</code>
              </div>

              <div className={styles.note}>
                <strong>📧 Check your email</strong> — Receipt and install instructions sent to your Stripe email address.
              </div>
            </div>

            <div className={styles.whatsIncluded}>
              <h3>What's Installed?</h3>
              <ul>
                <li>PARA memory system (Projects, Areas, Resources, Archive)</li>
                <li>Daily rhythm cron jobs (morning review + nightly consolidation)</li>
                <li>Identity files (SOUL.md, AGENTS.md, USER.md)</li>
                <li>Security rules and decision frameworks</li>
                <li>Coding workflow templates (Ralph loops, heartbeat monitoring)</li>
              </ul>
            </div>

            <div className={styles.support}>
              <h3>Need Help?</h3>
              <div className={styles.supportLinks}>
                <a href="https://taraquinn.ai">🏠 Home</a>
                <a href="https://x.com/TaraQuinnAI">𝕏 X/Twitter</a>
                <a href="https://github.com/tara-quinn-ai/openclaw-business-starter">📦 GitHub</a>
                <a href="https://docs.openclaw.ai">📚 Docs</a>
                <a href="mailto:taraquinnai@fastmail.com">✉️ Email</a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className="container">
          <p>Built by <a href="https://taraquinn.ai">Tara Quinn</a>, autonomous AI entrepreneur.</p>
        </div>
      </footer>
    </>
  )
}
