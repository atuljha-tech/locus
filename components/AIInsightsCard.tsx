'use client'

import { useState, useEffect } from 'react'

interface GroupInsight {
  summary: string
  topDebtor: string
  totalAtRisk: number
  aiInsight: string
  actionItems: string[]
}

export default function AIInsightsCard() {
  const [insight, setInsight] = useState<GroupInsight | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    try {
      const res = await fetch('/api/ai/insights?type=group')
      if (res.ok) {
        const data = await res.json()
        setInsight(data)
      }
    } catch { /* ignore */ }
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
        border: '1.5px solid #ddd6fe',
        borderRadius: 20,
        padding: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 18 }}>🤖</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#5b21b6' }}>OpenClaw AI Insights</span>
          <span style={{
            padding: '2px 8px', borderRadius: 99,
            background: 'rgba(124,58,237,0.15)', color: '#7c3aed',
            fontSize: 10, fontWeight: 700,
          }}>LIVE</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[80, 60, 90].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: 14, width: `${w}%`, borderRadius: 7 }} />
          ))}
        </div>
      </div>
    )
  }

  if (!insight) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
      border: '1.5px solid #ddd6fe',
      borderRadius: 20,
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 100, height: 100, borderRadius: '50%',
        background: 'rgba(124,58,237,0.08)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'rgba(124,58,237,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>🤖</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#5b21b6' }}>OpenClaw AI Insights</div>
            <div style={{ fontSize: 10, color: '#8b5cf6' }}>Powered by claw_dev API</div>
          </div>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          style={{
            padding: '4px 10px', borderRadius: 99,
            background: 'rgba(124,58,237,0.1)',
            border: '1px solid rgba(124,58,237,0.2)',
            fontSize: 11, color: '#7c3aed', fontWeight: 600,
            cursor: 'pointer',
            opacity: refreshing ? 0.6 : 1,
          }}
        >
          {refreshing ? '⏳' : '↻'} Refresh
        </button>
      </div>

      {/* Summary */}
      <div style={{
        padding: '10px 12px', borderRadius: 12,
        background: 'rgba(255,255,255,0.6)',
        border: '1px solid rgba(124,58,237,0.1)',
        marginBottom: 12,
        fontSize: 13, color: '#374151', lineHeight: 1.5,
      }}>
        {insight.summary}
      </div>

      {/* AI Insight */}
      <div style={{
        padding: '10px 12px', borderRadius: 12,
        background: 'rgba(124,58,237,0.08)',
        border: '1px solid rgba(124,58,237,0.15)',
        marginBottom: 12,
        display: 'flex', gap: 8, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
        <div style={{ fontSize: 12, color: '#5b21b6', lineHeight: 1.5, fontStyle: 'italic' }}>
          {insight.aiInsight}
        </div>
      </div>

      {/* Action items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', letterSpacing: '0.05em', marginBottom: 2 }}>
          RECOMMENDED ACTIONS
        </div>
        {insight.actionItems.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            fontSize: 12, color: '#374151',
          }}>
            <span style={{
              width: 18, height: 18, borderRadius: '50%',
              background: 'rgba(124,58,237,0.15)',
              color: '#7c3aed', fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginTop: 1,
            }}>{i + 1}</span>
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
