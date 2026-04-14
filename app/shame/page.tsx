'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/fees'

interface ShamedDebt {
  id: string
  amount: number
  lateFee: number
  description: string
  status: string
  dueDate?: string
  debtor: { id: string; name: string; avatar?: string }
  creditor: { name: string }
  shameMessages?: { message: string; tier: number }[]
  shameToken?: { tokenId: string; txHash: string; mintedAt: string } | null
}

const TIER_COLORS = ['text-green-400', 'text-yellow-400', 'text-orange-400', 'text-red-400']
const TIER_LABELS = ['Mild', 'Snarky', 'Passive-Agg', '☢️ Scorched Earth']

export default function WallOfShame() {
  const [debts, setDebts] = useState<ShamedDebt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/shame')
      .then(r => r.json())
      .then(d => { setDebts(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const totalShamed = debts.reduce((s, d) => s + d.amount + (d.lateFee ?? 0), 0)
  const nftCount    = debts.filter(d => d.shameToken).length

  return (
    <div className="min-h-screen bg-dark-900 relative overflow-hidden">
      {/* Dramatic background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-red-900/20 to-transparent" />
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-red-500/20">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="text-xl">☢️</span>
          <span className="font-bold">Splitwise Enforcer</span>
        </Link>
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Dashboard
        </Link>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4 animate-bounce-slow">🔥</div>
          <h1 className="text-5xl font-black mb-4">
            <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Wall of Shame
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            These people owe money and have been publicly shamed. Permanently.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-8">
            <div className="text-center">
              <div className="text-3xl font-black text-red-400">{formatCurrency(totalShamed)}</div>
              <div className="text-xs text-gray-500">Total Shamed</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-3xl font-black text-orange-400">{debts.length}</div>
              <div className="text-xs text-gray-500">Active Deadbeats</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-3xl font-black text-purple-400">{nftCount}</div>
              <div className="text-xs text-gray-500">NFTs Minted</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">
            <div className="text-4xl mb-4 animate-spin-slow">☢️</div>
            <p>Loading the shameful...</p>
          </div>
        ) : debts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-xl text-gray-400">No one is shamed right now.</p>
            <p className="text-gray-600 mt-2">Load demo data from the landing page to see the wall in action.</p>
            <Link href="/" className="inline-block mt-6 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium transition-all">
              Go to Landing Page
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {debts.map((debt, i) => {
              const tier = debt.shameMessages?.[0]?.tier ?? 0
              const daysOverdue = debt.dueDate
                ? Math.floor((Date.now() - new Date(debt.dueDate).getTime()) / (1000 * 60 * 60 * 24))
                : 0

              return (
                <div
                  key={debt.id}
                  className={`rounded-2xl border overflow-hidden transition-all hover:scale-[1.01]
                    ${debt.shameToken
                      ? 'border-purple-500/40 bg-gradient-to-r from-purple-900/20 to-red-900/20'
                      : 'border-red-500/30 bg-red-500/5'}`}
                >
                  {/* Rank banner */}
                  <div className={`px-4 py-1.5 text-xs font-bold flex items-center justify-between
                    ${debt.shameToken ? 'bg-purple-500/20 text-purple-300' : 'bg-red-500/20 text-red-300'}`}>
                    <span>#{i + 1} DEADBEAT</span>
                    {debt.shameToken && <span>☢️ SOULBOUND NFT MINTED</span>}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-full bg-dark-700 border-2 border-red-500/30 flex items-center justify-center text-2xl flex-shrink-0">
                        {debt.debtor.avatar ?? '👤'}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-xl font-bold text-white">{debt.debtor.name}</h3>
                          <span className="text-gray-500 text-sm">owes</span>
                          <span className="text-white font-medium">{debt.creditor.name}</span>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{debt.description}</p>
                        <div className="flex items-center gap-3 flex-wrap text-xs">
                          <span className="text-red-400">
                            {daysOverdue > 0 ? `${daysOverdue} days overdue` : 'Due soon'}
                          </span>
                          {debt.lateFee > 0 && (
                            <span className="text-orange-400">+{formatCurrency(debt.lateFee)} in fees</span>
                          )}
                          <span className={TIER_COLORS[Math.min(tier, 3)]}>
                            {TIER_LABELS[Math.min(tier, 3)]}
                          </span>
                        </div>

                        {/* Last shame message */}
                        {debt.shameMessages?.[0] && (
                          <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10">
                            <p className="text-sm text-gray-300 italic">
                              &ldquo;{debt.shameMessages[0].message}&rdquo;
                            </p>
                          </div>
                        )}

                        {/* NFT details */}
                        {debt.shameToken && (
                          <div className="mt-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                            <div className="text-xs font-semibold text-purple-300 mb-1">
                              ☢️ Soulbound NFT — Permanently on-chain
                            </div>
                            <div className="text-xs text-gray-400 font-mono">
                              Token: {debt.shameToken.tokenId}
                            </div>
                            <div className="text-xs text-gray-500 font-mono truncate">
                              Tx: {debt.shameToken.txHash}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              Minted: {new Date(debt.shameToken.mintedAt).toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Amount */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-3xl font-black text-red-400">
                          {formatCurrency(debt.amount + (debt.lateFee ?? 0))}
                        </div>
                        {debt.lateFee > 0 && (
                          <div className="text-xs text-gray-500">
                            {formatCurrency(debt.amount)} + {formatCurrency(debt.lateFee)} fees
                          </div>
                        )}
                        <Link
                          href={`/shame/${debt.debtor.id}`}
                          className="inline-block mt-2 text-xs px-3 py-1 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 transition-colors"
                        >
                          Share shame →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer CTA */}
        <div className="text-center mt-12 py-8 border-t border-white/10">
          <p className="text-gray-500 text-sm mb-4">
            Know someone who owes you money?
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium transition-all hover:scale-105"
          >
            Start Enforcing →
          </Link>
        </div>
      </main>
    </div>
  )
}
