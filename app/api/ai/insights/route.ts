import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { analyzeDebtRisk, generateGroupInsights } from '@/lib/ai-shame'
import { calculateLateFee } from '@/lib/fees'
import { DEMO_DEBTS, DEMO_USERS } from '@/lib/demo-data'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') ?? 'group'

    if (type === 'group') {
      let debts: any[] = []
      try {
        debts = await prisma.debt.findMany({
          where: { status: { not: 'PAID' } },
          include: { debtor: { select: { id: true, name: true } }, shameMessages: true, shameToken: true },
        })
        if (debts.length === 0) debts = DEMO_DEBTS.filter(d => d.status !== 'PAID')
      } catch {
        debts = DEMO_DEBTS.filter(d => d.status !== 'PAID')
      }

      const totalOwed = debts.reduce((s: number, d: any) => {
        if (d.dueDate) {
          const { totalOwed } = calculateLateFee(d.originalAmt, new Date(d.dueDate))
          return s + totalOwed
        }
        return s + d.amount
      }, 0)

      const overdueCount = debts.filter((d: any) => d.status === 'OVERDUE' || d.status === 'SHAMED').length

      const userMap = new Map<string, { name: string; owedAmount: number }>()
      for (const debt of debts) {
        const id = debt.debtorId ?? debt.debtor?.id
        const name = debt.debtor?.name ?? 'Unknown'
        const existing = userMap.get(id) ?? { name, owedAmount: 0 }
        existing.owedAmount += debt.amount
        userMap.set(id, existing)
      }

      const insights = await generateGroupInsights({
        totalOwed, overdueCount, totalDebts: debts.length,
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
    if (!body?.debtId) return NextResponse.json({ error: 'Missing debtId' }, { status: 400 })

    let debt: any = null
    try {
      debt = await prisma.debt.findUnique({
        where: { id: body.debtId },
        include: { debtor: true, shameMessages: true, shameToken: true },
      })
    } catch { /* fall through */ }

    if (!debt) {
      const demo = DEMO_DEBTS.find(d => d.id === body.debtId)
      if (demo) {
        debt = {
          ...demo,
          debtor: { ...demo.debtor, email: `${demo.debtor.name.toLowerCase()}@splitease.app` },
          shameMessages: demo.shameMessages,
          shameToken: demo.shameToken,
        }
      }
    }

    if (!debt) return NextResponse.json({ error: 'Debt not found' }, { status: 404 })

    const hoursOverdue = debt.dueDate
      ? (Date.now() - new Date(debt.dueDate).getTime()) / (1000 * 60 * 60)
      : 0
    const daysOverdue = Math.max(0, Math.floor(hoursOverdue / 24))

    const analysis = await analyzeDebtRisk({
      debtorName: debt.debtor.name,
      amount: debt.amount,
      daysOverdue,
      description: debt.description,
      shameCount: debt.shameMessages?.length ?? 0,
      hasNFT: !!debt.shameToken,
    })

    return NextResponse.json(analysis)
  } catch (e) {
    console.error('[POST /api/ai/insights]', e)
    return NextResponse.json({ error: 'Failed to analyze debt' }, { status: 500 })
  }
}
