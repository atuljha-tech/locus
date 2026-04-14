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

    const enriched = debts.map(debt => {
      if (debt.dueDate && debt.status !== 'PAID') {
        const { fee, daysOverdue, totalOwed } = calculateLateFee(debt.originalAmt, debt.dueDate)
        return { ...debt, lateFee: fee, totalOwed, daysOverdue }
      }
      return { ...debt, totalOwed: debt.amount, daysOverdue: 0 }
    })

    return NextResponse.json(enriched)
  } catch (e) {
    console.error('[GET /api/debts]', e)
    return NextResponse.json(
      { error: 'Failed to load debts. Please try again.' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }

    const { debtorId, creditorId, amount, description, dueDate } = body

    if (!debtorId || !creditorId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: debtorId, creditorId, amount.' },
        { status: 400 }
      )
    }

    if (debtorId === creditorId) {
      return NextResponse.json(
        { error: 'Debtor and creditor must be different people.' },
        { status: 400 }
      )
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number.' },
        { status: 400 }
      )
    }

    // Verify both users exist
    const [debtor, creditor] = await Promise.all([
      prisma.user.findUnique({ where: { id: debtorId } }),
      prisma.user.findUnique({ where: { id: creditorId } }),
    ])

    if (!debtor) {
      return NextResponse.json({ error: `Debtor not found. They may not be registered.` }, { status: 404 })
    }
    if (!creditor) {
      return NextResponse.json({ error: `Creditor not found. They may not be registered.` }, { status: 404 })
    }

    const debt = await prisma.debt.create({
      data: {
        debtorId,
        creditorId,
        amount:      parsedAmount,
        originalAmt: parsedAmount,
        description: description?.trim() ?? '',
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
    console.error('[POST /api/debts]', e)
    return NextResponse.json(
      { error: 'Failed to create debt. Please try again.' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body?.id || !body?.status) {
      return NextResponse.json({ error: 'Missing required fields: id, status.' }, { status: 400 })
    }

    const validStatuses = ['PENDING', 'OVERDUE', 'PAID', 'SHAMED']
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const existing = await prisma.debt.findUnique({ where: { id: body.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Debt not found.' }, { status: 404 })
    }

    const debt = await prisma.debt.update({
      where: { id: body.id },
      data:  { status: body.status, paidAt: body.status === 'PAID' ? new Date() : null },
    })

    return NextResponse.json(debt)
  } catch (e) {
    console.error('[PATCH /api/debts]', e)
    return NextResponse.json(
      { error: 'Failed to update debt. Please try again.' },
      { status: 500 }
    )
  }
}
