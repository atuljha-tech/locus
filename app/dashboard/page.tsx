'use client'

import { useState, useEffect, useCallback } from 'react'
import ShameTable, { Debt } from '@/components/ShameTable'
import HallOfFame from '@/components/HallOfFame'
import OptimizedTransfers from '@/components/OptimizedTransfers'
import ShameTicker from '@/components/ShameTicker'
import { minimizeTransactions, Balance } from '@/lib/split'
import { playSound } from '@/lib/sounds'

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: string
  name: string
  email: string
  avatar?: string | null
}

interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

type Tab = 'overview' | 'debts' | 'optimizer' | 'add' | 'fame'
type DebtFilter = 'all' | 'pending' | 'overdue' | 'shamed' | 'paid'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function greetingTime() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skel({ w, h, r = 10 }: { w: string | number; h: number; r?: number }) {
  return (
    <div className="skeleton" style={{ width: w, height: h, borderRadius: r, flexShrink: 0 }} />
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div
          key={t.id}
          onClick={() => onDismiss(t.id)}
          style={{
            padding: '12px 16px',
            borderRadius: 14,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
            maxWidth: 320,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            background: '#fff',
            border: `1.5px solid ${t.type === 'success' ? '#bbead0' : t.type === 'error' ? '#fca5a5' : '#bfdbfe'}`,
            color: t.type === 'success' ? '#197249' : t.type === 'error' ? '#dc2626' : '#1d4ed8',
          }}
        >
          <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
          {t.message}
        </div>
      ))}
    </div>
  )
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

