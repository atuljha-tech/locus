'use client'

/**
 * LocusPayButton — Locus Paygentic USDC Checkout
 * Locus Paygentic Hackathon Integration
 *
 * Flow:
 *  1. POST /api/locus/checkout  → create Locus checkout session
 *  2. openPopup(checkoutUrl)    → opens Locus checkout popup
 *  3. Poll /api/debts/:id       → detect PAID status and fire onSuccess
 *  4. Webhook /api/locus/webhook → Locus calls back when paid → marks PAID in DB
 */

import { useState, useEffect, useRef } from 'react'

interface Props {
  debtId:      string
  amount:      number
  debtorName:  string
  description: string
  onSuccess:   (txHash: string) => void
  onError?:    (msg: string) => void
}

export function LocusPayButtonFallback() {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '8px 16px', borderRadius: 99,
      background: 'rgba(124,58,237,0.08)',
      border: '1.5px solid rgba(124,58,237,0.2)',
      fontSize: 12, color: '#9333ea', fontWeight: 600,
    }}>
      ⚡ Locus Pay — Configure API Key
    </div>
  )
}

export default function LocusPayButton({
  debtId, amount, debtorName, description, onSuccess, onError,
}: Props) {
  const [status, setStatus] = useState<'idle' | 'creating' | 'polling' | 'error' | 'success'>('idle')
  const [errMsg, setErrMsg] = useState('')
  const pollRef = useRef<NodeJS.Timeout | null>(null)
  const popupRef = useRef<Window | null>(null)

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  function startPolling() {
    setStatus('polling')
    let attempts = 0
    const MAX = 90 // poll for up to 3 minutes

    pollRef.current = setInterval(async () => {
      attempts++
      try {
        const res = await fetch(`/api/debts/${debtId}`)
        if (res.ok) {
          const debt = await res.json()
          if (debt.status === 'PAID') {
            clearInterval(pollRef.current!)
            popupRef.current?.close()
            setStatus('success')
            setTimeout(() => setStatus('idle'), 3000)
            onSuccess(debt.paymentTxHash ?? 'locus_confirmed')
            return
          }
        }
      } catch { /* ignore */ }

      if (popupRef.current?.closed) {
        clearInterval(pollRef.current!)
        setStatus('idle')
        return
      }

      if (attempts >= MAX) {
        clearInterval(pollRef.current!)
        setStatus('idle')
      }
    }, 2000)
  }

  async function handlePay() {
    if (status !== 'idle') return
    setStatus('creating')
    setErrMsg('')

    try {
      const res = await fetch('/api/locus/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debtId, amount, debtorName, description }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(err.error ?? 'Failed to create checkout')
      }

      const { sessionId, checkoutUrl, demo } = await res.json()

      if (checkoutUrl) {
        // Open Locus checkout popup
        const popup = window.open(
          checkoutUrl,
          'locus-checkout',
          'width=420,height=620,scrollbars=no,resizable=no,toolbar=no,menubar=no'
        )
        popupRef.current = popup
      }

      startPolling()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Payment failed'
      setErrMsg(msg)
      setStatus('error')
      onError?.(msg)
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const isLoading = status === 'creating' || status === 'polling'

  if (status === 'success') {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 16px', borderRadius: 99,
        background: 'rgba(34,197,94,0.12)',
        border: '1.5px solid rgba(34,197,94,0.3)',
        fontSize: 13, color: '#16a34a', fontWeight: 700,
        animation: 'fadeIn 0.3s ease-out',
      }}>
        ✅ Paid via Locus!
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 16px', borderRadius: 99,
        background: 'rgba(239,68,68,0.08)',
        border: '1.5px solid rgba(239,68,68,0.2)',
        fontSize: 12, color: '#dc2626', fontWeight: 600,
      }}>
        ❌ {errMsg || 'Payment failed'}
      </div>
    )
  }

  return (
    <button
      onClick={handlePay}
      disabled={isLoading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '8px 16px', borderRadius: 99,
        background: isLoading
          ? 'rgba(124,58,237,0.08)'
          : 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(88,28,135,0.1))',
        border: '1.5px solid rgba(124,58,237,0.3)',
        fontSize: 13, color: '#7c3aed', fontWeight: 700,
        cursor: isLoading ? 'not-allowed' : 'pointer',
        opacity: isLoading ? 0.7 : 1,
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
      }}
    >
      {isLoading ? (
        <>
          <span style={{
            width: 12, height: 12, borderRadius: '50%',
            border: '2px solid rgba(124,58,237,0.3)',
            borderTopColor: '#7c3aed',
            animation: 'spin 0.7s linear infinite',
            display: 'inline-block',
          }} />
          {status === 'creating' ? 'Opening Locus…' : 'Waiting for payment…'}
        </>
      ) : (
        <>
          <span style={{ fontSize: 14 }}>⚡</span>
          Pay ${amount.toFixed(2)} USDC
        </>
      )}
    </button>
  )
}
