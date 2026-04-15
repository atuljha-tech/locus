/**
 * Hardcoded demo data — shown on Vercel when SQLite is unavailable.
 * This ensures the app always looks full and working for demos/judges.
 */

const now = Date.now()
const day = 24 * 60 * 60 * 1000

export const DEMO_USERS = [
  { id: 'user_you',   name: 'You',   email: 'you@splitease.app',   avatar: '🧑', createdAt: new Date(now - 10 * day).toISOString() },
  { id: 'user_jamie', name: 'Jamie', email: 'jamie@splitease.app', avatar: '🦊', createdAt: new Date(now - 10 * day).toISOString() },
  { id: 'user_priya', name: 'Priya', email: 'priya@splitease.app', avatar: '🐼', createdAt: new Date(now - 10 * day).toISOString() },
  { id: 'user_alex',  name: 'Alex',  email: 'alex@splitease.app',  avatar: '🦁', createdAt: new Date(now - 10 * day).toISOString() },
  { id: 'user_sam',   name: 'Sam',   email: 'sam@splitease.app',   avatar: '🐨', createdAt: new Date(now - 10 * day).toISOString() },
]

export const DEMO_DEBTS = [
  // ── SHAMED — Jamie owes You $64 — NFT minted, 3 shame messages ──────────
  {
    id: 'debt_jamie_1',
    amount: 64.00,
    originalAmt: 64.00,
    description: 'Dinner at Nobu last Friday 🍣',
    status: 'SHAMED',
    dueDate: new Date(now - 4 * day).toISOString(),
    paidAt: null,
    createdAt: new Date(now - 5 * day).toISOString(),
    updatedAt: new Date(now - 1 * day).toISOString(),
    lateFee: 12.80,
    totalOwed: 76.80,
    daysOverdue: 4,
    debtorId: 'user_jamie',
    creditorId: 'user_you',
    debtor:   { id: 'user_jamie', name: 'Jamie', avatar: '🦊' },
    creditor: { id: 'user_you',   name: 'You',   avatar: '🧑' },
    shameMessages: [
      {
        id: 'sm_j3', debtId: 'debt_jamie_1', tier: 2, sentAt: new Date(now - 1 * day).toISOString(),
        message: `Oh Jamie! No worries about that $64.00 for "Dinner at Nobu". I'm sure you've just been INCREDIBLY busy. We'll add it to the list of things you've forgotten, right next to calling your mom back. 🙂`,
      },
      {
        id: 'sm_j2', debtId: 'debt_jamie_1', tier: 1, sentAt: new Date(now - 2 * day).toISOString(),
        message: `Jamie, it's been 24 hours. Your $64.00 for "Dinner at Nobu" is still floating in the void. Your wallet called — it said it's embarrassed for you.`,
      },
      {
        id: 'sm_j1', debtId: 'debt_jamie_1', tier: 0, sentAt: new Date(now - 3 * day).toISOString(),
        message: `Hey Jamie! Just a friendly reminder that you owe $64.00 for "Dinner at Nobu last Friday 🍣". No rush... well, actually yes rush. 😅`,
      },
    ],
    shameToken: {
      id: 'token_1',
      debtId: 'debt_jamie_1',
      userId: 'user_jamie',
      tokenId: 'SHAME-A3F7B2C1',
      txHash: '0x4a7f3b2c1d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a',
      mintedAt: new Date(now - 1 * day).toISOString(),
      metadata: JSON.stringify({
        name: 'Certificate of Shame #4291',
        description: 'Jamie owes You $76.80 for "Dinner at Nobu" and has been a deadbeat for 4 days.',
        soulbound: true,
        attributes: [
          { trait_type: 'Debtor', value: 'Jamie' },
          { trait_type: 'Amount Owed', value: 76.80 },
          { trait_type: 'Days Overdue', value: 4 },
          { trait_type: 'Shame Level', value: 'EPIC' },
        ],
      }),
    },
  },

  // ── OVERDUE — Alex owes You $120 — 2 shame messages ─────────────────────
  {
    id: 'debt_alex_1',
    amount: 120.00,
    originalAmt: 120.00,
    description: 'Concert tickets 🎵',
    status: 'OVERDUE',
    dueDate: new Date(now - 2 * day).toISOString(),
    paidAt: null,
    createdAt: new Date(now - 3 * day).toISOString(),
    updatedAt: new Date(now - 1 * day).toISOString(),
    lateFee: 12.00,
    totalOwed: 132.00,
    daysOverdue: 2,
    debtorId: 'user_alex',
    creditorId: 'user_you',
    debtor:   { id: 'user_alex', name: 'Alex', avatar: '🦁' },
    creditor: { id: 'user_you',  name: 'You',  avatar: '🧑' },
    shameMessages: [
      {
        id: 'sm_a2', debtId: 'debt_alex_1', tier: 1, sentAt: new Date(now - 1 * day).toISOString(),
        message: `Alex, $120.00 for concert tickets and you can't even send a text? The silence is deafening. Your wallet is crying. 🎵💸`,
      },
      {
        id: 'sm_a1', debtId: 'debt_alex_1', tier: 0, sentAt: new Date(now - 2 * day).toISOString(),
        message: `Hey Alex! Just a friendly reminder that you owe $120.00 for "Concert tickets 🎵". No rush... well, actually yes rush. 😅`,
      },
    ],
    shameToken: null,
  },

  // ── PENDING — Priya owes Jamie $45 ───────────────────────────────────────
  {
    id: 'debt_priya_1',
    amount: 45.00,
    originalAmt: 45.00,
    description: 'Airbnb split — Barcelona trip ✈️',
    status: 'PENDING',
    dueDate: new Date(now + 5 * day).toISOString(),
    paidAt: null,
    createdAt: new Date(now - 1 * day).toISOString(),
    updatedAt: new Date(now - 1 * day).toISOString(),
    lateFee: 0,
    totalOwed: 45.00,
    daysOverdue: 0,
    debtorId: 'user_priya',
    creditorId: 'user_jamie',
    debtor:   { id: 'user_priya', name: 'Priya', avatar: '🐼' },
    creditor: { id: 'user_jamie', name: 'Jamie', avatar: '🦊' },
    shameMessages: [],
    shameToken: null,
  },

  // ── PENDING — Sam owes Priya $55 ─────────────────────────────────────────
  {
    id: 'debt_sam_1',
    amount: 55.00,
    originalAmt: 55.00,
    description: 'Grocery run 🛒',
    status: 'PENDING',
    dueDate: new Date(now + 3 * day).toISOString(),
    paidAt: null,
    createdAt: new Date(now - 2 * day).toISOString(),
    updatedAt: new Date(now - 2 * day).toISOString(),
    lateFee: 0,
    totalOwed: 55.00,
    daysOverdue: 0,
    debtorId: 'user_sam',
    creditorId: 'user_priya',
    debtor:   { id: 'user_sam',   name: 'Sam',   avatar: '🐨' },
    creditor: { id: 'user_priya', name: 'Priya', avatar: '🐼' },
    shameMessages: [],
    shameToken: null,
  },

  // ── PAID — Priya paid You $30 — Hall of Fame ─────────────────────────────
  {
    id: 'debt_priya_2',
    amount: 30.00,
    originalAmt: 30.00,
    description: 'Coffee run ☕',
    status: 'PAID',
    dueDate: new Date(now - 2 * day).toISOString(),
    paidAt: new Date(now - 1 * day).toISOString(),
    createdAt: new Date(now - 3 * day).toISOString(),
    updatedAt: new Date(now - 1 * day).toISOString(),
    lateFee: 0,
    totalOwed: 30.00,
    daysOverdue: 0,
    debtorId: 'user_priya',
    creditorId: 'user_you',
    debtor:   { id: 'user_priya', name: 'Priya', avatar: '🐼' },
    creditor: { id: 'user_you',   name: 'You',   avatar: '🧑' },
    shameMessages: [],
    shameToken: null,
  },

  // ── PAID — Sam paid Jamie $80 — Hall of Fame ─────────────────────────────
  {
    id: 'debt_sam_2',
    amount: 80.00,
    originalAmt: 80.00,
    description: 'Hotel split 🏨',
    status: 'PAID',
    dueDate: new Date(now - 5 * day).toISOString(),
    paidAt: new Date(now - 3 * day).toISOString(),
    createdAt: new Date(now - 6 * day).toISOString(),
    updatedAt: new Date(now - 3 * day).toISOString(),
    lateFee: 0,
    totalOwed: 80.00,
    daysOverdue: 0,
    debtorId: 'user_sam',
    creditorId: 'user_jamie',
    debtor:   { id: 'user_sam',   name: 'Sam',   avatar: '🐨' },
    creditor: { id: 'user_jamie', name: 'Jamie', avatar: '🦊' },
    shameMessages: [],
    shameToken: null,
  },
]

export const DEMO_SHAME_DEBTS = DEMO_DEBTS.filter(
  d => d.status === 'OVERDUE' || d.status === 'SHAMED'
)
