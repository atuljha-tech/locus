import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateLateFee } from '@/lib/fees'
import { generateShameNFTMetadata, mintShameNFT } from '@/lib/nft-shame'
import { DEMO_DEBTS } from '@/lib/demo-data'

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

    if (debt) {
      const enriched = debt.dueDate && debt.status !== 'PAID'
        ? { ...debt, ...calculateLateFee(debt.originalAmt, debt.dueDate) }
        : { ...debt, fee: 0, daysOverdue: 0, totalOwed: debt.amount }
      return NextResponse.json(enriched)
    }

    // Fall back to demo data
    const demo = DEMO_DEBTS.find(d => d.id === params.id)
    if (demo) return NextResponse.json(demo)

    return NextResponse.json({ error: 'Debt not found.' }, { status: 404 })
  } catch {
    const demo = DEMO_DEBTS.find(d => d.id === params.id)
    if (demo) return NextResponse.json(demo)
    return NextResponse.json({ error: 'Failed to load debt.' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}))
    const { action } = body

    // Try DB first
    let debt: any = null
    let useDemo = false
    try {
      debt = await prisma.debt.findUnique({
        where: { id: params.id },
        include: { debtor: true, creditor: true, shameToken: true },
      })
    } catch { useDemo = true }

    if (!debt) {
      const demoDebt = DEMO_DEBTS.find(d => d.id === params.id)
      if (demoDebt) { useDemo = true; debt = demoDebt }
    }

    if (!debt) return NextResponse.json({ error: 'Debt not found.' }, { status: 404 })

    if (action === 'paid') {
      if (!useDemo) {
        const updated = await prisma.debt.update({
          where: { id: params.id },
          data: { status: 'PAID', paidAt: new Date() },
        })
        return NextResponse.json(updated)
      }
      return NextResponse.json({ ...debt, status: 'PAID', paidAt: new Date().toISOString() })
    }

    if (action === 'mint') {
      if (debt.shameToken) return NextResponse.json({ error: 'NFT already minted.' }, { status: 400 })

      const hoursOverdue = debt.dueDate
        ? (Date.now() - new Date(debt.dueDate).getTime()) / (1000 * 60 * 60)
        : 0
      const daysOverdue = Math.max(0, Math.floor(hoursOverdue / 24))
      if (daysOverdue < 3) return NextResponse.json({ error: `Need 3+ days overdue. Currently ${daysOverdue}.` }, { status: 400 })

      const { fee } = calculateLateFee(debt.originalAmt, debt.dueDate ? new Date(debt.dueDate) : new Date())
      const metadata = generateShameNFTMetadata({
        debtorName: debt.debtor.name, amount: debt.amount + fee,
        description: debt.description, daysOverdue, creditorName: debt.creditor.name,
      })
      const { tokenId, txHash } = await mintShameNFT({
        debtorId: debt.debtorId ?? debt.debtor.id, debtId: debt.id, metadata,
      })

      if (!useDemo) {
        const token = await prisma.shameToken.create({
          data: { debtId: debt.id, userId: debt.debtorId, tokenId, txHash, metadata: JSON.stringify(metadata) },
        })
        await prisma.debt.update({ where: { id: params.id }, data: { status: 'SHAMED' } })
        return NextResponse.json({ token, tokenId, txHash })
      }
      return NextResponse.json({ tokenId, txHash, success: true })
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update debt.' }, { status: 500 })
  }
}
