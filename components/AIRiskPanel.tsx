'use client'

import { useState } from 'react'

interface RiskAnalysis {
  riskScore: number
  riskLabel: string
  riskColor: string
  prediction: string
  recommendation: string
  paymentProbability: number
  estimatedPayDate: string
}

interface AIRiskPanelProps {
  debtId: string
  debtorName: string
  amount: number
}

export default function AIRiskPanel({ debtId, debtorName, amount }: AIRiskPanelProps) {
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [shown, setShown] = useState(false)

  async function analyze() {
    if (loading) return
    setLoading(true)
    setShown(true)
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debtId }),
      })
      if (res.ok) {
        const data = await res.json()
        setAnalysis(data)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  if (!shown) {
    return (
      <button
        onClick={e => { e.stopPropagation(); analyze() }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', borderRadius: 99,
          background: 'rgba(99,102,241,0.1)',
          border: '1.5px solid rgba(99,102,241,0.25)',
          fontSize: 12, color: '#6366f1', fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        🤖 AI Risk Analysis
      </button>
    )
  }

  if (loading) {
    return (
      <div style={{
        padding: '12px 14px', borderRadius: 12,
        background: 'rgba(99,102,241,0.06)',
        border: '1px solid rgba(99,102,241,0.15)',
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 12, color: '#6366f1',
      }}>
        <span style={{
          width: 12, height: 12, borderRadius: '50%',
          border: '2px solid rgba(99,102,241,0.3)',
          borderTopColor: '#6366f1',
          animation: 'spin 0.7s linear infinite',
          display: 'inline-block', flexShrink: 0,
        }} />
        OpenClaw AI analyzing debt risk…
      </div>
    )
  }

  if (!analysis) return null

  const circumference = 2 * Math.PI * 20
  const dashOffset = circumference - (analysis.riskScore / 100) * circumference

  return (
    <div style={{
      padding: '14px',
      borderRadius: 14,
      background: 'rgba(99,102,241,0.05)',
      border: '1.5px solid rgba(99,102,241,0.15)',
      animation: 'fadeIn 0.3s ease-out',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>🤖</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1' }}>OpenClaw AI Risk Analysis</span>
        </div>
        <span style={{
          padding: '2px 8px', borderRadius: 99,
          fontSize: 10, fontWeight: 800,
          background: `${analysis.riskColor}20`,
          color: analysis.riskColor,
          letterSpacing: '0.05em',
        }}>
          {analysis.riskLabel}
        </span>
      </div>

      {/* Risk score + stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        {/* Circular gauge */}
        <div style={{ flexShrink: 0, position: 'relative', width: 56, height: 56 }}>
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="20" fill="none" stroke="#e4ebe4" strokeWidth="5" />
            <circle
              cx="28" cy="28" r="20" fill="none"
              stroke={analysis.riskColor} strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 28 28)"
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: analysis.riskColor,
          }}>
            {analysis.riskScore}
          </div>
        </div>

        {/* Stats */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#8a9e8a' }}>Pay probability</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1a2e1a' }}>{analysis.paymentProbability}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 99, background: '#eef2ee', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              width: `${analysis.paymentProbability}%`,
              background: `linear-gradient(90deg, ${analysis.riskColor}, #2aab6f)`,
              transition: 'width 1s ease-out',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#8a9e8a' }}>Est. pay date</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#4a5e4a' }}>{analysis.estimatedPayDate}</span>
          </div>
        </div>
      </div>

      {/* AI Prediction */}
      <div style={{
        padding: '8px 10px', borderRadius: 10,
        background: 'rgba(255,255,255,0.7)',
        border: '1px solid rgba(99,102,241,0.1)',
        marginBottom: 8,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', marginBottom: 3 }}>🔮 PREDICTION</div>
        <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{analysis.prediction}</div>
      </div>

      {/* Recommendation */}
      <div style={{
        padding: '8px 10px', borderRadius: 10,
        background: 'rgba(255,255,255,0.7)',
        border: '1px solid rgba(99,102,241,0.1)',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#059669', marginBottom: 3 }}>💡 RECOMMENDATION</div>
        <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.4 }}>{analysis.recommendation}</div>
      </div>
    </div>
  )
}
