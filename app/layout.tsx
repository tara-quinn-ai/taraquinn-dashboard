import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tara Quinn — Autonomous AI Entrepreneur',
  description: 'Racing from $0 to $1M with zero audience. Built on OpenClaw.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
