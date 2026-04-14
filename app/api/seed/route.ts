import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    await prisma.shameToken.deleteMany()
    await prisma.shameMessage.deleteMany()
    await prisma.debt.deleteMany()
    await prisma.expense.deleteMany()
    await prisma.groupMember.deleteMany()
    await prisma.group.deleteMany()
    await prisma.user.deleteMany()

    const [you, jamie, priya] = await Promise.all([
      prisma.user.create({ data: { name: 'You',        email: 'you@splitease.app',   avatar: '🧑' } }),
      prisma.user.create({ data: { name: 'Jamie',      email: 'jamie@splitease.app', avatar: '🦊' } }),
      prisma.user.create({ data: { name: 'Priya',      email: 'priya@splitease.app', avatar: '🐼' } }),
    ])

    const now = Date.now()
    const day = 24 * 60 * 60 * 1000

    // 3 debts — one for each demo moment
    await Promise.all([
      // Debt 1: Overdue — will trigger shame escalation live
      prisma.debt.create({ data: {
        debtorId: jamie.id, creditorId: you.id,
        amount: 64.00, originalAmt: 64.00,
        description: 'Dinner last Friday',
        status: 'OVERDUE',
        dueDate: new Date(now - 3 * day),
        lateFee: 9.60,
      }}),
      // Debt 2: Pending — will use optimizer
      prisma.debt.create({ data: {
        debtorId: priya.id, creditorId: jamie.id,
        amount: 45.00, originalAmt: 45.00,
        description: 'Airbnb split',
        status: 'PENDING',
        dueDate: new Date(now + 5 * day),
      }}),
      // Debt 3: Paid — shows Hall of Fame
      prisma.debt.create({ data: {
        debtorId: priya.id, creditorId: you.id,
        amount: 30.00, originalAmt: 30.00,
        description: 'Coffee run ☕',
        status: 'PAID',
        dueDate: new Date(now - 2 * day),
        paidAt: new Date(now - 1 * day),
      }}),
    ])

    return NextResponse.json({ success: true, message: 'Demo data loaded — 3 users, 3 debts' })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
