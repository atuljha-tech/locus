import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateShameMessage } from '@/lib/ai-shame'
import { generateShameNFTMetadata, mintShameNFT } from '@/lib/nft-shame'
import { calculateLateFee } from '@/lib/fees'
import { DEMO_SHAME_DEBTS, DEMO_DEBTS } from '@/lib/demo-data'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body?.debtId) return NextResponse.json({ error: 'Missing debtId.' }, { status: 400 })

    const { debtId, action } = body

    // Try DB first, fall back to demo data
    let debt: any = null
    let useDemo = false

    try {
      debt = await prisma.debt.findUnique({
        where: { id: debtId },
        include: { debtor: true, creditor: true, shameMessages: { orderBy: { sentAt: 'desc' } } },
      })
    } catch {
      useDemo = true
    }

    if (!debt) {
      // Look in demo data
      const demoDebt = DEMO_DEBTS.find(d => d.id === debtId)
      if (demoDebt) {
        useDemo = true
        debt = {
          ...demoDebt,
          dueDate: demoDebt.dueDate ? new Date(demoDebt.dueDate) : null,
          debtor: { ...demoDebt.debtor, email: `${demoDebt.debtor.name.toLowerCase()}@splitease.app` },
          creditor: { ...demoDebt.creditor, email: `${demoDebt.creditor.name.toLowerCase()}@splitease.app` },
        }
      }
    }

    if (!debt) return NextResponse.json({ error: 'Debt not found.' }, { status: 404 })
    if (debt.status === 'PAID') return NextResponse.json({ error: `${debt.debtor.name} already paid! 🎉` }, { status: 400 })

    const hoursOverdue = debt.dueDate
      ? (Date.now() - new Date(debt.dueDate).getTime()) / (1000 * 60 * 60)
      : 0
    const tier = hoursOverdue < 0 ? 0 : hoursOverdue < 24 ? 0 : hoursOverdue < 48 ? 1 : hoursOverdue < 72 ? 2 : 3

    // ── Mint NFT ──────────────────────────────────────────────────────────
    if (action === 'mint_nft') {
      const daysOverdue = Math.max(0, Math.floor(hoursOverdue / 24))
      if (daysOverdue < 3) return NextResponse.json({ error: `Need 3+ days overdue. Currently ${daysOverdue} day(s).` }, { status: 400 })

      const { fee } = calculateLateFee(debt.originalAmt, debt.dueDate ? new Date(debt.dueDate) : new Date())
      const metadata = generateShameNFTMetadata({
        debtorName: debt.debtor.name, amount: debt.amount + fee,
        description: debt.description, daysOverdue, creditorName: debt.creditor.name,
      })
      const { tokenId, txHash } = await mintShameNFT({ debtorId: debt.debtorId ?? debt.debtor.id, debtId: debt.id, metadata })

      if (!useDemo) {
        const token = await prisma.shameToken.create({
          data: { debtId: debt.id, userId: debt.debtorId, tokenId, txHash, metadata: JSON.stringify(metadata) },
        })
        await prisma.debt.update({ where: { id: debtId }, data: { status: 'SHAMED' } })
        return NextResponse.json({ token, metadata, txHash, tokenId })
      }
      return NextResponse.json({ tokenId, txHash, metadata, success: true })
    }

    // ── Send shame message ────────────────────────────────────────────────
    const message = await generateShameMessage(debt.debtor.name, debt.amount, debt.description || 'unpaid debt', tier)

    if (!useDemo) {
      const shameMsg = await prisma.shameMessage.create({ data: { debtId: debt.id, message, tier } })
      if (debt.dueDate && new Date() > new Date(debt.dueDate) && debt.status === 'PENDING') {
        await prisma.debt.update({ where: { id: debtId }, data: { status: 'OVERDUE' } })
      }
      return NextResponse.json({ message, tier, shameMsg })
    }

    return NextResponse.json({ message, tier, shameMsg: { id: `sm_${Date.now()}`, message, tier, sentAt: new Date().toISOString() } })
  } catch (e) {
    console.error('[POST /api/shame]', e)
    return NextResponse.json({ error: 'Failed to process shame action.' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const shamed = await prisma.debt.findMany({
      where: { status: { in: ['OVERDUE', 'SHAMED'] } },
      include: {
        debtor:        { select: { id: true, name: true, avatar: true } },
        creditor:      { select: { id: true, name: true } },
        shameMessages: { orderBy: { sentAt: 'desc' }, take: 1 },
        shameToken:    true,
      },
      orderBy: { amount: 'desc' },
    })
    if (shamed.length === 0) return NextResponse.json(DEMO_SHAME_DEBTS)
    return NextResponse.json(shamed)
  } catch {
    return NextResponse.json(DEMO_SHAME_DEBTS)
  }
}
