import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateLateFee } from '@/lib/fees'

export async function GET() {
  try {
    const debts = await prisma.debt.findMany({
      include: {
        debtor:        { select: { id: true, name: true, email: true, avatar: true } },
        creditor:      { select: { id: true, name: true, email: true, avatar: true } },
        shameMessages: { orderBy: { sentAt: 'desc' }, take: 1 },
        shameToken:    true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Recalculate late fees on the fly
    const enriched = debts.map(debt => {
      if (debt.dueDate && debt.status !== 'PAID') {
        const { fee, daysOverdue, totalOwed } = calculateLateFee(debt.originalAmt, debt.dueDate)
        return { ...debt, lateFee: fee, totalOwed, daysOverdue }
      }
      return { ...debt, totalOwed: debt.amount, daysOverdue: 0 }
    })

    return NextResponse.json(enriched)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { debtorId, creditorId, amount, description, dueDate } = body

    const debt = await prisma.debt.create({
      data: {
        debtorId,
        creditorId,
        amount:      parseFloat(amount),
        originalAmt: parseFloat(amount),
        description: description ?? '',
        dueDate:     dueDate ? new Date(dueDate) : null,
        status:      'PENDING',
      },
      include: {
        debtor:   { select: { id: true, name: true, email: true } },
        creditor: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(debt, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json()
    const debt = await prisma.debt.update({
      where: { id },
      data:  { status, paidAt: status === 'PAID' ? new Date() : null },
    })
    return NextResponse.json(debt)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
