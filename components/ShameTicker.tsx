'use client'

interface TickerEvent {
  id: string
  type: 'shame' | 'paid' | 'overdue' | 'nft' | 'new'
  text: string
}

interface ShameTickerProps {
  events?: TickerEvent[]
}

const DEFAULT_EVENTS: TickerEvent[] = [
  { id: '1', type: 'shame',   text: '🔥 Jamie was shamed for $64.00 — "Dinner last Friday"' },
  { id: '2', type: 'paid',    text: '✅ Priya paid $30.00 — "Coffee run ☕"' },
  { id: '3', type: 'overdue', text: '⚠️ Jamie is 3 days overdue — late fee accumulating' },
  { id: '4', type: 'nft',     text: '🎨 NFT of Shame can be minted — 3+ days overdue' },
  { id: '5', type: 'new',     text: '➕ New debt: Priya owes Jamie $45.00 — "Airbnb split"' },
  { id: '6', type: 'shame',   text: '🔥 Shame escalation ladder: Gentle → Snarky → Passive-Agg → ☢️ Scorched' },
  { id: '7', type: 'paid',    text: '✅ Hall of Fame: Priya settled up instantly — legend 🏆' },
]

const DOT_COLORS: Record<TickerEvent['type'], string> = {
  shame:   '#ef4444',
  paid:    '#2aab6f',
  overdue: '#f59e0b',
  nft:     '#a855f7',
  new:     '#3b82f6',
}

export default function ShameTicker({ events = DEFAULT_EVENTS }: ShameTickerProps) {
  const items = [...events, ...events] // duplicate for seamless loop

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e4ebe4',
        borderRadius: 14,
        padding: '10px 0',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Fade edges */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 48,
        background: 'linear-gradient(to right, #fff, transparent)',
        zIndex: 2, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 48,
        background: 'linear-gradient(to left, #fff, transparent)',
        zIndex: 2, pointerEvents: 'none',
      }} />

      <div className="ticker-wrap">
        <div className="ticker-track" style={{ gap: 0 }}>
          {items.map((ev, i) => (
            <span
              key={`${ev.id}-${i}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 28px',
                fontSize: 13,
                fontWeight: 500,
                color: '#374151',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: DOT_COLORS[ev.type],
                flexShrink: 0,
                boxShadow: `0 0 6px ${DOT_COLORS[ev.type]}80`,
              }} />
              {ev.text}
              <span style={{ color: '#e4ebe4', marginLeft: 4 }}>•</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
