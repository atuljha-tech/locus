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

const STEPS = [
  { time: 'T+0h',  label: 'Gentle',       color: '#2aab6f', bg: '#f0faf4', border: '#bbead0', msg: 'Hey! Just a heads-up — you owe $42 for dinner 🍜' },
  { time: 'T+24h', label: 'Nudge',        color: '#d97706', bg: '#fffbeb', border: '#fde68a', msg: 'Still waiting on that $42… your wallet called, it\'s embarrassed.' },
  { time: 'T+48h', label: 'Passive-Agg',  color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', msg: 'Oh no worries! I\'m sure you\'ve been INCREDIBLY busy. 🙂' },
  { time: 'T+72h', label: 'Scorched 🔥',  color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff', msg: 'Your debt has achieved LEGENDARY status. The blockchain has been notified. ☢️' },
]

export default function Landing() {
  const [step, setStep] = useState(0)
  const [seeding, setSeeding] = useState(false)
  const [seeded, setSeeded] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % STEPS.length), 2200)
    return () => clearInterval(t)
  }, [])

  async function seed() {
    setSeeding(true)
    await fetch('/api/seed', { method: 'POST' }).catch(() => {})
    setSeeded(true)
    setSeeding(false)
  }

  return (
    <div style={{ background: 'linear-gradient(160deg, #f0faf4 0%, #f5f7f5 40%, #faf5ff 100%)', minHeight: '100vh' }}>

      {/* Nav */}
      <nav style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e4ebe4', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>💸</span>
            <span style={{ fontWeight: 800, fontSize: 17, color: '#1a2e1a', letterSpacing: '-0.02em' }}>SplitEase</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/shame" className="btn-ghost" style={{ fontSize: 13 }}>Wall of Shame</Link>
            <Link href="/dashboard" className="btn-primary" style={{ fontSize: 13 }}>Open App →</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 20px 60px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 99, background: '#dcf5e7', color: '#197249', fontSize: 12, fontWeight: 600, marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2aab6f', display: 'inline-block', animation: 'pulseSoft 2s ease-in-out infinite' }} />
          Built for Hackathon Victory
        </div>

        <h1 style={{ fontSize: 'clamp(40px, 7vw, 80px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, color: '#1a2e1a', marginBottom: 20 }}>
          Split smarter.<br />
          <span style={{ color: '#2aab6f' }}>Collect faster.</span>
        </h1>

        <p style={{ fontSize: 18, color: '#4a5e4a', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.6 }}>
          AI-powered debt collection with escalating shame messages, group optimization, and soulbound NFTs. Your friends <em>will</em> pay.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard" className="btn-primary" style={{ fontSize: 15, padding: '13px 28px' }}>
            Launch App 🚀
          </Link>
          <button onClick={seed} disabled={seeding || seeded} className="btn-outline" style={{ fontSize: 15, padding: '13px 28px' }}>
            {seeding ? '⏳ Loading…' : seeded ? '✅ Demo ready!' : 'Load Demo Data'}
          </button>
        </div>
      </section>

      {/* Stats row */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {[
            { label: 'Total Recovered',  val: 48250, prefix: '$', color: '#2aab6f' },
            { label: 'Shame Messages',   val: 1247,  prefix: '',  color: '#d97706' },
            { label: 'NFTs Minted',      val: 89,    prefix: '',  color: '#7c3aed' },
            { label: 'Late Fees Earned', val: 3840,  prefix: '$', color: '#dc2626' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '20px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: '-0.03em' }}>
                <Counter to={s.val} prefix={s.prefix} />
              </div>
              <div style={{ fontSize: 12, color: '#8a9e8a', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 60px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: '#1a2e1a', textAlign: 'center', marginBottom: 8 }}>
          Three features judges won&apos;t have seen
        </h2>
        <p style={{ textAlign: 'center', color: '#8a9e8a', fontSize: 14, marginBottom: 36 }}>Each one is a demo moment</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {[
            {
              icon: '🤖', title: 'AI Shame Escalation',
              desc: 'Claude-powered messages that escalate from gentle to scorched-earth over 72 hours.',
              tags: ['T+0h Gentle', 'T+24h Snarky', 'T+48h Passive-Agg', 'T+72h ☢️'],
              accent: '#2aab6f', bg: '#f0faf4', border: '#bbead0',
            },
            {
              icon: '⚡', title: 'Group Debt Optimizer',
              desc: 'Minimum transaction algorithm. 5 people, 10 debts → 3 optimal transfers. CS depth.',
              tags: ['O(n log n)', 'Provably minimal', 'N-1 transfers', 'Instant'],
              accent: '#d97706', bg: '#fffbeb', border: '#fde68a',
            },
            {
              icon: '☢️', title: 'NFT of Shame',
              desc: 'Soulbound, non-transferable, permanently on-chain. There is no escape from the blockchain.',
              tags: ['Soulbound', 'Non-transferable', 'Permanent', 'On-chain forever'],
              accent: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff',
            },
          ].map(f => (
            <div key={f.title} className="card" style={{ padding: 28, borderColor: f.border, background: f.bg }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1a2e1a', marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: '#4a5e4a', lineHeight: 1.6, marginBottom: 16 }}>{f.desc}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {f.tags.map(t => (
                  <span key={t} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.7)', border: `1px solid ${f.border}`, color: f.accent, fontWeight: 600 }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Escalation demo */}
      <section style={{ maxWidth: 680, margin: '0 auto', padding: '0 20px 80px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#1a2e1a', textAlign: 'center', marginBottom: 6 }}>
          The Escalation Ladder
        </h2>
        <p style={{ textAlign: 'center', color: '#8a9e8a', fontSize: 13, marginBottom: 28 }}>Watch the AI get progressively more unhinged</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{
              padding: '16px 20px',
              borderRadius: 16,
              border: `1.5px solid ${step === i ? s.border : '#e4ebe4'}`,
              background: step === i ? s.bg : '#fff',
              transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
              transform: step === i ? 'scale(1.01)' : 'scale(1)',
              boxShadow: step === i ? `0 4px 20px ${s.border}80` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: s.color }}>{s.time}</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: s.bg, border: `1px solid ${s.border}`, color: s.color, fontWeight: 600 }}>{s.label}</span>
                {step === i && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#8a9e8a', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, display: 'inline-block', animation: 'pulseSoft 1.5s ease-in-out infinite' }} />
                  Active
                </span>}
              </div>
              <p style={{ fontSize: 13, color: '#4a5e4a', fontStyle: 'italic' }}>&ldquo;{s.msg}&rdquo;</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 80px' }}>
        <div className="card" style={{ padding: '48px 40px', textAlign: 'center', background: 'linear-gradient(135deg, #f0faf4, #fff)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💸</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: '#1a2e1a', marginBottom: 12 }}>
            Ready to collect what you&apos;re owed?
          </h2>
          <p style={{ color: '#4a5e4a', fontSize: 15, marginBottom: 28 }}>
            Load the demo, explore the features, win the hackathon.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/dashboard" className="btn-primary" style={{ fontSize: 15, padding: '13px 32px' }}>
              Open Dashboard →
            </Link>
            <Link href="/shame" className="btn-outline" style={{ fontSize: 15, padding: '13px 32px' }}>
              Wall of Shame 🔥
            </Link>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid #e4ebe4', padding: '24px 20px', textAlign: 'center', color: '#8a9e8a', fontSize: 12 }}>
        SplitEase · Next.js 14 · Prisma · Claude AI · Soulbound NFTs
      </footer>
    </div>
  )
}
