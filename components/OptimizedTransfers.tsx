'use client'

import { OptimalTransfer } from '@/lib/split'

interface OptimizedTransfersProps {
  transfers: OptimalTransfer[]
  originalCount: number
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const AVATAR_COLORS = [
  { bg: '#dcf5e7', color: '#197249' },
  { bg: '#ffe0e0', color: '#dc2626' },
  { bg: '#faf5ff', color: '#7c3aed' },
  { bg: '#eff6ff', color: '#1d4ed8' },
  { bg: '#fff3e0', color: '#c2410c' },
  { bg: '#f0fdf4', color: '#15803d' },
]

function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function OptimizedTransfers({ transfers, originalCount }: OptimizedTransfersProps) {
  const saved = originalCount - transfers.length

  if (transfers.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px' }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>⚡</div>
        <div style={{ fontWeight: 600, color: '#1a2e1a', marginBottom: 4 }}>All settled up!</div>
        <div style={{ fontSize: 13, color: '#8a9e8a' }}>No transfers needed right now</div>
      </div>
    )
  }

  return (
    <div>
      {/* Savings badge */}
      {saved > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
          padding: '10px 14px',
          background: '#f0faf4',
          borderRadius: 12,
          border: '1px solid #bbead0',
        }}>
          <span style={{ fontSize: 16 }}>⚡</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#197249' }}>
            Eliminated {saved} transaction{saved !== 1 ? 's' : ''}
          </span>
          <span style={{ fontSize: 12, color: '#4a5e4a' }}>
            — {originalCount} → {transfers.length} payments needed
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {transfers.map((t, i) => {
          const fromColor = avatarColor(t.fromName)
          const toColor = avatarColor(t.toName)
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 18px',
                background: '#fff',
                borderRadius: 16,
                border: '1.5px solid #e4ebe4',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.borderColor = '#86d9ae'
                el.style.boxShadow = '0 4px 16px rgba(42,171,111,0.08)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.borderColor = '#e4ebe4'
                el.style.boxShadow = 'none'
              }}
            >
              {/* Step number */}
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: '#f0faf4', color: '#197249',
                fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {i + 1}
              </div>

              {/* From avatar */}
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: fromColor.bg, color: fromColor.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, flexShrink: 0,
                border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              }}>
                {getInitials(t.fromName)}
              </div>

              {/* From name */}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2e1a' }}>{t.fromName}</div>
                <div style={{ fontSize: 11, color: '#8a9e8a' }}>pays</div>
              </div>

              {/* Arrow + amount */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ height: 1, flex: 1, background: '#e4ebe4' }} />
                <div style={{
                  padding: '4px 12px',
                  background: '#f0faf4',
                  borderRadius: 99,
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#197249',
                  whiteSpace: 'nowrap',
                }}>
                  ${t.amount.toFixed(2)}
                </div>
                <div style={{ height: 1, flex: 1, background: '#e4ebe4' }} />
              </div>

              {/* To name */}
              <div style={{ minWidth: 0, textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2e1a' }}>{t.toName}</div>
                <div style={{ fontSize: 11, color: '#8a9e8a' }}>receives</div>
              </div>

              {/* To avatar */}
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: toColor.bg, color: toColor.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, flexShrink: 0,
                border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              }}>
                {getInitials(t.toName)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
