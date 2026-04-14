# 💸 SplitEase — Smart Expense Splitting

> Split expenses. Track debts. Shame deadbeats. Mint NFTs.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)](https://prisma.io)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![Claude AI](https://img.shields.io/badge/Claude-AI-orange)](https://anthropic.com)

---

## ✨ What is SplitEase?

SplitEase is a debt-collection app that actually works — because it escalates. Built for groups who split expenses and need a way to track, remind, and (if necessary) publicly shame people who don't pay.

Three features that make it stand out:

### 🤖 AI Shame Escalation Ladder
Messages that escalate automatically over 72 hours, powered by Claude:
| Time | Tier | Tone |
|------|------|------|
| T+0h | 0 | 😊 Gentle reminder |
| T+24h | 1 | 😏 Snarky nudge |
| T+48h | 2 | 😤 Passive-aggressive |
| T+72h | 3 | ☢️ Scorched earth (Claude API) |

### ⚡ Group Debt Optimizer
Minimum transaction algorithm — reduces N×(N-1) payments to at most N-1 optimal transfers. O(n log n), provably minimal. When a judge asks "how does it work?" — you have an answer.

### 🎨 NFT of Shame
Soulbound, non-transferable, permanently on-chain. After 3+ days overdue, mint a certificate of shame. "There is no escape from the blockchain."

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up database
npx prisma db push

# 3. Add your Anthropic API key (optional — fallback messages work without it)
# Edit .env.local → ANTHROPIC_API_KEY=sk-ant-...

# 4. Run dev server
npm run dev
```

Open **http://localhost:3000** → click **"Load Demo Data"** → go to Dashboard.

---

## 🎬 Demo Walkthrough (for video recording)

See [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) for the full step-by-step recording guide.

**TL;DR flow:**
1. Landing page → Load Demo Data
2. Dashboard → Overview (stats, ticker, recent debts)
3. Debts tab → expand Jamie's overdue debt → Send Shame → hear the sound
4. Optimizer tab → show N→3 transfers
5. Add Debt tab → add a new one live
6. Mint NFT on overdue debt → purple NFT card appears
7. Wall of Shame → share link

---

## 🔊 Sound Effects

Place these files in `/public/sounds/`:

| File | Download | Description |
|------|----------|-------------|
| `success.mp3` | [freesound.org/s/341695](https://freesound.org/s/341695/) | Positive chime — debt added |
| `shame.mp3` | [freesound.org/s/397353](https://freesound.org/s/397353/) | Dramatic sting — shame sent |
| `nft.mp3` | [freesound.org/s/320655](https://freesound.org/s/320655/) | Sci-fi blip — NFT minted |
| `paid.mp3` | [freesound.org/s/341695](https://freesound.org/s/341695/) | Coin sound — debt paid |
| `error.mp3` | [freesound.org/s/142608](https://freesound.org/s/142608/) | Soft error tone |

> Sounds fail silently if files are missing — the app works fine without them.

---

## 🗂️ Project Structure

```
splitwise-enforcer/
├── app/
│   ├── page.tsx                 ← Landing page with live counters
│   ├── dashboard/page.tsx       ← Main app (sidebar + 5 tabs)
│   ├── shame/
│   │   ├── page.tsx             ← Public wall of shame
│   │   └── [userId]/page.tsx    ← Shareable shame card
│   └── api/
│       ├── debts/route.ts       ← CRUD + late fee calculation
│       ├── shame/route.ts       ← AI escalation + NFT minting
│       ├── split/route.ts       ← Group optimizer
│       ├── users/route.ts       ← User list
│       └── seed/route.ts        ← Demo data loader
├── lib/
│   ├── split.ts                 ← Minimum transaction algorithm
│   ├── fees.ts                  ← Late fee engine (5%/day, 24h grace)
│   ├── ai-shame.ts              ← Escalation ladder + Claude API
│   ├── nft-shame.ts             ← Soulbound NFT generator
│   └── sounds.ts                ← Sound effect helper
├── components/
│   ├── ShameTable.tsx           ← Expandable debt rows
│   ├── HallOfFame.tsx           ← Paid debts leaderboard
│   ├── OptimizedTransfers.tsx   ← Optimizer visualization
│   └── ShameTicker.tsx          ← Live scrolling ticker
└── prisma/
    └── schema.prisma
```

---

## ⚙️ Environment Variables

```env
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY="sk-ant-..."        # Optional — enables real Claude messages at Tier 3
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Database | SQLite via Prisma 5 |
| Styling | Tailwind CSS v4 |
| AI | Anthropic Claude API |
| Language | TypeScript |

---

## 📱 Features

- ✅ Clean light theme — white cards, sage green accents
- ✅ Fully responsive — sidebar on desktop, bottom nav on mobile
- ✅ AI shame escalation (4 tiers, Claude at tier 3)
- ✅ Group debt optimizer (minimum transaction algorithm)
- ✅ Soulbound NFT of Shame (mock blockchain, real metadata)
- ✅ Late fee engine (5%/day after 24h grace period)
- ✅ Sound effects on key actions
- ✅ Public Wall of Shame with shareable links
- ✅ Hall of Fame for people who paid

---

Built with ❤️ for hackathon victory.
