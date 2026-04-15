'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const LocusPayButton = dynamic(() => import('@/components/LocusPayButton'), { ssr: false })

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

const TIER_META = [
  { label: 'Gentle',      color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   icon: '😅' },
  { label: 'Snarky',      color: '#eab308', bg: 'rgba(234,179,8,0.12)',   icon: '🙃' },
  { label: 'Passive-Agg', color: '#f97316', bg: 'rgba(249,115,22,0.12)',  icon: '😤' },
  { label: '☢️ Scorched', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: '🔥' },
]

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function TimeAgo({ date }: { date: string }) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000))
  if (days === 0) return <span style={{ color: '#f97316' }}>Due today</span>
  return <span style={{ color: '#ef4444' }}>{days}d overdue</span>
}

function Particles() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1.5,
            height: i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1.5,
            borderRadius: '50%',
            background: i % 4 === 0 ? '#ef4444' : i % 4 === 1 ? '#a855f7' : i % 4 === 2 ? '#f97316' : '#eab308',
            left: `${(i * 23 + 7) % 100}%`,
            top: `${(i * 17 + 13) % 100}%`,
            opacity: 0.3 + (i % 5) * 0.08,
            animation: `float${i % 4} ${6 + (i % 4)}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}
    </div>
  )
}

function CopyShareLink({ debtorId, debtorName }: { debtorId: string; debtorName: string }) {
  const [copied, setCopied] = useState(false)
  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/shame/${debtorId}`

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={copy}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '6px 14px', borderRadius: 99,
        background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)',
        border: `1px solid ${copied ? '#22c55e44' : '#ef444440'}`,
        color: copied ? '#22c55e' : '#f87171',
        fontSize: 12, fontWeight: 600, cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {copied ? '✓ Copied!' : '🔗 Share shame'}
    </button>
  )
}

