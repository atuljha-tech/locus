/**
 * Demo Data Seeder
 * Creates realistic demo data for the Locus Paygentic Hackathon demo
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    // Clean slate
    await prisma.shameToken.deleteMany()
    await prisma.shameMessage.deleteMany()
    await prisma.debt.deleteMany()
    await prisma.expense.deleteMany()
    await prisma.groupMember.deleteMany()
    await prisma.group.deleteMany()
    await prisma.user.deleteMany()

    // Create users
    const [you, jamie, priya, alex, sam] = await Promise.all([
      prisma.user.create({ data: { name: 'You',   email: 'you@splitease.app',   avatar: '🧑' } }),
      prisma.user.create({ data: { name: 'Jamie', email: 'jamie@splitease.app', avatar: '🦊' } }),
      prisma.user.create({ data: { name: 'Priya', email: 'priya@splitease.app', avatar: '🐼' } }),
      prisma.user.create({ data: { name: 'Alex',  email: 'alex@splitease.app',  avatar: '🦁' } }),
      prisma.user.create({ data: { name: 'Sam',   email: 'sam@splitease.app',   avatar: '🐨' } }),
    ])

    const now = Date.now()
    const day = 24 * 60 * 60 * 1000

    // Create debts with varied scenarios
    const [debt1, debt2, debt3, debt4, debt5] = await Promise.all([
      // Debt 1: Overdue 4 days — perfect for NFT minting demo
      prisma.debt.create({ data: {
        debtorId: jamie.id, creditorId: you.id,
        amount: 64.00, originalAmt: 64.00,
        description: 'Dinner at Nobu last Friday',
        status: 'OVERDUE',
        dueDate: new Date(now - 4 * day),
        lateFee: 12.80,
      }}),
      // Debt 2: Pending — will use optimizer
      prisma.debt.create({ data: {
        debtorId: priya.id, creditorId: jamie.id,
        amount: 45.00, originalAmt: 45.00,
        description: 'Airbnb split — Barcelona trip',
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
      // Debt 4: Overdue 2 days — shows escalation
      prisma.debt.create({ data: {
        debtorId: alex.id, creditorId: you.id,
        amount: 120.00, originalAmt: 120.00,
        description: 'Concert tickets 🎵',
        status: 'OVERDUE',
        dueDate: new Date(now - 2 * day),
        lateFee: 12.00,
      }}),
      // Debt 5: Pending — optimizer fodder
      prisma.debt.create({ data: {
        debtorId: sam.id, creditorId: priya.id,
        amount: 55.00, originalAmt: 55.00,
        description: 'Grocery run 🛒',
        status: 'PENDING',
        dueDate: new Date(now + 3 * day),
      }}),
    ])

    // Add shame messages to overdue debts
    await Promise.all([
      prisma.shameMessage.create({
        data: {
          debtId: debt1.id,
          message: `Hey Jamie! Just a friendly reminder that you owe $64.00 for "Dinner at Nobu last Friday". No rush... well, actually yes rush. 😅`,
          tier: 0,
        },
      }),
      prisma.shameMessage.create({
        data: {
          debtId: debt1.id,
          message: `Jamie, it's been 24 hours. Your $64.00 for "Dinner at Nobu last Friday" is still floating in the void. Your wallet called — it said it's embarrassed for you.`,
          tier: 1,
        },
      }),
      prisma.shameMessage.create({
        data: {
          debtId: debt4.id,
          message: `Hey Alex! Just a friendly reminder that you owe $120.00 for "Concert tickets 🎵". No rush... well, actually yes rush. 😅`,
          tier: 0,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Demo data loaded — 5 users, 5 debts, shame messages added',
      users: [you.name, jamie.name, priya.name, alex.name, sam.name],
      debts: 5,
    })
  } catch (e) {
    console.error('[POST /api/seed]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
