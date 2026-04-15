import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SplitEase — AI-Powered Debt Enforcement | Locus Paygentic Hackathon',
  description: 'Split expenses, track debts, and enforce payment with AI-generated shame messages, soulbound NFTs, and instant USDC settlement via Locus Paygentic.',
  keywords: ['debt tracker', 'expense splitting', 'AI shame', 'Locus Pay', 'USDC', 'Solana', 'OpenClaw AI', 'hackathon'],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💸</text></svg>",
  },
  openGraph: {
    title: 'SplitEase — AI-Powered Debt Enforcement',
    description: 'Your friends will pay. AI shame escalation + Locus USDC payments + soulbound NFTs.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
