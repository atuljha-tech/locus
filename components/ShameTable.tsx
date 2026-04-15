'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import Locus button to avoid SSR issues
const LocusPayButton = dynamic(() => import('./LocusPayButton'), { ssr: false })
const LocusPayButtonFallback = dynamic(
  () => import('./LocusPayButton').then(m => ({ default: m.LocusPayButtonFallback })),
  { ssr: false }
)
const AIRiskPanel = dynamic(() => import('./AIRiskPanel'), { ssr: false })

export interface Debt {
  id: string
  amount: number
  originalAmt: number
  description: string
  status: 'PENDING' | 'OVERDUE' | 'SHAMED' | 'PAID'
  dueDate: string | null
  paidAt: string | null
  daysOverdue: number
  lateFee: number
  totalOwed: number
  createdAt: string
  debtor: { id: string; name: string; avatar?: string | null }
  creditor: { id: string; name: string; avatar?: string | null }
  shameMessages: { id: string; message: string; tier: number; sentAt: string }[]
  shameToken: { tokenId: string; txHash: string; mintedAt: string } | null
}

interface ShameTableProps {
  debts: Debt[]
  onShame: (debtId: string) => Promise<void>
  onMintNFT: (debtId: string) => Promise<void>
  onMarkPaid: (debtId: string) => Promise<void>
  loadingId: string | null
}

const STATUS_BORDER: Record<Debt['status'], string> = {
  PAID:    '#2aab6f',
  OVERDUE: '#ef4444',
  PENDING: '#f59e0b',
  SHAMED:  '#a855f7',
}

const STATUS_BADGE: Record<Debt['status'], { bg: string; color: string; label: string }> = {
  PAID:    { bg: '#dcf5e7', color: '#197249', label: 'Paid' },
  OVERDUE: { bg: '#ffe0e0', color: '#dc2626', label: 'Overdue' },
  PENDING: { bg: '#fff3e0', color: '#c2410c', label: 'Pending' },
  SHAMED:  { bg: '#faf5ff', color: '#7c3aed', label: 'Shamed' },
}

const SHAME_TIER_COLORS = ['#2aab6f', '#f59e0b', '#f97316', '#ef4444', '#a855f7']

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ShameMeter({ tier }: { tier: number }) {
  const pct = Math.min((tier / 3) * 100, 100)
  const color = SHAME_TIER_COLORS[Math.min(tier, 4)]
  const labels = ['Clean', 'Nudge', 'Roast', 'Nuclear']
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#8a9e8a' }}>Shame Meter</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{labels[Math.min(tier, 3)]}</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: '#eef2ee', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          width: `${pct}%`,
          background: `linear-gradient(90deg, #2aab6f, ${color})`,
          transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
        }} />
      </div>
    </div>
  )
}

