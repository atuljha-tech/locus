'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

function Counter({ to, prefix = '', suffix = '', duration = 1800 }: {
  to: number; prefix?: string; suffix?: string; duration?: number
}) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const t0 = Date.now()
        const tick = () => {
          const p = Math.min((Date.now() - t0) / duration, 1)
          const ease = 1 - Math.pow(1 - p, 3)
          setVal(Math.round(ease * to))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [to, duration])
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>
}

const ESCALATION_STEPS = [
  { time: 'T+0h',  label: 'Gentle',       color: '#2aab6f', bg: '#f0faf4', border: '#bbead0', msg: 'Hey! Just a heads-up — you owe $42 for dinner 🍜' },
  { time: 'T+24h', label: 'Snarky',        color: '#d97706', bg: '#fffbeb', border: '#fde68a', msg: 'Still waiting on that $42… your wallet called, it\'s embarrassed.' },
  { time: 'T+48h', label: 'Passive-Agg',   color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', msg: 'Oh no worries! I\'m sure you\'ve been INCREDIBLY busy. 🙂' },
  { time: 'T+72h', label: '☢️ Scorched',   color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff', msg: 'Your debt has achieved LEGENDARY status. The blockchain has been notified. ☢️' },
]

const FEATURES = [
  {
    icon: '🤖',
    title: 'OpenClaw AI Shame Engine',
    desc: 'Dynamically escalating shame messages powered by OpenClaw AI. From gentle nudges to scorched-earth roasts — each message uniquely crafted for maximum impact.',
    badge: 'AI-Powered',
    badgeColor: '#7c3aed',
    badgeBg: '#faf5ff',
    color: '#7c3aed',
    bg: 'linear-gradient(135deg, #faf5ff, #f5f0ff)',
    border: '#e9d5ff',
  },
  {
    icon: '⚡',
    title: 'Debt Optimizer Algorithm',
    desc: 'Minimum transaction algorithm reduces N×(N-1) payments to at most N-1 optimal transfers. O(n log n), provably minimal. Real CS behind the magic.',
    badge: 'O(n log n)',
    badgeColor: '#d97706',
    badgeBg: '#fffbeb',
    color: '#d97706',
    bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
    border: '#fde68a',
  },
  {
    icon: '☢️',
    title: 'Soulbound NFT of Shame',
    desc: 'After 3+ days overdue, mint a permanent, non-transferable Certificate of Shame on-chain. There is no escape from the blockchain.',
    badge: 'On-Chain',
    badgeColor: '#dc2626',
    badgeBg: '#fff1f1',
    color: '#dc2626',
    bg: 'linear-gradient(135deg, #fff1f1, #ffe4e4)',
    border: '#fca5a5',
  },
  {
    icon: '⚡',
    title: 'Locus Paygentic USDC',
    desc: 'Instant USDC settlement on Solana via Locus Paygentic. One-click payment popup, on-chain confirmation, automatic debt resolution. No more "I\'ll Venmo you later."',
    badge: 'Locus Pay',
    badgeColor: '#197249',
    badgeBg: '#f0faf4',
    color: '#197249',
    bg: 'linear-gradient(135deg, #f0faf4, #dcf5e7)',
    border: '#bbead0',
  },
]

export default function Landing() {
  const [step, setStep] = useState(0)
  const [seeding, setSeeding] = useState(false)
  const [seeded, setSeeded] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % ESCALATION_STEPS.length), 2400)
    return () => clearInterval(t)
  }, [])

  async function seed() {
    setSeeding(true)
    await fetch('/api/seed', { method: 'POST' }).catch(() => {})
    setSeeded(true)
    setSeeding(false)
  }

  const current = ESCALATION_STEPS[step]

  return (
    <div style={{ background: 'linear-gradient(160deg, #f0faf4 0%, #f5f7f5 40%, #faf5ff 100%)', minHeight: '100vh' }}>

      {/* Nav */}
      <nav style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #e4ebe4',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>💸</span>
            <span style={{ fontWeight: 800, fontSize: 17, color: '#1a2e1a', letterSpacing: '-0.02em' }}>SplitEase</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              color: '#fff', letterSpacing: '0.04em',
              boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
            }}>AI</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/shame" style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '8px 16px', borderRadius: 99,
              background: 'transparent', color: '#4a5e4a',
              border: 'none', fontSize: 13, fontWeight: 500,
              cursor: 'pointer', textDecoration: 'none',
              transition: 'all 0.15s',
            }}>
              🏛️ Wall of Shame
            </Link>
            <Link href="/dashboard" style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '9px 20px', borderRadius: 99,
              background: '#2aab6f', color: '#fff',
              fontSize: 13, fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(42,171,111,0.3)',
              transition: 'all 0.2s',
            }}>
              Open App →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center' }}>
        {/* Hackathon badge */}
        <div style={{ marginBottom: 24 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 18px', borderRadius: 99,
            background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(42,171,111,0.1))',
            border: '1px solid rgba(124,58,237,0.2)',
            fontSize: 12, fontWeight: 700, color: '#5b21b6',
            letterSpacing: '0.04em',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #2aab6f)',
              animation: 'pulseSoft 2s ease-in-out infinite',
              display: 'inline-block',
            }} />
            🏆 Locus Paygentic Hackathon — Built with OpenClaw AI + Locus Pay
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(40px, 7vw, 80px)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 1.05,
          color: '#1a2e1a',
          marginBottom: 20,
        }}>
          Split smarter.<br />
          <span style={{ color: '#2aab6f' }}>Collect faster.</span>
        </h1>

        <p style={{ fontSize: 18, color: '#4a5e4a', maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.6 }}>
          AI-powered debt enforcement with escalating shame messages, group optimization, soulbound NFTs, and instant USDC settlement via Locus Paygentic.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '14px 28px', borderRadius: 99,
            background: '#2aab6f', color: '#fff',
            fontSize: 15, fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(42,171,111,0.35)',
            transition: 'all 0.2s',
          }}>
            Launch App 🚀
          </Link>
          <button
            onClick={seed}
            disabled={seeding || seeded}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '14px 28px', borderRadius: 99,
              background: 'transparent', color: '#1a2e1a',
              fontSize: 15, fontWeight: 600,
              border: '1.5px solid #e4ebe4',
              cursor: seeding || seeded ? 'not-allowed' : 'pointer',
              opacity: seeding ? 0.7 : 1,
              transition: 'all 0.2s',
            }}
          >
            {seeding ? '⏳ Loading…' : seeded ? '✅ Demo ready!' : '🎭 Load Demo Data'}
          </button>
        </div>
      </section>

      {/* Stats */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {[
            { label: 'Total Recovered',  val: 48250, prefix: '$', color: '#2aab6f', bg: '#f0faf4', border: '#bbead0' },
            { label: 'Shame Messages',   val: 1247,  prefix: '',  color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
            { label: 'NFTs Minted',      val: 89,    prefix: '',  color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff' },
            { label: 'Avg Recovery',     val: 94,    prefix: '',  suffix: '%', color: '#197249', bg: '#dcf5e7', border: '#bbead0' },
          ].map(s => (
            <div key={s.label} style={{
              padding: '20px 24px',
              background: s.bg,
              borderRadius: 20,
              border: `1.5px solid ${s.border}`,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color, letterSpacing: '-0.03em' }}>
                <Counter to={s.val} prefix={s.prefix} suffix={s.suffix ?? ''} />
              </div>
              <div style={{ fontSize: 12, color: '#8a9e8a', fontWeight: 500, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Escalation demo */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 99,
              background: '#fff3e0', border: '1px solid #fed7aa',
              fontSize: 11, fontWeight: 700, color: '#c2410c',
              marginBottom: 16, letterSpacing: '0.04em',
            }}>
              🔥 AI SHAME ESCALATION
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#1a2e1a', letterSpacing: '-0.03em', marginBottom: 16, lineHeight: 1.2 }}>
              From gentle nudge to scorched earth in 72 hours
            </h2>
            <p style={{ fontSize: 15, color: '#4a5e4a', lineHeight: 1.7, marginBottom: 24 }}>
              OpenClaw AI generates uniquely crafted shame messages that escalate automatically. Each tier is more devastating than the last — ending with a blockchain-immortalized Certificate of Shame.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ESCALATION_STEPS.map((s, i) => (
                <div
                  key={i}
                  onClick={() => setStep(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 12,
                    background: step === i ? s.bg : 'transparent',
                    border: `1.5px solid ${step === i ? s.border : 'transparent'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                    background: step === i ? s.bg : '#f0f4f0',
                    color: step === i ? s.color : '#8a9e8a',
                    border: `1px solid ${step === i ? s.border : '#e4ebe4'}`,
                    whiteSpace: 'nowrap',
                  }}>{s.time}</span>
                  <span style={{ fontSize: 13, fontWeight: step === i ? 700 : 500, color: step === i ? s.color : '#8a9e8a' }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live demo card */}
          <div style={{
            background: '#fff',
            borderRadius: 24,
            border: `2px solid ${current.border}`,
            padding: '28px',
            boxShadow: `0 8px 40px ${current.color}18`,
            transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{
                padding: '5px 12px', borderRadius: 99,
                background: current.bg, border: `1px solid ${current.border}`,
                fontSize: 11, fontWeight: 700, color: current.color,
              }}>
                {current.time} · {current.label}
              </div>
              <div style={{
                marginLeft: 'auto',
                width: 8, height: 8, borderRadius: '50%',
                background: current.color,
                animation: 'pulseSoft 1.5s ease-in-out infinite',
              }} />
            </div>

            <div style={{
              padding: '16px 18px',
              background: current.bg,
              borderRadius: 14,
              border: `1px solid ${current.border}`,
              fontSize: 14, color: '#374151', lineHeight: 1.6,
              fontStyle: 'italic',
              marginBottom: 20,
              minHeight: 80,
              display: 'flex', alignItems: 'center',
              transition: 'all 0.3s ease',
            }}>
              "{current.msg}"
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 99,
                background: 'rgba(124,58,237,0.08)',
                border: '1px solid rgba(124,58,237,0.2)',
                fontSize: 11, color: '#7c3aed', fontWeight: 600,
              }}>
                🤖 OpenClaw AI
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 99,
                background: '#f0faf4',
                border: '1px solid #bbead0',
                fontSize: 11, color: '#197249', fontWeight: 600,
              }}>
                ⚡ Locus Pay
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#1a2e1a', letterSpacing: '-0.03em', marginBottom: 12 }}>
            Built to win
          </h2>
          <p style={{ fontSize: 16, color: '#4a5e4a', maxWidth: 480, margin: '0 auto' }}>
            Four features that judges haven't seen before — each with real technical depth.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{
              padding: '28px',
              background: f.bg,
              borderRadius: 24,
              border: `1.5px solid ${f.border}`,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.transform = 'translateY(-4px)'
                el.style.boxShadow = `0 12px 40px ${f.color}18`
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.transform = 'translateY(0)'
                el.style.boxShadow = 'none'
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 14 }}>{f.icon}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#1a2e1a' }}>{f.title}</div>
              </div>
              <p style={{ fontSize: 13, color: '#4a5e4a', lineHeight: 1.7, marginBottom: 14 }}>{f.desc}</p>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 12px', borderRadius: 99,
                background: f.badgeBg, color: f.badgeColor,
                fontSize: 11, fontWeight: 700,
                border: `1px solid ${f.border}`,
              }}>
                {f.badge}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Locus Paygentic section */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #f0faf4 0%, #dcf5e7 100%)',
          borderRadius: 28,
          border: '2px solid #bbead0',
          padding: '48px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -40, right: -40,
            width: 200, height: 200, borderRadius: '50%',
            background: 'rgba(42,171,111,0.08)',
            pointerEvents: 'none',
          }} />
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 99,
            background: 'rgba(42,171,111,0.15)',
            border: '1px solid #bbead0',
            fontSize: 11, fontWeight: 700, color: '#197249',
            marginBottom: 20, letterSpacing: '0.04em',
          }}>
            ⚡ LOCUS PAYGENTIC INTEGRATION
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#1a2e1a', letterSpacing: '-0.03em', marginBottom: 16 }}>
            Instant USDC settlement on Solana
          </h2>
          <p style={{ fontSize: 16, color: '#4a5e4a', maxWidth: 560, margin: '0 auto 28px', lineHeight: 1.7 }}>
            One-click payment via Locus Paygentic. Debtors pay in USDC, settlement is confirmed on-chain, and the debt is automatically resolved. No more "I'll pay you back."
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['USDC on Solana', 'On-chain confirmation', 'Automatic resolution', 'Webhook-powered'].map(tag => (
              <span key={tag} style={{
                padding: '8px 16px', borderRadius: 99,
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid #bbead0',
                fontSize: 13, fontWeight: 600, color: '#197249',
              }}>
                ✓ {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, color: '#1a2e1a', letterSpacing: '-0.03em', marginBottom: 16 }}>
          Your friends <em>will</em> pay.
        </h2>
        <p style={{ fontSize: 16, color: '#4a5e4a', marginBottom: 32 }}>
          Load the demo and see the full shame escalation in action.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '14px 32px', borderRadius: 99,
            background: '#2aab6f', color: '#fff',
            fontSize: 15, fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(42,171,111,0.35)',
          }}>
            Launch App 🚀
          </Link>
          <Link href="/shame" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '14px 32px', borderRadius: 99,
            background: 'transparent', color: '#1a2e1a',
            fontSize: 15, fontWeight: 600,
            border: '1.5px solid #e4ebe4',
            textDecoration: 'none',
          }}>
            🏛️ Wall of Shame
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #e4ebe4',
        padding: '24px',
        textAlign: 'center',
        background: 'rgba(255,255,255,0.5)',
      }}>
        <div style={{ fontSize: 13, color: '#8a9e8a' }}>
          Built for <strong style={{ color: '#1a2e1a' }}>Locus Paygentic Hackathon</strong> ·
          Powered by <strong style={{ color: '#7c3aed' }}>OpenClaw AI</strong> ·
          Payments by <strong style={{ color: '#2aab6f' }}>Locus Pay</strong>
        </div>
      </footer>
    </div>
  )
}
