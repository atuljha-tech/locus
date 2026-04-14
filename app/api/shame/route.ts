import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateShameMessage } from '@/lib/ai-shame'
import { generateShameNFTMetadata, mintShameNFT } from '@/lib/nft-shame'
import { calculateLateFee } from '@/lib/fees'

// POST /api/shame — trigger shame escalation for a debt
export async function POST(req: NextRequest) {
  try {
    const { debtId, action } = await req.json()

    const debt = await prisma.debt.findUnique({
      where:   { id: debtId },
      include: {
        debtor:        true,
        creditor:      true,
        shameMessages: { orderBy: { sentAt: 'desc' } },
      },
    })

    if (!debt) return NextResponse.json({ error: 'Debt not found' }, { status: 404 })

    // Determine tier based on hours overdue
    const hoursOverdue = debt.dueDate
      ? (Date.now() - debt.dueDate.getTime()) / (1000 * 60 * 60)
      : 0

    const tier = hoursOverdue < 0 ? 0
      : hoursOverdue < 24 ? 0
      : hoursOverdue < 48 ? 1
      : hoursOverdue < 72 ? 2
      : 3

    if (action === 'mint_nft') {
      // Mint NFT of Shame
      const { fee, daysOverdue } = calculateLateFee(debt.originalAmt, debt.dueDate ?? new Date())
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

      const token = await prisma.shameToken.upsert({
        where:  { debtId: debt.id },
        update: { tokenId, txHash, metadata: JSON.stringify(metadata) },
        create: {
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

    // Generate shame message
    const message = await generateShameMessage(
      debt.debtor.name,
      debt.amount,
      debt.description,
      tier
    )

    const shameMsg = await prisma.shameMessage.create({
      data: { debtId: debt.id, message, tier },
    })

    return NextResponse.json({ message, tier, shameMsg })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// GET /api/shame — get all shamed debts for wall of shame
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
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