function DebtRow({ debt, onShame, onMintNFT, onMarkPaid, loadingId }: {
  debt: Debt
  onShame: (id: string) => Promise<void>
  onMintNFT: (id: string) => Promise<void>
  onMarkPaid: (id: string) => Promise<void>
  loadingId: string | null
}) {
  const [expanded, setExpanded] = useState(false)
  const isLoading = loadingId === debt.id
  const badge = STATUS_BADGE[debt.status]
  const borderColor = STATUS_BORDER[debt.status]
  const lastShame = debt.shameMessages[0]
  const tier = lastShame?.tier ?? 0
  const canMintNFT = debt.daysOverdue >= 3 && debt.status !== 'PAID'

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        border: `1.5px solid ${debt.status === 'OVERDUE' ? '#fca5a5' : '#e4ebe4'}`,
        borderLeft: `4px solid ${borderColor}`,
        overflow: 'hidden',
        transition: 'box-shadow 0.2s',
        boxShadow: debt.status === 'OVERDUE' ? '0 0 0 3px rgba(239,68,68,0.08)' : 'none',
      }}
    >
      {/* Main row */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: debt.status === 'OVERDUE' ? '#ffe0e0' :
                      debt.status === 'SHAMED'  ? '#faf5ff' :
                      debt.status === 'PAID'    ? '#dcf5e7' : '#fff3e0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: debt.debtor.avatar ? 20 : 14,
          fontWeight: 700,
          color: debt.status === 'OVERDUE' ? '#dc2626' :
                 debt.status === 'SHAMED'  ? '#7c3aed' :
                 debt.status === 'PAID'    ? '#197249' : '#c2410c',
          flexShrink: 0,
          border: '2px solid #fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}>
          {debt.debtor.avatar || getInitials(debt.debtor.name)}
        </div>

        {/* Names + description */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1a2e1a' }}>{debt.debtor.name}</span>
            <span style={{ fontSize: 12, color: '#8a9e8a' }}>→</span>
            <span style={{ fontWeight: 600, fontSize: 13, color: '#4a5e4a' }}>{debt.creditor.name}</span>
          </div>
          <div style={{ fontSize: 12, color: '#8a9e8a', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {debt.description || 'No description'}
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: debt.status === 'PAID' ? '#197249' : '#1a2e1a' }}>
            ${debt.totalOwed.toFixed(2)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '2px 8px', borderRadius: 99,
              fontSize: 11, fontWeight: 600,
              background: badge.bg, color: badge.color,
            }}>
              {badge.label}
            </span>
            {debt.daysOverdue > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '2px 7px', borderRadius: 99,
                fontSize: 10, fontWeight: 700,
                background: '#ffe0e0', color: '#dc2626',
              }}>
                {debt.daysOverdue}d
              </span>
            )}
          </div>
          {debt.lateFee > 0 && (
            <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>
              +${debt.lateFee.toFixed(2)} fee
            </div>
          )}
        </div>

        {/* Chevron */}
        <div style={{
          fontSize: 12, color: '#8a9e8a', marginLeft: 4, flexShrink: 0,
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
        }}>▼</div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div style={{
          borderTop: '1px solid #e4ebe4',
          padding: '16px',
          background: '#fafbfa',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          animation: 'fadeIn 0.2s ease-out',
        }}>
          {/* Shame meter */}
          {debt.status !== 'PAID' && <ShameMeter tier={tier} />}

          {/* Last shame message */}
          {lastShame && (
            <div style={{
              padding: '10px 14px',
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #e4ebe4',
              fontSize: 13,
              color: '#374151',
              fontStyle: 'italic',
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#8a9e8a', fontStyle: 'normal', display: 'block', marginBottom: 4 }}>
                Last shame · Tier {lastShame.tier} · {formatDate(lastShame.sentAt)}
              </span>
              "{lastShame.message}"
            </div>
          )}

          {/* NFT info */}
          {debt.shameToken && (
            <div style={{
              padding: '10px 14px',
              background: 'linear-gradient(135deg, #faf5ff, #f5f0ff)',
              borderRadius: 12,
              border: '1.5px solid #e9d5ff',
              fontSize: 13,
            }}>
              <div style={{ fontWeight: 700, color: '#7c3aed', marginBottom: 4 }}>🎨 NFT of Shame Minted</div>
              <div style={{ fontSize: 11, color: '#8a9e8a', fontFamily: 'monospace' }}>
                Token #{debt.shameToken.tokenId} · {debt.shameToken.txHash.slice(0, 18)}…
              </div>
              <div style={{ fontSize: 11, color: '#8a9e8a', marginTop: 2 }}>
                Minted {formatDate(debt.shameToken.mintedAt)}
              </div>
            </div>
          )}

          {/* Due date */}
          {debt.dueDate && (
            <div style={{ fontSize: 12, color: '#8a9e8a' }}>
              Due: <span style={{ fontWeight: 600, color: '#374151' }}>{formatDate(debt.dueDate)}</span>
              {debt.daysOverdue > 0 && (
                <span style={{ color: '#ef4444', fontWeight: 600 }}> · {debt.daysOverdue} days overdue</span>
              )}
            </div>
          )}

          {/* AI Risk Panel */}
          {debt.status !== 'PAID' && (
            <div onClick={e => e.stopPropagation()}>
              <AIRiskPanel
                debtId={debt.id}
                debtorName={debt.debtor.name}
                amount={debt.totalOwed}
              />
            </div>
          )}

          {/* Action buttons */}
          {debt.status !== 'PAID' && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={e => { e.stopPropagation(); onShame(debt.id) }}
                disabled={isLoading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 99,
                  background: '#fff3e0', color: '#c2410c',
                  border: '1.5px solid #fed7aa',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  transition: 'all 0.15s',
                }}
              >
                🔥 {isLoading ? 'Sending…' : 'Send Shame'}
              </button>

              {canMintNFT && !debt.shameToken && (
                <button
                  onClick={e => { e.stopPropagation(); onMintNFT(debt.id) }}
                  disabled={isLoading}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 99,
                    background: 'linear-gradient(135deg, #faf5ff, #f5f0ff)',
                    color: '#7c3aed',
                    border: '1.5px solid #e9d5ff',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    opacity: isLoading ? 0.6 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  🎨 {isLoading ? 'Minting…' : 'Mint NFT'}
                </button>
              )}

              <button
                onClick={e => { e.stopPropagation(); onMarkPaid(debt.id) }}
                disabled={isLoading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 99,
                  background: '#dcf5e7', color: '#197249',
                  border: '1.5px solid #bbead0',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  transition: 'all 0.15s',
                }}
              >
                ✅ {isLoading ? 'Updating…' : 'Mark Paid'}
              </button>

              {/* ── Locus USDC Payment ── */}
              <div onClick={e => e.stopPropagation()}>
                <LocusPayButton
                  debtId={debt.id}
                  amount={debt.totalOwed}
                  debtorName={debt.debtor.name}
                  description={debt.description}
                  onSuccess={(txHash) => {
                    onMarkPaid(debt.id)
                  }}
                  onError={(msg) => console.error('Locus pay error:', msg)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ShameTable({ debts, onShame, onMintNFT, onMarkPaid, loadingId }: ShameTableProps) {
  if (debts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 16px' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>💸</div>
        <div style={{ fontWeight: 600, fontSize: 16, color: '#1a2e1a', marginBottom: 6 }}>No debts here</div>
        <div style={{ fontSize: 13, color: '#8a9e8a' }}>All clear — everyone's settled up</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {debts.map(debt => (
        <DebtRow
          key={debt.id}
          debt={debt}
          onShame={onShame}
          onMintNFT={onMintNFT}
          onMarkPaid={onMarkPaid}
          loadingId={loadingId}
        />
      ))}
    </div>
  )
}