function StatPill({ label, value, sub, icon, accent }: {
  label: string; value: string; sub?: string; icon: string; accent: string
}) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 20,
      border: '1px solid #e4ebe4',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#8a9e8a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: `${accent}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16,
        }}>{icon}</div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#1a2e1a', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#8a9e8a' }}>{sub}</div>}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [debts, setDebts] = useState<Debt[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [debtFilter, setDebtFilter] = useState<DebtFilter>('all')

  // Add debt form
  const [form, setForm] = useState({ debtorId: '', creditorId: '', amount: '', description: '', dueDate: '' })
  const [formLoading, setFormLoading] = useState(false)

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const [dr, ur] = await Promise.all([fetch('/api/debts'), fetch('/api/users')])
      const [d, u] = await Promise.all([dr.json(), ur.json()])
      setDebts(Array.isArray(d) ? d : [])
      setUsers(Array.isArray(u) ? u : [])
    } catch {
      addToast('error', 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => { fetchData() }, [fetchData])

  const handleShame = async (debtId: string) => {
    setLoadingId(debtId)
    try {
      const res = await fetch('/api/shame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debtId, action: 'shame' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      playSound('shame')
      addToast('success', `🔥 Shame sent! Tier ${data.tier}`)
      await fetchData()
    } catch (e: unknown) {
      addToast('error', e instanceof Error ? e.message : 'Failed to send shame')
    } finally {
      setLoadingId(null)
    }
  }

  const handleMintNFT = async (debtId: string) => {
    setLoadingId(debtId)
    try {
      const res = await fetch('/api/shame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debtId, action: 'mint_nft' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      playSound('nft')
      addToast('success', `🎨 NFT of Shame minted! Token #${data.tokenId}`)
      await fetchData()
    } catch (e: unknown) {
      addToast('error', e instanceof Error ? e.message : 'Failed to mint NFT')
    } finally {
      setLoadingId(null)
    }
  }

  const handleMarkPaid = async (debtId: string) => {
    setLoadingId(debtId)
    try {
      const res = await fetch('/api/debts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: debtId, status: 'PAID' }),
      })
      if (!res.ok) throw new Error('Failed to update')
      playSound('paid')
      addToast('success', '✅ Debt marked as paid!')
      await fetchData()
    } catch (e: unknown) {
      addToast('error', e instanceof Error ? e.message : 'Failed to mark paid')
    } finally {
      setLoadingId(null)
    }
  }

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.debtorId || !form.creditorId || !form.amount) {
      addToast('error', 'Please fill in all required fields')
      return
    }
    if (form.debtorId === form.creditorId) {
      addToast('error', 'Debtor and creditor must be different')
      return
    }
    setFormLoading(true)
    try {
      const res = await fetch('/api/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      addToast('success', '➕ Debt added successfully!')
      playSound('success')
      setForm({ debtorId: '', creditorId: '', amount: '', description: '', dueDate: '' })
      await fetchData()
      setTab('debts')
    } catch (e: unknown) {
      addToast('error', e instanceof Error ? e.message : 'Failed to add debt')
    } finally {
      setFormLoading(false)
    }
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const totalOwed = debts.filter(d => d.status !== 'PAID').reduce((s, d) => s + d.totalOwed, 0)
  const overdueCount = debts.filter(d => d.status === 'OVERDUE').length
  const totalFees = debts.reduce((s, d) => s + (d.lateFee || 0), 0)
  const nftCount = debts.filter(d => d.shameToken).length
  const paidDebts = debts.filter(d => d.status === 'PAID')

  const filteredDebts = debts.filter(d => {
    if (debtFilter === 'all') return true
    return d.status.toLowerCase() === debtFilter
  })

  // Optimizer balances
  const balanceMap = new Map<string, { name: string; net: number }>()
  for (const debt of debts.filter(d => d.status !== 'PAID')) {
    const c = balanceMap.get(debt.creditor.id) ?? { name: debt.creditor.name, net: 0 }
    c.net += debt.totalOwed
    balanceMap.set(debt.creditor.id, c)
    const d = balanceMap.get(debt.debtor.id) ?? { name: debt.debtor.name, net: 0 }
    d.net -= debt.totalOwed
    balanceMap.set(debt.debtor.id, d)
  }
  const balances: Balance[] = Array.from(balanceMap.entries()).map(([userId, v]) => ({ userId, name: v.name, net: v.net }))
  const transfers = minimizeTransactions(balances)
  const originalCount = debts.filter(d => d.status !== 'PAID').length

  const NAV_ITEMS: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview',  label: 'Overview',     icon: '🏠' },
    { id: 'debts',     label: 'Debts',        icon: '💸' },
    { id: 'optimizer', label: 'Optimizer',    icon: '⚡' },
    { id: 'add',       label: 'Add Debt',     icon: '➕' },
    { id: 'fame',      label: 'Hall of Fame', icon: '🏆' },
  ]

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7f5' }}>
      <ToastStack toasts={toasts} onDismiss={id => setToasts(p => p.filter(t => t.id !== id))} />

      {/* ── Sidebar ── */}
      <aside style={{
        width: 240,
        position: 'fixed',
        top: 0, left: 0,
        height: '100vh',
        background: '#fff',
        borderRight: '1px solid #e4ebe4',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 30,
        overflowY: 'auto',
      }}
        className="sidebar"
      >
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #2aab6f, #4ec48a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: '0 2px 8px rgba(42,171,111,0.3)',
          }}>💸</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#1a2e1a' }}>SplitEase</div>
            <div style={{ fontSize: 10, color: '#8a9e8a', fontWeight: 500 }}>Debt Enforcer</div>
          </div>
        </div>

        <div style={{ height: 1, background: '#e4ebe4', margin: '0 16px' }} />

        {/* Nav */}
        <nav style={{ padding: '12px 12px', flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#8a9e8a', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px', marginBottom: 8 }}>
            Menu
          </div>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 12px',
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: tab === item.id ? 700 : 500,
                background: tab === item.id ? '#2aab6f' : 'transparent',
                color: tab === item.id ? '#fff' : '#4a5e4a',
                transition: 'all 0.15s',
                textAlign: 'left',
                marginBottom: 2,
                boxShadow: tab === item.id ? '0 2px 8px rgba(42,171,111,0.3)' : 'none',
              }}
              onMouseEnter={e => { if (tab !== item.id) (e.currentTarget as HTMLButtonElement).style.background = '#f0faf4' }}
              onMouseLeave={e => { if (tab !== item.id) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
              {item.id === 'debts' && overdueCount > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: tab === item.id ? 'rgba(255,255,255,0.3)' : '#ffe0e0',
                  color: tab === item.id ? '#fff' : '#dc2626',
                  fontSize: 10, fontWeight: 700,
                  padding: '1px 6px', borderRadius: 99,
                }}>
                  {overdueCount}
                </span>
              )}
            </button>
          ))}

          <div style={{ height: 1, background: '#e4ebe4', margin: '12px 0' }} />

          <button
            onClick={() => setTab('debts')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '10px 12px', borderRadius: 12,
              border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
              background: 'transparent', color: '#ef4444', textAlign: 'left',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fff1f1' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
          >
            <span style={{ fontSize: 16 }}>🔥</span>
            Wall of Shame
          </button>
        </nav>

        {/* User profile */}
        <div style={{ padding: '16px', borderTop: '1px solid #e4ebe4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#dcf5e7', color: '#197249',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700,
              border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}>AC</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a2e1a' }}>Alex Chen</div>
              <div style={{ fontSize: 11, color: '#8a9e8a' }}>alex@splitease.app</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{
        flex: 1,
        marginLeft: 240,
        minHeight: '100vh',
      }}
        className="main-with-sidebar"
      >
        {/* Mobile header */}
        <header style={{
          display: 'none',
          position: 'sticky', top: 0, zIndex: 20,
          background: '#fff', borderBottom: '1px solid #e4ebe4',
          padding: '12px 16px',
          alignItems: 'center', gap: 12,
        }}
          className="mobile-header"
        >
          <div style={{ fontSize: 20 }}>💸</div>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#1a2e1a', flex: 1 }}>SplitEase</div>
          <div style={{ position: 'relative' }}>
            <button style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>🔔</button>
            {overdueCount > 0 && (
              <span style={{
                position: 'absolute', top: -2, right: -2,
                width: 16, height: 16, borderRadius: '50%',
                background: '#ef4444', color: '#fff',
                fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{overdueCount}</span>
            )}
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#dcf5e7', color: '#197249',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700,
          }}>AC</div>
        </header>

        {/* Page content */}
        <div style={{ padding: '28px', maxWidth: 900 }}>
          {loading ? <LoadingSkeleton /> : (
            <>
              {tab === 'overview'  && <OverviewTab debts={debts} paidDebts={paidDebts} totalOwed={totalOwed} overdueCount={overdueCount} totalFees={totalFees} nftCount={nftCount} onShame={handleShame} onMintNFT={handleMintNFT} onMarkPaid={handleMarkPaid} loadingId={loadingId} setTab={setTab} />}
              {tab === 'debts'     && <DebtsTab debts={filteredDebts} filter={debtFilter} setFilter={setDebtFilter} onShame={handleShame} onMintNFT={handleMintNFT} onMarkPaid={handleMarkPaid} loadingId={loadingId} />}
              {tab === 'optimizer' && <OptimizerTab transfers={transfers} originalCount={originalCount} balances={balances} />}
              {tab === 'add'       && <AddDebtTab users={users} form={form} setForm={setForm} onSubmit={handleAddDebt} loading={formLoading} />}
              {tab === 'fame'      && <FameTab debts={paidDebts} />}
            </>
          )}
        </div>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#fff', borderTop: '1px solid #e4ebe4',
        display: 'none', justifyContent: 'space-around',
        padding: '8px 0 12px', zIndex: 40,
      }}
        className="bottom-nav"
      >
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px 12px', borderRadius: 10,
              color: tab === item.id ? '#2aab6f' : '#8a9e8a',
              transition: 'color 0.15s',
            }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === item.id ? 700 : 500 }}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <Skel w={220} h={32} r={12} />
        <div style={{ marginTop: 8 }}><Skel w={160} h={16} r={8} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {[0,1,2,3].map(i => <div key={i} style={{ background: '#fff', borderRadius: 20, border: '1px solid #e4ebe4', padding: 20 }}><Skel w="60%" h={14} /><div style={{ marginTop: 12 }}><Skel w="80%" h={28} /></div></div>)}
      </div>
      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e4ebe4', padding: 20 }}>
        <Skel w={140} h={16} />
        <div style={{ marginTop: 12 }}><Skel w="100%" h={40} r={14} /></div>
      </div>
      {[0,1,2].map(i => (
        <div key={i} style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e4ebe4', padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
          <Skel w={40} h={40} r={99} />
          <div style={{ flex: 1 }}><Skel w="50%" h={14} /><div style={{ marginTop: 6 }}><Skel w="70%" h={12} /></div></div>
          <Skel w={60} h={20} r={99} />
        </div>
      ))}
    </div>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ debts, paidDebts, totalOwed, overdueCount, totalFees, nftCount, onShame, onMintNFT, onMarkPaid, loadingId, setTab }: {
  debts: Debt[]
  paidDebts: Debt[]
  totalOwed: number
  overdueCount: number
  totalFees: number
  nftCount: number
  onShame: (id: string) => Promise<void>
  onMintNFT: (id: string) => Promise<void>
  onMarkPaid: (id: string) => Promise<void>
  loadingId: string | null
  setTab: (t: Tab) => void
}) {
  const recentDebts = debts.filter(d => d.status !== 'PAID').slice(0, 3)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Greeting */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a2e1a', lineHeight: 1.2 }}>
          {greetingTime()}, Alex 👋
        </h1>
        <p style={{ fontSize: 14, color: '#8a9e8a', marginTop: 4 }}>{todayLabel()}</p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <StatPill label="Total Owed"   value={`$${totalOwed.toFixed(2)}`}  sub="across all debts"       icon="💰" accent="#ef4444" />
        <StatPill label="Overdue"      value={String(overdueCount)}         sub="need attention"         icon="⚠️" accent="#f59e0b" />
        <StatPill label="Late Fees"    value={`$${totalFees.toFixed(2)}`}   sub="accumulated"            icon="📈" accent="#2aab6f" />
        <StatPill label="NFTs Minted"  value={String(nftCount)}             sub="shame tokens"           icon="🎨" accent="#a855f7" />
      </div>

      {/* Quick actions */}
      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e4ebe4', padding: '20px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#8a9e8a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
          Quick Actions
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setTab('add')}
            className="btn-primary"
            style={{ fontSize: 13 }}
          >
            ➕ Add Expense
          </button>
          <button
            onClick={() => setTab('debts')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', borderRadius: 99,
              background: '#fff3e0', color: '#c2410c',
              border: '1.5px solid #fed7aa',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            🔥 Send Shame
          </button>
          <button
            onClick={() => setTab('optimizer')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', borderRadius: 99,
              background: '#faf5ff', color: '#7c3aed',
              border: '1.5px solid #e9d5ff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            ⚡ Optimize Group
          </button>
        </div>
      </div>

      {/* Live ticker */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#8a9e8a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Live Activity
        </div>
        <ShameTicker />
      </div>

      {/* Two-column: Recent Debts + Hall of Fame */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {/* Recent Debts */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e4ebe4', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2e1a' }}>Recent Debts</div>
            <button
              onClick={() => setTab('debts')}
              style={{ fontSize: 12, color: '#2aab6f', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View all →
            </button>
          </div>
          {recentDebts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#8a9e8a', fontSize: 13 }}>
              🎉 No pending debts!
            </div>
          ) : (
            <ShameTable
              debts={recentDebts}
              onShame={onShame}
              onMintNFT={onMintNFT}
              onMarkPaid={onMarkPaid}
              loadingId={loadingId}
            />
          )}
        </div>

        {/* Hall of Fame */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e4ebe4', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2e1a' }}>🏆 Hall of Fame</div>
            <button
              onClick={() => setTab('fame')}
              style={{ fontSize: 12, color: '#2aab6f', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View all →
            </button>
          </div>
          <HallOfFame debts={paidDebts} compact />
        </div>
      </div>
    </div>
  )
}

// ─── Debts Tab ────────────────────────────────────────────────────────────────

function DebtsTab({ debts, filter, setFilter, onShame, onMintNFT, onMarkPaid, loadingId }: {
  debts: Debt[]
  filter: DebtFilter
  setFilter: (f: DebtFilter) => void
  onShame: (id: string) => Promise<void>
  onMintNFT: (id: string) => Promise<void>
  onMarkPaid: (id: string) => Promise<void>
  loadingId: string | null
}) {
  const FILTERS: { id: DebtFilter; label: string }[] = [
    { id: 'all',     label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'shamed',  label: 'Shamed' },
    { id: 'paid',    label: 'Paid' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a2e1a' }}>💸 Debts</h2>
        <p style={{ fontSize: 13, color: '#8a9e8a', marginTop: 4 }}>{debts.length} debt{debts.length !== 1 ? 's' : ''} shown</p>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: '7px 16px', borderRadius: 99,
              border: `1.5px solid ${filter === f.id ? '#2aab6f' : '#e4ebe4'}`,
              background: filter === f.id ? '#2aab6f' : '#fff',
              color: filter === f.id ? '#fff' : '#4a5e4a',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ShameTable
        debts={debts}
        onShame={onShame}
        onMintNFT={onMintNFT}
        onMarkPaid={onMarkPaid}
        loadingId={loadingId}
      />
    </div>
  )
}

// ─── Optimizer Tab ────────────────────────────────────────────────────────────

function OptimizerTab({ transfers, originalCount, balances }: {
  transfers: ReturnType<typeof minimizeTransactions>
  originalCount: number
  balances: Balance[]
}) {
  const saved = originalCount - transfers.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a2e1a' }}>⚡ Debt Optimizer</h2>
        <p style={{ fontSize: 13, color: '#8a9e8a', marginTop: 4 }}>Minimum transactions to settle all debts</p>
      </div>

      {/* Algorithm explainer */}
      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e4ebe4', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #faf5ff, #f5f0ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>⚡</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1a2e1a', marginBottom: 6 }}>
              Minimum Transaction Algorithm
            </div>
            <div style={{ fontSize: 13, color: '#4a5e4a', lineHeight: 1.6 }}>
              Instead of everyone paying everyone else, we compute net balances and find the fewest transfers needed to settle all debts. This reduces up to N×(N−1) payments down to at most N−1 optimal transfers.
            </div>
            {saved > 0 && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                marginTop: 10, padding: '5px 12px',
                background: '#f0faf4', borderRadius: 99,
                fontSize: 12, fontWeight: 700, color: '#197249',
                border: '1px solid #bbead0',
              }}>
                ✨ Saved {saved} transaction{saved !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Net balances */}
      {balances.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e4ebe4', padding: '20px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#8a9e8a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
            Net Balances
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {balances.map(b => (
              <div key={b.userId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: b.net > 0 ? '#dcf5e7' : '#ffe0e0',
                  color: b.net > 0 ? '#197249' : '#dc2626',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>
                  {getInitials(b.name)}
                </div>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1a2e1a' }}>{b.name}</div>
                <div style={{
                  fontSize: 14, fontWeight: 700,
                  color: b.net > 0 ? '#197249' : b.net < 0 ? '#dc2626' : '#8a9e8a',
                }}>
                  {b.net > 0 ? '+' : ''}{b.net.toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: '#8a9e8a', width: 60, textAlign: 'right' }}>
                  {b.net > 0 ? 'owed to' : b.net < 0 ? 'owes' : 'settled'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optimized transfers */}
      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e4ebe4', padding: '20px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#8a9e8a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
          Optimal Transfers
        </div>
        <OptimizedTransfers transfers={transfers} originalCount={originalCount} />
      </div>
    </div>
  )
}

// ─── Add Debt Tab ─────────────────────────────────────────────────────────────

function AddDebtTab({ users, form, setForm, onSubmit, loading }: {
  users: User[]
  form: { debtorId: string; creditorId: string; amount: string; description: string; dueDate: string }
  setForm: (f: typeof form) => void
  onSubmit: (e: React.FormEvent) => Promise<void>
  loading: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a2e1a' }}>➕ Add Debt</h2>
        <p style={{ fontSize: 13, color: '#8a9e8a', marginTop: 4 }}>Record a new debt between two people</p>
      </div>

      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e4ebe4', padding: '28px', maxWidth: 520 }}>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Debtor */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Who owes? <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              className="input"
              value={form.debtorId}
              onChange={e => setForm({ ...form, debtorId: e.target.value })}
              required
            >
              <option value="">Select debtor…</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Creditor */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Who are they paying? <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              className="input"
              value={form.creditorId}
              onChange={e => setForm({ ...form, creditorId: e.target.value })}
              required
            >
              <option value="">Select creditor…</option>
              {users.filter(u => u.id !== form.debtorId).map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Amount <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                fontSize: 14, fontWeight: 600, color: '#8a9e8a',
              }}>$</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                className="input"
                style={{ paddingLeft: 28 }}
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Description
            </label>
            <input
              type="text"
              placeholder="e.g. Dinner at Nobu, Airbnb split…"
              className="input"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Due date */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Due Date
            </label>
            <input
              type="date"
              className="input"
              value={form.dueDate}
              onChange={e => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>

          <div style={{ height: 1, background: '#e4ebe4' }} />

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '⏳ Adding…' : '➕ Add Debt'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Hall of Fame Tab ─────────────────────────────────────────────────────────

function FameTab({ debts }: { debts: Debt[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a2e1a' }}>🏆 Hall of Fame</h2>
        <p style={{ fontSize: 13, color: '#8a9e8a', marginTop: 4 }}>People who paid their debts on time</p>
      </div>

      {/* Trophy banner */}
      <div style={{
        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)',
        borderRadius: 20,
        border: '1.5px solid #fde68a',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <div style={{ fontSize: 48 }}>🏆</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#92400e' }}>Debt Champions</div>
          <div style={{ fontSize: 13, color: '#b45309', marginTop: 4 }}>
            {debts.length} debt{debts.length !== 1 ? 's' : ''} paid · ${debts.reduce((s, d) => s + d.amount, 0).toFixed(2)} total settled
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e4ebe4', padding: '20px' }}>
        <HallOfFame debts={debts} />
      </div>
    </div>
  )
}