function StatCard({ value, label, color, icon }: { value: string; label: string; color: string; icon: string }) {
  return (
    <div style={{
      flex: 1,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 20,
      padding: '20px 24px',
      textAlign: 'center',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  )
}

function DebtCard({ debt, rank }: { debt: ShamedDebt; rank: number }) {
  const [open, setOpen] = useState(false)
  const [paying, setPaying] = useState(false)

  const tier = debt.shameMessages?.[0]?.tier ?? 0
  const tierMeta = TIER_META[Math.min(tier, 3)]
  const daysOverdue = debt.dueDate
    ? Math.max(0, Math.floor((Date.now() - new Date(debt.dueDate).getTime()) / 86400000))
    : 0
  const totalOwed = debt.amount + (debt.lateFee ?? 0)
  const isNFT = !!debt.shameToken
  const initials = debt.debtor.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  const cardBorder = isNFT
    ? 'rgba(168,85,247,0.4)'
    : tier >= 3 ? 'rgba(239,68,68,0.4)'
    : tier >= 2 ? 'rgba(249,115,22,0.3)'
    : 'rgba(255,255,255,0.08)'

  const cardGlow = isNFT
    ? '0 0 40px rgba(168,85,247,0.15)'
    : tier >= 3 ? '0 0 40px rgba(239,68,68,0.1)' : 'none'

  return (
    <div
      style={{
        borderRadius: 20,
        border: `1.5px solid ${cardBorder}`,
        background: isNFT
          ? 'linear-gradient(135deg, rgba(88,28,135,0.2) 0%, rgba(30,10,50,0.8) 100%)'
          : 'rgba(15,15,20,0.7)',
        backdropFilter: 'blur(16px)',
        overflow: 'hidden',
        boxShadow: cardGlow,
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = isNFT
          ? '0 8px 60px rgba(168,85,247,0.25)' : '0 8px 40px rgba(239,68,68,0.12)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = cardGlow
      }}
    >
      {/* Rank banner */}
      <div style={{
        padding: '8px 18px',
        background: isNFT ? 'rgba(168,85,247,0.2)' : 'rgba(239,68,68,0.1)',
        borderBottom: `1px solid ${cardBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: 11, fontWeight: 800, letterSpacing: '0.12em',
          color: isNFT ? '#c084fc' : '#f87171',
          textTransform: 'uppercase',
        }}>
          #{rank} Deadbeat {rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : ''}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isNFT && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
              background: 'rgba(168,85,247,0.25)', color: '#c084fc',
              border: '1px solid rgba(168,85,247,0.4)',
            }}>
              ☢️ NFT MINTED
            </span>
          )}
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
            background: tierMeta.bg, color: tierMeta.color,
            border: `1px solid ${tierMeta.color}30`,
          }}>
            {tierMeta.icon} {tierMeta.label}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '20px 20px 16px',
          cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 16,
        }}
      >
        {/* Avatar */}
        <div style={{
          width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
          background: isNFT
            ? 'linear-gradient(135deg, #7c3aed, #4c1d95)'
            : `linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.1))`,
          border: `2px solid ${isNFT ? 'rgba(168,85,247,0.5)' : 'rgba(239,68,68,0.3)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: debt.debtor.avatar ? 26 : 16, fontWeight: 800,
          color: isNFT ? '#e9d5ff' : '#f87171',
          boxShadow: isNFT ? '0 0 20px rgba(168,85,247,0.3)' : undefined,
        }}>
          {debt.debtor.avatar ?? initials}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontWeight: 800, fontSize: 17, color: '#fff' }}>{debt.debtor.name}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>owes</span>
            <span style={{ fontWeight: 600, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{debt.creditor.name}</span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 8, lineHeight: 1.4 }}>
            {debt.description}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {debt.dueDate && <TimeAgo date={debt.dueDate} />}
            {(debt.lateFee ?? 0) > 0 && (
              <span style={{ fontSize: 12, color: '#f97316', fontWeight: 600 }}>
                +{formatCurrency(debt.lateFee)} in fees
              </span>
            )}
          </div>
        </div>

        {/* Amount */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontSize: 28, fontWeight: 900, color: '#f87171',
            letterSpacing: '-0.04em', lineHeight: 1,
          }}>
            {formatCurrency(totalOwed)}
          </div>
          {(debt.lateFee ?? 0) > 0 && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
              {formatCurrency(debt.amount)} + fees
            </div>
          )}
          <div style={{
            fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s', display: 'inline-block',
          }}>▼</div>
        </div>
      </div>

      {/* Shame message bubble */}
      {debt.shameMessages?.[0] && (
        <div style={{
          margin: '0 20px 16px',
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14,
          fontSize: 13, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic',
          lineHeight: 1.5,
        }}>
          &ldquo;{debt.shameMessages[0].message}&rdquo;
        </div>
      )}

      {/* Expanded section */}
      {open && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.07)',
          padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: 14,
          animation: 'fadeInDown 0.2s ease-out',
        }}>
          {/* Shame meter */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>SHAME METER</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: tierMeta.color }}>{tierMeta.label} {tierMeta.icon}</span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                width: `${Math.min(((tier + 1) / 4) * 100, 100)}%`,
                background: `linear-gradient(90deg, #22c55e, ${tierMeta.color})`,
                transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
              }} />
            </div>
          </div>

          {/* NFT info */}
          {debt.shameToken && (
            <div style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(88,28,135,0.1))',
              border: '1.5px solid rgba(168,85,247,0.3)',
              borderRadius: 14,
            }}>
              <div style={{ fontWeight: 700, color: '#c084fc', fontSize: 13, marginBottom: 6 }}>
                ☢️ Soulbound NFT — Permanently On-Chain
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                Token: #{debt.shameToken.tokenId}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Tx: {debt.shameToken.txHash.slice(0, 30)}…
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <CopyShareLink debtorId={debt.debtor.id} debtorName={debt.debtor.name} />
            <Link
              href={`/shame/${debt.debtor.id}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '6px 14px', borderRadius: 99,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.6)',
                fontSize: 12, fontWeight: 600,
                textDecoration: 'none', transition: 'all 0.2s',
              }}
            >
              👁 View Profile
            </Link>

            {/* Real PayWithLocus Button */}
            <div onClick={e => e.stopPropagation()}>
              <LocusPayButton
                debtId={debt.id}
                amount={totalOwed}
                debtorName={debt.debtor.name}
                description={debt.description}
                onSuccess={() => window.location.reload()}
                onError={(m) => console.error(m)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function LiveTicker({ debts }: { debts: ShamedDebt[] }) {
  const items = debts.length > 0 ? debts.map(d =>
    `🔥 ${d.debtor.name} owes ${formatCurrency(d.amount + (d.lateFee ?? 0))} — "${d.description}"`
  ) : [
    '🔥 Mike owes $120 — "Airbnb split"',
    '⚠️ Late fees accumulating every 24hrs',
    '☢️ NFTs minted for debts 3+ days overdue',
    '💸 Pay via Locus USDC — instant settlement',
  ]
  const doubled = [...items, ...items]

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: 'rgba(239,68,68,0.06)',
      border: '1px solid rgba(239,68,68,0.15)',
      borderRadius: 12, padding: '10px 0',
    }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 60, background: 'linear-gradient(to right, #0a0a0f, transparent)', zIndex: 2 }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 60, background: 'linear-gradient(to left, #0a0a0f, transparent)', zIndex: 2 }} />
      <div className="ticker-inner" style={{ display: 'flex', animation: 'ticker 40s linear infinite', width: 'max-content' }}>
        {doubled.map((item, i) => (
          <span key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '0 32px', fontSize: 12, fontWeight: 600,
            color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap',
          }}>
            {item}
            <span style={{ color: 'rgba(239,68,68,0.4)', marginLeft: 8 }}>•</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export default function WallOfShame() {
  const [debts, setDebts] = useState<ShamedDebt[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'nft' | 'nuclear'>('all')

  const load = useCallback(() => {
    fetch('/api/shame')
      .then(r => r.json())
      .then(d => { setDebts(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = debts.filter(d => {
    if (filter === 'nft') return !!d.shameToken
    if (filter === 'nuclear') return (d.shameMessages?.[0]?.tier ?? 0) >= 3
    return true
  })

  const totalShamed = debts.reduce((s, d) => s + d.amount + (d.lateFee ?? 0), 0)
  const nftCount = debts.filter(d => d.shameToken).length
  const totalFees = debts.reduce((s, d) => s + (d.lateFee ?? 0), 0)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0a0a0f 0%, #0f0a1a 50%, #0a0f0a 100%)',
      position: 'relative',
      overflowX: 'hidden',
    }}>
      <style>{`
        @keyframes fadeInDown { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes float0 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes float1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
        @keyframes float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes float3 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-22px)} }
        @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes pulseRed { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.3)} 50%{box-shadow:0 0 0 8px rgba(239,68,68,0)} }
      `}</style>

      {/* Background orbs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '40%', right: '5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        {/* Grid pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        <Particles />
      </div>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(239,68,68,0.15)',
        padding: '0 20px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          textDecoration: 'none', transition: 'opacity 0.2s',
        }}>
          <span style={{ fontSize: 20 }}>☢️</span>
          <span style={{ fontWeight: 800, fontSize: 15, color: '#fff', letterSpacing: '-0.02em' }}>
            Splitwise Enforcer
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%', background: '#ef4444',
              animation: 'pulseRed 2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>LIVE</span>
          </div>
          <Link href="/dashboard" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 16px', borderRadius: 99, textDecoration: 'none',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)',
            transition: 'all 0.2s',
          }}>
            ← Dashboard
          </Link>
        </div>
      </nav>

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '52px 20px 80px', position: 'relative', zIndex: 10 }}>

        {/* Hero Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 16px', borderRadius: 99,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            fontSize: 12, fontWeight: 700, color: '#f87171',
            letterSpacing: '0.08em', marginBottom: 20,
          }}>
            🏛️ PUBLIC LEDGER OF DISHONOR
          </div>

          <h1 style={{
            fontSize: 'clamp(44px, 8vw, 88px)',
            fontWeight: 900, letterSpacing: '-0.05em',
            lineHeight: 0.95, marginBottom: 20,
            background: 'linear-gradient(135deg, #f87171 0%, #fb923c 40%, #facc15 80%, #f87171 100%)',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'gradientShift 4s ease-in-out infinite',
          }}>
            Wall of<br />Shame
          </h1>
          <style>{`@keyframes gradientShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }`}</style>

          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', maxWidth: 460, margin: '0 auto 36px', lineHeight: 1.6 }}>
            These people owe money and have been <strong style={{ color: 'rgba(255,255,255,0.7)' }}>publicly shamed</strong>. 
            Their dishonor is recorded <strong style={{ color: 'rgba(255,255,255,0.7)' }}>permanently on-chain</strong>.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 600, margin: '0 auto' }}>
            <StatCard value={formatCurrency(totalShamed)} label="Total Shamed" color="#f87171" icon="💸" />
            <StatCard value={String(debts.length)} label="Active Deadbeats" color="#fb923c" icon="👤" />
            <StatCard value={String(nftCount)} label="NFTs Minted" color="#c084fc" icon="☢️" />
            <StatCard value={formatCurrency(totalFees)} label="Late Fees" color="#facc15" icon="⏰" />
          </div>
        </div>

        {/* Live Ticker */}
        {!loading && <div style={{ marginBottom: 32 }}><LiveTicker debts={debts} /></div>}

        {/* Filter tabs */}
        {!loading && debts.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
            {([ ['all', '🔥 All Deadbeats'], ['nuclear', '☢️ Nuclear Tier'], ['nft', '🎨 NFT Holders'] ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                style={{
                  padding: '8px 18px', borderRadius: 99, cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, border: 'none', transition: 'all 0.2s',
                  background: filter === key ? '#ef4444' : 'rgba(255,255,255,0.06)',
                  color: filter === key ? '#fff' : 'rgba(255,255,255,0.5)',
                  boxShadow: filter === key ? '0 4px 20px rgba(239,68,68,0.4)' : 'none',
                }}
              >
                {label} {key === 'all' ? `(${debts.length})` : key === 'nft' ? `(${nftCount})` : `(${debts.filter(d => (d.shameMessages?.[0]?.tier ?? 0) >= 3).length})`}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: 120, borderRadius: 20,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 75%)',
                backgroundSize: '200% 100%', animation: 'shimmer 1.6s infinite',
              }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 24,
          }}>
            {debts.length === 0 ? (
              <>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                  Nobody's shamed right now
                </h2>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', maxWidth: 340, margin: '0 auto 28px' }}>
                  Load demo data from the landing page to see the Wall of Shame in action.
                </p>
                <Link href="/" style={{
                  display: 'inline-block', padding: '12px 28px', borderRadius: 99,
                  background: '#ef4444', color: '#fff', textDecoration: 'none',
                  fontWeight: 700, fontSize: 14,
                  boxShadow: '0 4px 20px rgba(239,68,68,0.4)',
                }}>
                  Load Demo Data →
                </Link>
              </>
            ) : (
              <>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No debtors match this filter.</p>
                <button onClick={() => setFilter('all')} style={{
                  marginTop: 16, padding: '8px 20px', borderRadius: 99,
                  background: 'rgba(255,255,255,0.08)', border: 'none',
                  color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer',
                }}>
                  Show all
                </button>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map((debt, i) => (
              <DebtCard key={debt.id} debt={debt} rank={i + 1} />
            ))}
          </div>
        )}

        {/* How PayWithLocus works */}
        <div style={{
          marginTop: 60,
          padding: '32px',
          borderRadius: 24,
          background: 'linear-gradient(135deg, rgba(65,1,246,0.12) 0%, rgba(89,52,255,0.08) 100%)',
          border: '1.5px solid rgba(89,52,255,0.25)',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(180deg, #5934FF 0%, #4101F6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.2)"/>
                <path d="M8 12h8M12 8v8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#a78bfa' }}>Powered by PayWithLocus</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Real USDC settlement · Instant · On-chain</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              { icon: '⚡', text: 'Instant USDC settlement on Solana' },
              { icon: '🔒', text: 'Non-custodial — you control your funds' },
              { icon: '📋', text: 'Automatic debt marking upon payment' },
              { icon: '🌐', text: 'Works worldwide, no banks needed' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{ textAlign: 'center', marginTop: 60, paddingTop: 40, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>
            Someone owes you money? Make them face the consequences.
          </p>
          <Link href="/dashboard" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 32px', borderRadius: 99, textDecoration: 'none',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: '#fff', fontWeight: 700, fontSize: 15,
            boxShadow: '0 4px 24px rgba(239,68,68,0.35)',
            transition: 'all 0.2s',
          }}>
            Start Enforcing 🔥
          </Link>
        </div>
      </main>
    </div>
  )
}
