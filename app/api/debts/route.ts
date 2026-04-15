import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateLateFee } from '@/lib/fees'
import { DEMO_DEBTS, DEMO_USERS } from '@/lib/demo-data'

export async function GET() {
  try {
    const debts = await prisma.debt.findMany({
      include: {
        debtor:        { select: { id: true, name: true, email: true, avatar: true } },
        creditor:      { select: { id: true, name: true, email: true, avatar: true } },
        shameMessages: { orderBy: { sentAt: 'desc' }, take: 3 },
        shameToken:    true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // If DB is empty or unavailable, return hardcoded demo data
    if (debts.length === 0) return NextResponse.json(DEMO_DEBTS)

    const enriched = debts.map(debt => {
      if (debt.dueDate && debt.status !== 'PAID') {
        const { fee, daysOverdue, totalOwed } = calculateLateFee(debt.originalAmt, debt.dueDate)
        return { ...debt, lateFee: fee, totalOwed, daysOverdue }
      }
      return { ...debt, totalOwed: debt.amount, daysOverdue: 0 }
    })

    return NextResponse.json(enriched)
  } catch {
    // DB unavailable on Vercel — return hardcoded demo data
    return NextResponse.json(DEMO_DEBTS)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })

    const { debtorId, creditorId, amount, description, dueDate } = body

    if (!debtorId || !creditorId || !amount)
      return NextResponse.json({ error: 'Missing required fields: debtorId, creditorId, amount.' }, { status: 400 })

    if (debtorId === creditorId)
      return NextResponse.json({ error: 'Debtor and creditor must be different people.' }, { status: 400 })

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0)
      return NextResponse.json({ error: 'Amount must be a positive number.' }, { status: 400 })

    try {
      const [debtor, creditor] = await Promise.all([
        prisma.user.findUnique({ where: { id: debtorId } }),
        prisma.user.findUnique({ where: { id: creditorId } }),
      ])
      if (!debtor)   return NextResponse.json({ error: 'Debtor not found.' }, { status: 404 })
      if (!creditor) return NextResponse.json({ error: 'Creditor not found.' }, { status: 404 })

      const debt = await prisma.debt.create({
        data: {
          debtorId, creditorId,
          amount: parsedAmount, originalAmt: parsedAmount,
          description: description?.trim() ?? '',
          dueDate: dueDate ? new Date(dueDate) : null,
          status: 'PENDING',
        },
        include: {
          debtor:   { select: { id: true, name: true, email: true } },
          creditor: { select: { id: true, name: true, email: true } },
        },
      })
      return NextResponse.json(debt, { status: 201 })
    } catch {
      // DB unavailable — return a mock created debt using demo users
      const debtorUser  = DEMO_USERS.find(u => u.id === debtorId)  ?? DEMO_USERS[1]
      const creditorUser = DEMO_USERS.find(u => u.id === creditorId) ?? DEMO_USERS[0]
      const mockDebt = {
        id: `debt_new_${Date.now()}`,
        amount: parsedAmount, originalAmt: parsedAmount,
        description: description?.trim() ?? '',
        status: 'PENDING', dueDate: dueDate ?? null, paidAt: null,
        lateFee: 0, totalOwed: parsedAmount, daysOverdue: 0,
        debtorId, creditorId,
        debtor:   { id: debtorUser.id,   name: debtorUser.name,   avatar: debtorUser.avatar },
        creditor: { id: creditorUser.id, name: creditorUser.name, avatar: creditorUser.avatar },
        shameMessages: [], shameToken: null,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }
      return NextResponse.json(mockDebt, { status: 201 })
    }
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create debt.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body?.id || !body?.status)
      return NextResponse.json({ error: 'Missing required fields: id, status.' }, { status: 400 })

    try {
      const debt = await prisma.debt.update({
        where: { id: body.id },
        data:  { status: body.status, paidAt: body.status === 'PAID' ? new Date() : null },
      })
      return NextResponse.json(debt)
    } catch {
      // DB unavailable — return mock success
      return NextResponse.json({ id: body.id, status: body.status, success: true })
    }
  } catch {
    return NextResponse.json({ error: 'Failed to update debt.' }, { status: 500 })
  }
}
