'use client'

interface PaidDebt {
  id: string
  amount: number
  originalAmt: number
  description: string
  paidAt: string | null
  debtor: { id: string; name: string; avatar?: string | null }
  creditor: { id: string; name: string }
}

interface HallOfFameProps {
  debts: PaidDebt[]
  compact?: boolean
}

const MEDALS = ['🥇', '🥈', '🥉']

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function HallOfFame({ debts, compact = false }: HallOfFameProps) {
  const paid = debts
    .filter(d => d.paidAt)
    .sort((a, b) => b.amount - a.amount)

  if (paid.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px' }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🏆</div>
        <div style={{ fontWeight: 600, color: '#1a2e1a', marginBottom: 4 }}>No heroes yet</div>
        <div style={{ fontSize: 13, color: '#8a9e8a' }}>Paid debts will appear here</div>
      </div>
    )
  }

  const list = compact ? paid.slice(0, 3) : paid

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {list.map((debt, idx) => (
        <div
          key={debt.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: compact ? '10px 14px' : '14px 18px',
            background: idx === 0 ? 'linear-gradient(135deg, #fffbeb, #fef3c7)' :
                        idx === 1 ? 'linear-gradient(135deg, #f8fafc, #f1f5f9)' :
                        idx === 2 ? 'linear-gradient(135deg, #fff7f0, #fef0e7)' : '#fff',
            borderRadius: 14,
            border: `1.5px solid ${idx === 0 ? '#fde68a' : idx === 1 ? '#e2e8f0' : idx === 2 ? '#fed7aa' : '#e4ebe4'}`,
            transition: 'transform 0.15s',
          }}
        >
          {/* Rank */}
          <div style={{ fontSize: compact ? 20 : 24, flexShrink: 0, width: 28, textAlign: 'center' }}>
            {idx < 3 ? MEDALS[idx] : <span style={{ fontSize: 13, fontWeight: 700, color: '#8a9e8a' }}>#{idx + 1}</span>}
          </div>

          {/* Avatar */}
          <div style={{
            width: compact ? 34 : 42,
            height: compact ? 34 : 42,
            borderRadius: '50%',
            background: '#dcf5e7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: compact ? 14 : 18,
            fontWeight: 700,
            color: '#197249',
            flexShrink: 0,
            border: '2px solid #fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}>
            {debt.debtor.avatar || getInitials(debt.debtor.name)}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: compact ? 13 : 14, color: '#1a2e1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {debt.debtor.name}
            </div>
            <div style={{ fontSize: 12, color: '#8a9e8a', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {debt.description || `Paid ${debt.creditor.name}`} · {formatDate(debt.paidAt)}
            </div>
          </div>

          {/* Amount */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontWeight: 700, fontSize: compact ? 14 : 16, color: '#197249' }}>
              ${debt.amount.toFixed(2)}
            </div>
            <div style={{ fontSize: 11, color: '#8a9e8a', marginTop: 1 }}>paid</div>
          </div>
        </div>
      ))}
    </div>
  )
}
