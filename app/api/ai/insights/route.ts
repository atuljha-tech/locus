/**
 * AI Insights API — Powered by OpenClaw
 * Locus Paygentic Hackathon
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { analyzeDebtRisk, generateGroupInsights } from '@/lib/ai-shame'
import { calculateLateFee } from '@/lib/fees'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') ?? 'group'

    if (type === 'group') {
      const debts = await prisma.debt.findMany({
        where: { status: { not: 'PAID' } },
        include: {
          debtor: { select: { id: true, name: true } },
          shameMessages: true,
          shameToken: true,
        },
      })

      const totalOwed = debts.reduce((s, d) => {
        if (d.dueDate) {
          const { totalOwed } = calculateLateFee(d.originalAmt, d.dueDate)
          return s + totalOwed
        }
        return s + d.amount
      }, 0)

      const overdueCount = debts.filter(d => d.status === 'OVERDUE' || d.status === 'SHAMED').length

      // Aggregate by debtor
      const userMap = new Map<string, { name: string; owedAmount: number }>()
      for (const debt of debts) {
        const existing = userMap.get(debt.debtorId) ?? { name: debt.debtor.name, owedAmount: 0 }
        existing.owedAmount += debt.amount
        userMap.set(debt.debtorId, existing)
      }

      const insights = await generateGroupInsights({
        totalOwed,
        overdueCount,
        totalDebts: debts.length,
        users: Array.from(userMap.values()),
      })

      return NextResponse.json(insights)
    }

    return NextResponse.json({ error: 'Unknown insight type' }, { status: 400 })
  } catch (e) {
    console.error('[GET /api/ai/insights]', e)
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body?.debtId) {
      return NextResponse.json({ error: 'Missing debtId' }, { status: 400 })
    }

    const debt = await prisma.debt.findUnique({
      where: { id: body.debtId },
      include: {
        debtor: true,
        shameMessages: true,
        shameToken: true,
      },
    })

    if (!debt) return NextResponse.json({ error: 'Debt not found' }, { status: 404 })

    const hoursOverdue = debt.dueDate
      ? (Date.now() - debt.dueDate.getTime()) / (1000 * 60 * 60)
      : 0
    const daysOverdue = Math.max(0, Math.floor(hoursOverdue / 24))

    const analysis = await analyzeDebtRisk({
      debtorName: debt.debtor.name,
      amount: debt.amount,
      daysOverdue,
      description: debt.description,
      shameCount: debt.shameMessages.length,
      hasNFT: !!debt.shameToken,
    })

    return NextResponse.json(analysis)
  } catch (e) {
    console.error('[POST /api/ai/insights]', e)
    return NextResponse.json({ error: 'Failed to analyze debt' }, { status: 500 })
  }
}
