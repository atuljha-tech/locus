import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { minimizeTransactions, splitEqually } from '@/lib/split'

export async function POST(req: NextRequest) {
  try {
    const { groupId, description, amount, paidById, memberIds, splitType } = await req.json()

    // Create expense
    const expense = await prisma.expense.create({
      data: { description, amount: parseFloat(amount), groupId, paidById },
    })

    // Calculate splits
    const shares = splitEqually(parseFloat(amount), memberIds)

    // Create debts for each member (except payer)
    const debtPromises = memberIds
      .filter((id: string) => id !== paidById)
      .map((memberId: string) =>
        prisma.debt.create({
          data: {
            debtorId:    memberId,
            creditorId:  paidById,
            amount:      shares[memberId],
            originalAmt: shares[memberId],
            description,
            expenseId:   expense.id,
            dueDate:     new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        })
      )

    await Promise.all(debtPromises)

    return NextResponse.json({ expense, message: 'Split created successfully' }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const groupId = searchParams.get('groupId')

    if (!groupId) return NextResponse.json({ error: 'groupId required' }, { status: 400 })

    const members = await prisma.groupMember.findMany({
      where:   { groupId },
      include: { user: true },
    })

    const debts = await prisma.debt.findMany({
      where: {
        status: { not: 'PAID' },
        OR: [
          { debtor:   { groups: { some: { groupId } } } },
          { creditor: { groups: { some: { groupId } } } },
        ],
      },
    })

    // Build balance map
    const balanceMap = new Map<string, { userId: string; name: string; net: number }>()
    members.forEach(m => {
      balanceMap.set(m.userId, { userId: m.userId, name: m.user.name, net: 0 })
    })

    debts.forEach(d => {
      const creditor = balanceMap.get(d.creditorId)
      const debtor   = balanceMap.get(d.debtorId)
      if (creditor) creditor.net += d.amount
      if (debtor)   debtor.net   -= d.amount
    })

    const balances   = Array.from(balanceMap.values())
    const transfers  = minimizeTransactions(balances)

    return NextResponse.json({ balances, transfers, memberCount: members.length })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
