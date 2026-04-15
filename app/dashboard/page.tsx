'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import ShameTable, { Debt } from '@/components/ShameTable'
import HallOfFame from '@/components/HallOfFame'
import OptimizedTransfers from '@/components/OptimizedTransfers'
import ShameTicker from '@/components/ShameTicker'
import { minimizeTransactions, Balance } from '@/lib/split'
import { playSound } from '@/lib/sounds'

const AIInsightsCard = dynamic(() => import('@/components/AIInsightsCard'), { ssr: false })

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

type Tab = 'overview' | 'debts' | 'optimizer' | 'add' | 'fame' | 'ai'
type DebtFilter = 'all' | 'pending' | 'overdue' | 'shamed' | 'paid'

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS: { id: Tab; icon: string; label: string; ai?: boolean }[] = [
  { id: 'overview',  icon: '🏠', label: 'Overview' },
  { id: 'debts',     icon: '💸', label: 'Debts' },
  { id: 'optimizer', icon: '⚡', label: 'Optimizer' },
  { id: 'add',       icon: '➕', label: 'Add Debt' },
  { id: 'fame',      icon: '🏆', label: 'Hall of Fame' },
  { id: 'ai',        icon: '🤖', label: 'AI Insights', ai: true },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// ─── Toast component ──────────────────────────────────────────────────────────

function ToastList({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          onClick={() => onDismiss(t.id)}
          style={{ cursor: 'pointer' }}
        >
          <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
          {t.message}
        </div>
      ))}
    </div>
  )
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({ icon, label, value, color, bg, border }: {
  icon: string; label: string; value: string | number
  color: string; bg: string; border: string
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '16px 20px',
      background: bg,
      borderRadius: 18,
      border: `1.5px solid ${border}`,
      flex: 1, minWidth: 140,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: 'rgba(255,255,255,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: '-0.03em' }}>{value}</div>
        <div style={{ fontSize: 11, color: '#8a9e8a', fontWeight: 500, marginTop: 1 }}>{label}</div>
      </div>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="skeleton" style={{ height: 32, width: 240, borderRadius: 10 }} />
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton" style={{ height: 80, flex: 1, minWidth: 140, borderRadius: 18 }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 200, borderRadius: 20 }} />
      <div className="skeleton" style={{ height: 120, borderRadius: 20 }} />
    </div>
  )
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  debts, activeDebts, paidDebts, overdueDebts,
  totalOwed, totalLateFees, nftsMinted,
  onShame, onMintNFT, onMarkPaid, loadingId, onTabChange,
}: {
  debts: Debt[]
  activeDebts: Debt[]
  paidDebts: Debt[]
  overdueDebts: Debt[]
  totalOwed: number
  totalLateFees: number
  nftsMinted: number
  onShame: (id: string) => Promise<void>
  onMintNFT: (id: string) => Promise<void>
  onMarkPaid: (id: string) => Promise<void>
  loadingId: string | null
  onTabChange: (tab: Tab) => void
}) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const recentDebts = activeDebts.slice(0, 3)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Greeting */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a2e1a', letterSpacing: '-0.03em', marginBottom: 4 }}>
          {greeting} 👋
        </h1>
        <p style={{ fontSize: 14, color: '#8a9e8a' }}>
          {activeDebts.length === 0
            ? 'All debts are settled — everyone\'s square!'
            : `You have ${activeDebts.length} active debt${activeDebts.length !== 1 ? 's' : ''} to track.`}
        </p>
      </div>

      {/* Stat pills */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <StatPill icon="💰" label="Total Owed" value={`$${totalOwed.toFixed(2)}`} color="#1a2e1a" bg="#f0faf4" border="#bbead0" />
        <StatPill icon="⚠️" label="Overdue" value={overdueDebts.length} color="#dc2626" bg="#fff1f1" border="#fca5a5" />
        <StatPill icon="📈" label="Late Fees" value={`$${totalLateFees.toFixed(2)}`} color="#c2410c" bg="#fff7ed" border="#fed7aa" />
        <StatPill icon="🎨" label="NFTs Minted" value={nftsMinted} color="#7c3aed" bg="#faf5ff" border="#e9d5ff" />
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={() => onTabChange('add')} className="btn-primary" style={{ fontSize: 13 }}>
          ➕ Add Debt
        </button>
        <button onClick={() => onTabChange('optimizer')} className="btn-outline" style={{ fontSize: 13 }}>
          ⚡ Optimize
        </button>
        <button onClick={() => onTabChange('ai')} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '10px 20px', borderRadius: 99,
          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          color: '#fff', border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 600,
          boxShadow: '0 2px 12px rgba(124,58,237,0.3)',
          transition: 'all 0.2s',
        }}>
          🤖 AI Insights
        </button>
      </div>

      {/* Live ticker */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#8a9e8a', letterSpacing: '0.06em', marginBottom: 8 }}>
          LIVE ACTIVITY
        </div>
        <ShameTicker />
      </div>

      {/* Recent debts + Hall of Fame */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent debts */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1a2e1a' }}>Recent Debts</div>
            <button
              onClick={() => onTabChange('debts')}
              style={{ fontSize: 12, color: '#2aab6f', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View all →
            </button>
          </div>
          {recentDebts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#8a9e8a', fontSize: 13 }}>
              No active debts 🎉
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
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1a2e1a' }}>🏆 Hall of Fame</div>
            <button
              onClick={() => onTabChange('fame')}
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

// ─── Debts tab ────────────────────────────────────────────────────────────────

const FILTER_OPTIONS: { id: DebtFilter; label: string; color: string; bg: string; border: string }[] = [
  { id: 'all',     label: 'All',     color: '#4a5e4a', bg: '#f0f4f0', border: '#e4ebe4' },
  { id: 'pending', label: 'Pending', color: '#c2410c', bg: '#fff3e0', border: '#fed7aa' },
  { id: 'overdue', label: 'Overdue', color: '#dc2626', bg: '#ffe0e0', border: '#fca5a5' },
  { id: 'shamed',  label: 'Shamed',  color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff' },
  { id: 'paid',    label: 'Paid',    color: '#197249', bg: '#dcf5e7', border: '#bbead0' },
]

function DebtsTab({
  debts, filter, onFilterChange, onShame, onMintNFT, onMarkPaid, loadingId,
}: {
  debts: Debt[]
  filter: DebtFilter
  onFilterChange: (f: DebtFilter) => void
  onShame: (id: string) => Promise<void>
  onMintNFT: (id: string) => Promise<void>
  onMarkPaid: (id: string) => Promise<void>
  loadingId: string | null
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a2e1a', letterSpacing: '-0.03em', marginBottom: 4 }}>
          💸 All Debts
        </h2>
        <p style={{ fontSize: 13, color: '#8a9e8a' }}>{debts.length} debt{debts.length !== 1 ? 's' : ''} shown</p>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {FILTER_OPTIONS.map(f => (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.id)}
            style={{
              padding: '7px 16px', borderRadius: 99,
              border: `1.5px solid ${filter === f.id ? f.border : '#e4ebe4'}`,
              background: filter === f.id ? f.bg : '#fff',
              color: filter === f.id ? f.color : '#8a9e8a',
              fontSize: 12, fontWeight: filter === f.id ? 700 : 500,
              cursor: 'pointer',
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

// ─── Optimizer tab ────────────────────────────────────────────────────────────

function OptimizerTab({
  transfers, originalCount, balances,
}: {
  transfers: ReturnType<typeof minimizeTransactions>
  originalCount: number
  balances: Balance[]
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a2e1a', letterSpacing: '-0.03em', marginBottom: 4 }}>
          ⚡ Debt Optimizer
        </h2>
        <p style={{ fontSize: 13, color: '#8a9e8a' }}>Minimum transaction algorithm — reduces payments to the theoretical minimum</p>
      </div>

      {/* Algorithm explainer */}
      <div style={{
        padding: '18px 20px',
        background: '#fffbeb',
        borderRadius: 16,
        border: '1.5px solid #fde68a',
        display: 'flex', gap: 14, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 24, flexShrink: 0 }}>⚡</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#92400e', marginBottom: 6 }}>
            How it works
          </div>
          <p style={{ fontSize: 13, color: '#78350f', lineHeight: 1.6 }}>
            The algorithm computes net balances for each person, then greedily matches the largest creditor
            with the largest debtor. This reduces <strong>N×(N-1)</strong> potential payments to at most{' '}
            <strong>N-1</strong> optimal transfers — provably minimal.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {['O(n log n)', 'Provably minimal', `${originalCount} debts → ${transfers.length} transfers`].map(tag => (
              <span key={tag} style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 99,
                background: 'rgba(255,255,255,0.7)', border: '1px solid #fde68a',
                color: '#d97706', fontWeight: 600,
              }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Optimized transfers */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1a2e1a', marginBottom: 16 }}>
          Optimal Payment Plan
        </div>
        <OptimizedTransfers transfers={transfers} originalCount={originalCount} />
      </div>

      {/* Net balances */}
      {balances.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#1a2e1a', marginBottom: 16 }}>
            Net Balances
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {balances
              .sort((a, b) => b.net - a.net)
              .map(b => (
                <div key={b.userId} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px',
                  background: b.net > 0 ? '#f0faf4' : b.net < 0 ? '#fff1f1' : '#f5f7f5',
                  borderRadius: 14,
                  border: `1.5px solid ${b.net > 0 ? '#bbead0' : b.net < 0 ? '#fca5a5' : '#e4ebe4'}`,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: b.net > 0 ? '#dcf5e7' : b.net < 0 ? '#ffe0e0' : '#eef2ee',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700,
                    color: b.net > 0 ? '#197249' : b.net < 0 ? '#dc2626' : '#8a9e8a',
                    flexShrink: 0,
                  }}>
                    {b.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1a2e1a' }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: '#8a9e8a', marginTop: 1 }}>
                      {b.net > 0 ? 'is owed money' : b.net < 0 ? 'owes money' : 'settled up'}
                    </div>
                  </div>
                  <div style={{
                    fontWeight: 800, fontSize: 15,
                    color: b.net > 0 ? '#197249' : b.net < 0 ? '#dc2626' : '#8a9e8a',
                  }}>
                    {b.net > 0 ? '+' : ''}{b.net.toFixed(2)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Add Debt tab ─────────────────────────────────────────────────────────────

function AddDebtTab({
  form, setForm, users, onSubmit, submitting,
}: {
  form: { debtorId: string; creditorId: string; amount: string; description: string; dueDate: string }
  setForm: React.Dispatch<React.SetStateAction<typeof form>>
  users: User[]
  onSubmit: (e: React.FormEvent) => Promise<void>
  submitting: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 560 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a2e1a', letterSpacing: '-0.03em', marginBottom: 4 }}>
          ➕ Add New Debt
        </h2>
        <p style={{ fontSize: 13, color: '#8a9e8a' }}>Record a debt between two people</p>
      </div>

      <div className="card" style={{ padding: 28 }}>
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Debtor */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5e4a', marginBottom: 6 }}>
              Who owes? <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              className="input"
              value={form.debtorId}
              onChange={e => setForm(f => ({ ...f, debtorId: e.target.value }))}
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
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5e4a', marginBottom: 6 }}>
              Who are they paying? <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              className="input"
              value={form.creditorId}
              onChange={e => setForm(f => ({ ...f, creditorId: e.target.value }))}
              required
            >
              <option value="">Select creditor…</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5e4a', marginBottom: 6 }}>
              Amount (USD) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                fontSize: 14, color: '#8a9e8a', fontWeight: 600, pointerEvents: 'none',
              }}>$</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                className="input"
                style={{ paddingLeft: 28 }}
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5e4a', marginBottom: 6 }}>
              Description
            </label>
            <input
              type="text"
              placeholder="e.g. Dinner at Nobu, Airbnb split…"
              className="input"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          {/* Due date */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5e4a', marginBottom: 6 }}>
              Due Date
            </label>
            <input
              type="date"
              className="input"
              value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
            style={{ fontSize: 14, padding: '13px 24px', opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? '⏳ Adding…' : '➕ Add Debt'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Hall of Fame tab ─────────────────────────────────────────────────────────

function FameTab({ debts }: { debts: Debt[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a2e1a', letterSpacing: '-0.03em', marginBottom: 4 }}>
          🏆 Hall of Fame
        </h2>
        <p style={{ fontSize: 13, color: '#8a9e8a' }}>People who actually paid their debts — legends</p>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <HallOfFame debts={debts} />
      </div>
    </div>
  )
}

// ─── AI tab ───────────────────────────────────────────────────────────────────

function AITab() {
  const features = [
    {
      icon: '🔥',
      title: 'AI Shame Escalation',
      desc: 'Dynamically generated shame messages that escalate from gentle nudges to scorched-earth roasts over 72 hours. Each message is uniquely crafted by the OpenClaw AI based on debt context.',
      color: '#c2410c', bg: '#fff7ed', border: '#fed7aa',
    },
    {
      icon: '📊',
      title: 'Debt Risk Scoring',
      desc: 'Per-debt risk assessment that predicts likelihood of repayment based on debtor history, amount, and days overdue. Helps prioritize which debts to escalate first.',
      color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe',
    },
    {
      icon: '👥',
      title: 'Group Analytics',
      desc: 'Holistic analysis of your entire debt group — identifies the most at-risk debtor, total exposure, and patterns in payment behavior across the group.',
      color: '#197249', bg: '#f0faf4', border: '#bbead0',
    },
    {
      icon: '🔮',
      title: 'Payment Predictions',
      desc: 'AI-powered predictions on when debts are likely to be paid, enabling proactive shame scheduling and optimal timing for escalation messages.',
      color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
            boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
          }}>🤖</div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a2e1a', letterSpacing: '-0.03em' }}>
              OpenClaw AI Intelligence Center
            </h2>
            <p style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 500 }}>
              Powered by claw_dev API — Locus Paygentic Hackathon
            </p>
          </div>
        </div>
      </div>

      {/* AI Insights Card */}
      <AIInsightsCard />

      {/* Feature cards */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#8a9e8a', letterSpacing: '0.06em', marginBottom: 14 }}>
          AI CAPABILITIES
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {features.map(f => (
            <div
              key={f.title}
              style={{
                padding: '20px',
                background: f.bg,
                borderRadius: 18,
                border: `1.5px solid ${f.border}`,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1a2e1a', marginBottom: 8 }}>{f.title}</div>
              <p style={{ fontSize: 13, color: '#4a5e4a', lineHeight: 1.6 }}>{f.desc}</p>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                marginTop: 12, padding: '3px 10px', borderRadius: 99,
                background: 'rgba(255,255,255,0.7)', border: `1px solid ${f.border}`,
                fontSize: 11, fontWeight: 600, color: f.color,
              }}>
                ✓ Active
              </div>
            </div>
          ))}
        </div>
      </div>
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
  const [filter, setFilter] = useState<DebtFilter>('all')

  // Add debt form state
  const [form, setForm] = useState({
    debtorId: '',
    creditorId: '',
    amount: '',
    description: '',
    dueDate: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // ── Toast helpers ──────────────────────────────────────────────────────────

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchDebts = useCallback(async () => {
    try {
      const res = await fetch('/api/debts')
      if (res.ok) {
        const data = await res.json()
        setDebts(data)
      }
    } catch {
      addToast('error', 'Failed to load debts')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchDebts()
    fetchUsers()
  }, [fetchDebts, fetchUsers])

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleShame = useCallback(async (debtId: string) => {
    setLoadingId(debtId)
    try {
      const res = await fetch('/api/shame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debtId }),
      })
      if (res.ok) {
        playSound('shame')
        addToast('success', '🔥 Shame message sent!')
        await fetchDebts()
      } else {
        const err = await res.json()
        addToast('error', err.error || 'Failed to send shame')
        playSound('error')
      }
    } catch {
      addToast('error', 'Network error')
      playSound('error')
    } finally {
      setLoadingId(null)
    }
  }, [addToast, fetchDebts])

  const handleMintNFT = useCallback(async (debtId: string) => {
    setLoadingId(debtId)
    try {
      const res = await fetch(`/api/debts/${debtId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mint' }),
      })
      if (res.ok) {
        playSound('nft')
        addToast('success', '🎨 NFT of Shame minted!')
        await fetchDebts()
      } else {
        addToast('error', 'Failed to mint NFT')
        playSound('error')
      }
    } catch {
      addToast('error', 'Network error')
      playSound('error')
    } finally {
      setLoadingId(null)
    }
  }, [addToast, fetchDebts])

  const handleMarkPaid = useCallback(async (debtId: string) => {
    setLoadingId(debtId)
    try {
      const res = await fetch(`/api/debts/${debtId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'paid' }),
      })
      if (res.ok) {
        playSound('paid')
        addToast('success', '✅ Debt marked as paid!')
        await fetchDebts()
      } else {
        addToast('error', 'Failed to mark paid')
        playSound('error')
      }
    } catch {
      addToast('error', 'Network error')
      playSound('error')
    } finally {
      setLoadingId(null)
    }
  }, [addToast, fetchDebts])

  const handleAddDebt = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.debtorId || !form.creditorId || !form.amount) {
      addToast('error', 'Please fill in all required fields')
      return
    }
    if (form.debtorId === form.creditorId) {
      addToast('error', 'Debtor and creditor must be different people')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debtorId: form.debtorId,
          creditorId: form.creditorId,
          amount: parseFloat(form.amount),
          description: form.description,
          dueDate: form.dueDate || null,
        }),
      })
      if (res.ok) {
        playSound('success')
        addToast('success', '💸 Debt added successfully!')
        setForm({ debtorId: '', creditorId: '', amount: '', description: '', dueDate: '' })
        await fetchDebts()
        setTab('debts')
      } else {
        const err = await res.json()
        addToast('error', err.error || 'Failed to add debt')
        playSound('error')
      }
    } catch {
      addToast('error', 'Network error')
      playSound('error')
    } finally {
      setSubmitting(false)
    }
  }, [form, addToast, fetchDebts])

  // ── Derived data ───────────────────────────────────────────────────────────

  const activeDebts = debts.filter(d => d.status !== 'PAID')
  const paidDebts   = debts.filter(d => d.status === 'PAID')
  const overdueDebts = debts.filter(d => d.status === 'OVERDUE')
  const totalOwed   = activeDebts.reduce((s, d) => s + d.totalOwed, 0)
  const totalLateFees = activeDebts.reduce((s, d) => s + d.lateFee, 0)
  const nftsMinted  = debts.filter(d => d.shameToken).length

  const filteredDebts = debts.filter(d => {
    if (filter === 'all')     return true
    if (filter === 'pending') return d.status === 'PENDING'
    if (filter === 'overdue') return d.status === 'OVERDUE'
    if (filter === 'shamed')  return d.status === 'SHAMED'
    if (filter === 'paid')    return d.status === 'PAID'
    return true
  })

  // Build balances for optimizer
  const balanceMap = new Map<string, Balance>()
  activeDebts.forEach(d => {
    // Creditor is owed money (positive net)
    const cred = balanceMap.get(d.creditor.id) ?? { userId: d.creditor.id, name: d.creditor.name, net: 0 }
    cred.net += d.totalOwed
    balanceMap.set(d.creditor.id, cred)
    // Debtor owes money (negative net)
    const deb = balanceMap.get(d.debtor.id) ?? { userId: d.debtor.id, name: d.debtor.name, net: 0 }
    deb.net -= d.totalOwed
    balanceMap.set(d.debtor.id, deb)
  })
  const balances = Array.from(balanceMap.values())
  const optimizedTransfers = minimizeTransactions(balances)

  // Current user (first user as placeholder)
  const currentUser = users[0]

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7f5' }}>
      <ToastList toasts={toasts} onDismiss={dismissToast} />

      {/* ── Sidebar ── */}
      <aside style={{
        width: 240,
        flexShrink: 0,
        background: '#fff',
        borderRight: '1px solid #e4ebe4',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 30,
        overflowY: 'auto',
      }}
        className="sidebar-desktop"
      >
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #e4ebe4' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <span style={{ fontSize: 24 }}>💸</span>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#1a2e1a', letterSpacing: '-0.02em' }}>SplitEase</span>
          </Link>
          <div style={{ fontSize: 11, color: '#8a9e8a', marginTop: 4, marginLeft: 32 }}>Debt Tracker</div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 12px', flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#8a9e8a', letterSpacing: '0.08em', padding: '0 8px', marginBottom: 8 }}>
            NAVIGATION
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
                fontSize: 13,
                fontWeight: tab === item.id ? 700 : 500,
                color: tab === item.id ? '#fff' : item.ai ? '#7c3aed' : '#4a5e4a',
                background: tab === item.id
                  ? item.ai ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : '#2aab6f'
                  : item.ai ? 'rgba(124,58,237,0.06)' : 'transparent',
                marginBottom: 2,
                transition: 'all 0.15s',
                textAlign: 'left',
                position: 'relative',
                boxShadow: tab === item.id
                  ? item.ai ? '0 2px 12px rgba(124,58,237,0.35)' : '0 2px 8px rgba(42,171,111,0.3)'
                  : item.ai ? '0 0 0 1px rgba(124,58,237,0.15)' : 'none',
              }}
              onMouseEnter={e => {
                if (tab !== item.id) {
                  const el = e.currentTarget
                  el.style.background = item.ai ? 'rgba(124,58,237,0.1)' : '#f0faf4'
                  el.style.color = item.ai ? '#7c3aed' : '#1a2e1a'
                }
              }}
              onMouseLeave={e => {
                if (tab !== item.id) {
                  const el = e.currentTarget
                  el.style.background = item.ai ? 'rgba(124,58,237,0.06)' : 'transparent'
                  el.style.color = item.ai ? '#7c3aed' : '#4a5e4a'
                }
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.ai && tab !== item.id && (
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  padding: '2px 6px', borderRadius: 99,
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  color: '#fff',
                  letterSpacing: '0.04em',
                  boxShadow: '0 0 8px rgba(124,58,237,0.4)',
                }}>NEW</span>
              )}
            </button>
          ))}
        </nav>

        {/* User profile */}
        {currentUser && (
          <div style={{
            padding: '16px',
            borderTop: '1px solid #e4ebe4',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#dcf5e7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: currentUser.avatar ? 18 : 13,
              fontWeight: 700, color: '#197249',
              flexShrink: 0,
              border: '2px solid #fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}>
              {currentUser.avatar || getInitials(currentUser.name)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2e1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.name}
              </div>
              <div style={{ fontSize: 11, color: '#8a9e8a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.email}
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ── Main content ── */}
      <main style={{
        marginLeft: 240,
        flex: 1,
        minWidth: 0,
        padding: '28px 28px 80px',
        maxWidth: 'calc(100vw - 240px)',
      }}
        className="main-content"
      >
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {tab === 'overview'  && <OverviewTab debts={debts} activeDebts={activeDebts} paidDebts={paidDebts} overdueDebts={overdueDebts} totalOwed={totalOwed} totalLateFees={totalLateFees} nftsMinted={nftsMinted} onShame={handleShame} onMintNFT={handleMintNFT} onMarkPaid={handleMarkPaid} loadingId={loadingId} onTabChange={setTab} />}
            {tab === 'debts'     && <DebtsTab debts={filteredDebts} filter={filter} onFilterChange={setFilter} onShame={handleShame} onMintNFT={handleMintNFT} onMarkPaid={handleMarkPaid} loadingId={loadingId} />}
            {tab === 'optimizer' && <OptimizerTab transfers={optimizedTransfers} originalCount={activeDebts.length} balances={balances} />}
            {tab === 'add'       && <AddDebtTab form={form} setForm={setForm} users={users} onSubmit={handleAddDebt} submitting={submitting} />}
            {tab === 'fame'      && <FameTab debts={paidDebts} />}
            {tab === 'ai'        && <AITab />}
          </>
        )}
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav style={{
        display: 'none',
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        background: '#fff',
        borderTop: '1px solid #e4ebe4',
        zIndex: 40,
        padding: '8px 4px',
      }}
        className="mobile-nav"
      >
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '6px 4px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderRadius: 10,
              color: tab === item.id ? (item.ai ? '#7c3aed' : '#2aab6f') : '#8a9e8a',
              transition: 'color 0.15s',
              position: 'relative',
            }}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{ fontSize: 9, fontWeight: tab === item.id ? 700 : 500 }}>{item.label}</span>
            {item.ai && tab !== item.id && (
              <span style={{
                position: 'absolute', top: 2, right: 6,
                width: 8, height: 8, borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                boxShadow: '0 0 6px rgba(124,58,237,0.6)',
              }} />
            )}
          </button>
        ))}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .main-content { margin-left: 0 !important; max-width: 100vw !important; padding: 16px 16px 80px !important; }
          .mobile-nav { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
