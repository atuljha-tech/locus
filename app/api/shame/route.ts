import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateShameMessage } from '@/lib/ai-shame'
import { generateShameNFTMetadata, mintShameNFT } from '@/lib/nft-shame'
import { calculateLateFee } from '@/lib/fees'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body?.debtId) {
      return NextResponse.json({ error: 'Missing required field: debtId.' }, { status: 400 })
    }

    const { debtId, action } = body

    const debt = await prisma.debt.findUnique({
      where:   { id: debtId },
      include: {
        debtor:        true,
        creditor:      true,
        shameMessages: { orderBy: { sentAt: 'desc' } },
      },
    })

    if (!debt) {
      return NextResponse.json(
        { error: `Debt not found. It may have already been settled.` },
        { status: 404 }
      )
    }

    if (debt.status === 'PAID') {
      return NextResponse.json(
        { error: `${debt.debtor.name} already paid this debt. No shame needed! 🎉` },
        { status: 400 }
      )
    }

    // Determine shame tier from hours overdue
    const hoursOverdue = debt.dueDate
      ? (Date.now() - debt.dueDate.getTime()) / (1000 * 60 * 60)
      : 0

    const tier = hoursOverdue < 0 ? 0
      : hoursOverdue < 24 ? 0
      : hoursOverdue < 48 ? 1
      : hoursOverdue < 72 ? 2
      : 3

    // ── Mint NFT ──────────────────────────────────────────────────────────────
    if (action === 'mint_nft') {
      const daysOverdue = Math.max(0, Math.floor(hoursOverdue / 24))

      if (daysOverdue < 3) {
        return NextResponse.json(
          { error: `${debt.debtor.name} needs to be at least 3 days overdue to mint an NFT of Shame. Currently ${daysOverdue} day(s) overdue.` },
          { status: 400 }
        )
      }

      const existingToken = await prisma.shameToken.findUnique({ where: { debtId } })
      if (existingToken) {
        return NextResponse.json(
          { error: `An NFT of Shame already exists for this debt. Token: ${existingToken.tokenId}` },
          { status: 400 }
        )
      }

      const { fee } = calculateLateFee(debt.originalAmt, debt.dueDate ?? new Date())
      const metadata = generateShameNFTMetadata({
        debtorName:   debt.debtor.name,
        amount:       debt.amount + fee,
        description:  debt.description,
        daysOverdue,
        creditorName: debt.creditor.name,
      })

      const { tokenId, txHash } = await mintShameNFT({
        debtorId: debt.debtorId,
        debtId:   debt.id,
        metadata,
      })

      const token = await prisma.shameToken.create({
        data: {
          debtId:   debt.id,
          userId:   debt.debtorId,
          tokenId,
          txHash,
          metadata: JSON.stringify(metadata),
        },
      })

      await prisma.debt.update({
        where: { id: debtId },
        data:  { status: 'SHAMED' },
      })

      return NextResponse.json({ token, metadata, txHash, tokenId })
    }

    // ── Send shame message ────────────────────────────────────────────────────
    const message = await generateShameMessage(
      debt.debtor.name,
      debt.amount,
      debt.description || 'unpaid debt',
      tier
    )

    const shameMsg = await prisma.shameMessage.create({
      data: { debtId: debt.id, message, tier },
    })

    // Auto-escalate status to OVERDUE if past due date
    if (debt.dueDate && new Date() > debt.dueDate && debt.status === 'PENDING') {
      await prisma.debt.update({
        where: { id: debtId },
        data:  { status: 'OVERDUE' },
      })
    }

    return NextResponse.json({ message, tier, shameMsg })
  } catch (e) {
    console.error('[POST /api/shame]', e)
    return NextResponse.json(
      { error: 'Failed to process shame action. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const shamed = await prisma.debt.findMany({
      where:   { status: { in: ['OVERDUE', 'SHAMED'] } },
      include: {
        debtor:        { select: { id: true, name: true, avatar: true } },
        creditor:      { select: { id: true, name: true } },
        shameMessages: { orderBy: { sentAt: 'desc' }, take: 1 },
        shameToken:    true,
      },
      orderBy: { amount: 'desc' },
    })

    return NextResponse.json(shamed)
  } catch (e) {
    console.error('[GET /api/shame]', e)
    return NextResponse.json(
      { error: 'Failed to load Wall of Shame. Please try again.' },
      { status: 500 }
    )
  }
}
