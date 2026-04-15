/**
 * Demo Data Seeder — Locus Paygentic Hackathon
 * Creates rich, realistic demo data perfect for a 3-minute video demo.
 * Safe to call multiple times — always wipes and recreates.
 */
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    // Clean slate — order matters for FK constraints
    await prisma.shameToken.deleteMany()
    await prisma.shameMessage.deleteMany()
    await prisma.debt.deleteMany()
    await prisma.expense.deleteMany()
    await prisma.groupMember.deleteMany()
    await prisma.group.deleteMany()
    await prisma.user.deleteMany()

    // ── Users ──────────────────────────────────────────────────────────────
    const [you, jamie, priya, alex, sam] = await Promise.all([
      prisma.user.create({ data: { name: 'You',   email: 'you@splitease.app',   avatar: '🧑' } }),
      prisma.user.create({ data: { name: 'Jamie', email: 'jamie@splitease.app', avatar: '🦊' } }),
      prisma.user.create({ data: { name: 'Priya', email: 'priya@splitease.app', avatar: '🐼' } }),
      prisma.user.create({ data: { name: 'Alex',  email: 'alex@splitease.app',  avatar: '🦁' } }),
      prisma.user.create({ data: { name: 'Sam',   email: 'sam@splitease.app',   avatar: '🐨' } }),
    ])

    const now = Date.now()
    const day = 24 * 60 * 60 * 1000

    // ── Debts ──────────────────────────────────────────────────────────────
    // Debt 1: OVERDUE 4 days — Jamie owes You $64 — perfect for NFT + shame demo
    const debt1 = await prisma.debt.create({ data: {
      debtorId: jamie.id, creditorId: you.id,
      amount: 64.00, originalAmt: 64.00,
      description: 'Dinner at Nobu last Friday 🍣',
      status: 'OVERDUE',
      dueDate: new Date(now - 4 * day),
      lateFee: 12.80,
    }})

    // Debt 2: OVERDUE 2 days — Alex owes You $120 — shows escalation tier 2
    const debt2 = await prisma.debt.create({ data: {
      debtorId: alex.id, creditorId: you.id,
      amount: 120.00, originalAmt: 120.00,
      description: 'Concert tickets 🎵',
      status: 'OVERDUE',
      dueDate: new Date(now - 2 * day),
      lateFee: 12.00,
    }})

    // Debt 3: PENDING — Priya owes Jamie $45 — shows optimizer
    const debt3 = await prisma.debt.create({ data: {
      debtorId: priya.id, creditorId: jamie.id,
      amount: 45.00, originalAmt: 45.00,
      description: 'Airbnb split — Barcelona trip ✈️',
      status: 'PENDING',
      dueDate: new Date(now + 5 * day),
    }})

    // Debt 4: PENDING — Sam owes Priya $55 — optimizer fodder
    const debt4 = await prisma.debt.create({ data: {
      debtorId: sam.id, creditorId: priya.id,
      amount: 55.00, originalAmt: 55.00,
      description: 'Grocery run 🛒',
      status: 'PENDING',
      dueDate: new Date(now + 3 * day),
    }})

    // Debt 5: PAID — Priya paid You $30 — Hall of Fame entry
    const debt5 = await prisma.debt.create({ data: {
      debtorId: priya.id, creditorId: you.id,
      amount: 30.00, originalAmt: 30.00,
      description: 'Coffee run ☕',
      status: 'PAID',
      dueDate: new Date(now - 2 * day),
      paidAt: new Date(now - 1 * day),
    }})

    // Debt 6: PAID — Sam paid Jamie $80 — another Hall of Fame entry
    const debt6 = await prisma.debt.create({ data: {
      debtorId: sam.id, creditorId: jamie.id,
      amount: 80.00, originalAmt: 80.00,
      description: 'Hotel split 🏨',
      status: 'PAID',
      dueDate: new Date(now - 5 * day),
      paidAt: new Date(now - 3 * day),
    }})

    // ── Shame messages — pre-loaded for instant demo ───────────────────────
    await Promise.all([
      // Jamie — Tier 0 (gentle)
      prisma.shameMessage.create({ data: {
        debtId: debt1.id,
        message: `Hey Jamie! Just a friendly reminder that you owe $64.00 for "Dinner at Nobu last Friday 🍣". No rush... well, actually yes rush. 😅`,
        tier: 0,
      }}),
      // Jamie — Tier 1 (snarky)
      prisma.shameMessage.create({ data: {
        debtId: debt1.id,
        message: `Jamie, it's been 24 hours. Your $64.00 for "Dinner at Nobu" is still floating in the void. Your wallet called — it said it's embarrassed for you.`,
        tier: 1,
      }}),
      // Jamie — Tier 2 (passive-aggressive)
      prisma.shameMessage.create({ data: {
        debtId: debt1.id,
        message: `Oh Jamie! No worries about that $64.00 for "Dinner at Nobu". I'm sure you've just been INCREDIBLY busy. We'll add it to the list of things you've forgotten, right next to calling your mom back. 🙂`,
        tier: 2,
      }}),
      // Alex — Tier 0
      prisma.shameMessage.create({ data: {
        debtId: debt2.id,
        message: `Hey Alex! Just a friendly reminder that you owe $120.00 for "Concert tickets 🎵". No rush... well, actually yes rush. 😅`,
        tier: 0,
      }}),
      // Alex — Tier 1
      prisma.shameMessage.create({ data: {
        debtId: debt2.id,
        message: `Alex, $120.00 for concert tickets and you can't even send a text? The silence is deafening. Your wallet is crying. 🎵💸`,
        tier: 1,
      }}),
    ])

    // ── NFT of Shame — pre-minted on Jamie's debt for instant demo ─────────
    await prisma.shameToken.create({ data: {
      debtId: debt1.id,
      userId: jamie.id,
      tokenId: 'SHAME-A3F7B2C1',
      txHash: '0x4a7f3b2c1d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a',
      metadata: JSON.stringify({
        name: 'Certificate of Shame #4291',
        description: 'Jamie owes You $76.80 for "Dinner at Nobu last Friday 🍣" and has been a deadbeat for 4 days.',
        soulbound: true,
        attributes: [
          { trait_type: 'Debtor', value: 'Jamie' },
          { trait_type: 'Amount Owed', value: 76.80 },
          { trait_type: 'Days Overdue', value: 4 },
          { trait_type: 'Shame Level', value: 'EPIC' },
          { trait_type: 'Soulbound', value: 'TRUE — Cannot be transferred, sold, or escaped' },
        ],
      }),
    }})

    // Update Jamie's debt to SHAMED since NFT is minted
    await prisma.debt.update({
      where: { id: debt1.id },
      data: { status: 'SHAMED' },
    })

    return NextResponse.json({
      success: true,
      message: '🎬 Demo data loaded! 5 users, 6 debts, shame messages + NFT pre-minted.',
      summary: {
        users: ['You 🧑', 'Jamie 🦊', 'Priya 🐼', 'Alex 🦁', 'Sam 🐨'],
        debts: {
          shamed: 1,   // Jamie — NFT minted, ready to show
          overdue: 1,  // Alex — 2 days overdue, shame messages loaded
          pending: 2,  // Priya + Sam — optimizer fodder
          paid: 2,     // Priya + Sam — Hall of Fame entries
        },
        readyToDemo: [
          '✅ Jamie debt: SHAMED + NFT minted — expand to see all 3 shame tiers',
          '✅ Alex debt: OVERDUE — click Send Shame to fire Tier 3 AI message',
          '✅ Optimizer: 4 active debts → 2 optimal transfers',
          '✅ Hall of Fame: 2 paid debts showing',
          '✅ AI Insights: click the 🤖 tab for OpenClaw analysis',
          '✅ Wall of Shame: /shame — Jamie is publicly listed',
        ],
      },
    })
  } catch (e) {
    console.error('[POST /api/seed]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
