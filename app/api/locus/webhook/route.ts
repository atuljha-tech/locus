/**
 * Locus Webhook Handler
 * Marks debt as PAID when Locus confirms on-chain payment.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

function verifySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expected = 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-signature-256') ?? ''
    const event     = req.headers.get('x-webhook-event') ?? ''

    // Verify signature if secret is configured
    const webhookSecret = process.env.LOCUS_WEBHOOK_SECRET
    if (webhookSecret && signature) {
      if (!verifySignature(rawBody, signature, webhookSecret)) {
        console.warn('[Locus webhook] Invalid signature — rejecting')
        return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 })
      }
    }

    const data = JSON.parse(rawBody)

    if (event === 'checkout.session.paid') {
      const { sessionId, paymentTxHash, paidAt, metadata } = data.data ?? {}
      const debtId = metadata?.debtId

      if (debtId) {
        await prisma.debt.update({
          where: { id: debtId },
          data: {
            status:  'PAID',
            paidAt:  paidAt ? new Date(paidAt) : new Date(),
          },
        })

        // Log the on-chain tx hash as a shame message for audit trail
        await prisma.shameMessage.create({
          data: {
            debtId,
            message: `✅ Paid via Locus — tx: ${paymentTxHash ?? 'confirmed'}`,
            tier:    -1, // special tier for payment confirmations
          },
        })

        console.log(`[Locus webhook] Debt ${debtId} marked PAID — tx: ${paymentTxHash}`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (e) {
    console.error('[POST /api/locus/webhook]', e)
    // Always return 200 to Locus — don't let errors cause retries
    return NextResponse.json({ received: true, warning: 'Processing error logged.' })
  }
}
