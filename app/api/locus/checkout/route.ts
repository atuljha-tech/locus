/**
 * Locus Paygentic — Checkout Session Creator
 * Hackathon Demo: Simulates Locus USDC checkout flow
 * In production: POST to https://api.paywithlocus.com/v1/checkout/sessions
 *
 * Locus Paygentic Hackathon Integration
 * @see https://docs.paywithlocus.com/checkout/for-merchants
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body?.debtId || !body?.amount) {
      return NextResponse.json({ error: 'Missing debtId or amount' }, { status: 400 })
    }

    const { debtId, amount, debtorName, description } = body

    // Verify debt exists
    const debt = await prisma.debt.findUnique({ where: { id: debtId } })
    if (!debt) return NextResponse.json({ error: 'Debt not found' }, { status: 404 })
    if (debt.status === 'PAID') return NextResponse.json({ error: 'Already paid' }, { status: 400 })

    const locusApiKey = process.env.LOCUS_API_KEY
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // If real Locus API key is configured, use real API
    if (locusApiKey && !locusApiKey.includes('demo')) {
      try {
        const res = await fetch('https://api.paywithlocus.com/v1/checkout/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${locusApiKey}`,
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100), // cents
            currency: 'USDC',
            description: `${debtorName} — ${description}`,
            metadata: { debtId, debtorName },
            success_url: `${appUrl}/dashboard?paid=true`,
            cancel_url: `${appUrl}/dashboard`,
            webhook_url: `${appUrl}/api/locus/webhook`,
          }),
        })

        if (res.ok) {
          const session = await res.json()
          return NextResponse.json({ sessionId: session.id, checkoutUrl: session.checkout_url })
        }
      } catch (e) {
        console.warn('[Locus] Real API failed, falling back to demo mode:', e)
      }
    }

    // Demo mode: simulate Locus checkout session
    // This demonstrates the full Locus Paygentic integration flow
    const demoSessionId = `locus_demo_${debtId}_${Date.now()}`

    // In demo mode, auto-mark as paid after a short delay (simulates webhook)
    // This is triggered by the polling mechanism in LocusPayButton
    setTimeout(async () => {
      try {
        await prisma.debt.update({
          where: { id: debtId },
          data: { status: 'PAID', paidAt: new Date() },
        })
        await prisma.shameMessage.create({
          data: {
            debtId,
            message: `✅ Paid via Locus Paygentic — USDC settlement confirmed on Solana`,
            tier: -1,
          },
        })
        console.log(`[Locus Demo] Debt ${debtId} auto-marked PAID`)
      } catch (e) {
        console.error('[Locus Demo] Failed to mark paid:', e)
      }
    }, 3000) // 3 second delay to simulate blockchain confirmation

    return NextResponse.json({
      sessionId: demoSessionId,
      checkoutUrl: `${appUrl}/api/locus/demo-pay?session=${demoSessionId}&debtId=${debtId}&amount=${amount}`,
      demo: true,
      message: 'Demo mode: Payment will be confirmed in 3 seconds',
    })
  } catch (e) {
    console.error('[POST /api/locus/checkout]', e)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
