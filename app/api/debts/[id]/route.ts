import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateLateFee } from '@/lib/fees'
import { generateShameNFTMetadata, mintShameNFT } from '@/lib/nft-shame'

/**
 * GET /api/debts/[id]
 * Returns a single debt by ID, used by LocusPayButton to poll for payment status.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const debt = await prisma.debt.findUnique({
      where: { id: params.id },
      include: {
        debtor:        { select: { id: true, name: true, avatar: true } },
        creditor:      { select: { id: true, name: true } },
        shameMessages: { orderBy: { sentAt: 'desc' }, take: 1 },
        shameToken:    true,
      },
    })

    if (!debt) {
      return NextResponse.json({ error: 'Debt not found.' }, { status: 404 })
    }

    // Enrich with calculated late fee
    const enriched = debt.dueDate && debt.status !== 'PAID'
      ? { ...debt, ...calculateLateFee(debt.originalAmt, debt.dueDate) }
      : { ...debt, fee: 0, daysOverdue: 0, totalOwed: debt.amount }

    return NextResponse.json(enriched)
  } catch (e) {
    console.error('[GET /api/debts/:id]', e)
    return NextResponse.json({ error: 'Failed to load debt.' }, { status: 500 })
  }
}

/**
 * PATCH /api/debts/[id]
 * Handles: mark paid, mint NFT
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}))
    const { action } = body

    const debt = await prisma.debt.findUnique({
      where: { id: params.id },
      include: { debtor: true, creditor: true, shameToken: true },
    })

    if (!debt) {
      return NextResponse.json({ error: 'Debt not found.' }, { status: 404 })
    }

    if (action === 'paid') {
      const updated = await prisma.debt.update({
        where: { id: params.id },
        data: { status: 'PAID', paidAt: new Date() },
      })
      return NextResponse.json(updated)
    }

    if (action === 'mint') {
      if (debt.shameToken) {
        return NextResponse.json({ error: 'NFT already minted for this debt.' }, { status: 400 })
      }

      const hoursOverdue = debt.dueDate
        ? (Date.now() - debt.dueDate.getTime()) / (1000 * 60 * 60)
        : 0
      const daysOverdue = Math.max(0, Math.floor(hoursOverdue / 24))

      if (daysOverdue < 3) {
        return NextResponse.json(
          { error: `Need at least 3 days overdue to mint NFT. Currently ${daysOverdue} day(s).` },
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
        where: { id: params.id },
        data:  { status: 'SHAMED' },
      })

      return NextResponse.json({ token, tokenId, txHash })
    }

    return NextResponse.json({ error: 'Unknown action. Use: paid, mint' }, { status: 400 })
  } catch (e) {
    console.error('[PATCH /api/debts/:id]', e)
    return NextResponse.json({ error: 'Failed to update debt.' }, { status: 500 })
  }
}
