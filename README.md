# 💸 SplitEase — Never chase friends for money again

> **[▶ Watch 3-min demo](#)** · [Live App](#) · Built for hackathon victory

---

## What it does (1 sentence)

SplitEase splits group expenses, tracks who owes what, and automatically escalates from gentle reminders to AI-generated scorched-earth shame messages — ending with a soulbound NFT permanently minted on-chain.

## Why I built this

My friend owes me $64 for dinner. It's been 3 days. He's seen my messages. This app is for everyone who's been there.

---

## Demo (30 seconds)

```
1. Load demo data → 3 users, 3 debts
2. Expand overdue debt → Send Shame → AI message fires
3. Optimizer tab → 3 debts → 2 optimal transfers
4. Mint NFT → permanent on-chain record
5. Wall of Shame → public shareable link
```

---

## Three features judges won't have seen

### 🤖 AI Shame Escalation Ladder
| Time | Tier | Tone |
|------|------|------|
| T+0h | 0 | 😊 Gentle reminder |
| T+24h | 1 | 😏 Snarky nudge |
| T+48h | 2 | 😤 Passive-aggressive |
| T+72h | 3 | ☢️ Scorched earth (Claude API) |

### ⚡ Group Debt Optimizer
Minimum transaction algorithm. 5 people, 10 debts → 3 optimal transfers. O(n log n), provably minimal. When a judge asks "how does it work?" — you have a real CS answer.

### 🎨 NFT of Shame
Soulbound. Non-transferable. Permanently on-chain. After 3+ days overdue, mint a certificate of shame. "There is no escape from the blockchain."

---

## How it makes money (business model)

- **5% daily late fee** on overdue debts (after 24h grace period)
- **$2 NFT minting fee** per shame token
- **Premium tier**: custom shame message templates, group analytics

---

## Quick Start (5 minutes)

```bash
# 1. Clone
git clone https://github.com/atuljha-tech/locus.git
cd locus

# 2. Install
npm install

# 3. Database
npx prisma db push

# 4. Environment (copy and edit)
cp .env.example .env.local
# Add ANTHROPIC_API_KEY for real Claude messages (optional — fallback works without it)

# 5. Run
npm run dev
```

Open **http://localhost:3000** → click **"Load Demo Data"** → go to Dashboard.

---

## Tech Stack

| Layer | Tech | Why |
|-------|------|-----|
| Framework | Next.js 14 (App Router) | Full-stack, fast, Vercel-ready |
| Database | SQLite + Prisma 5 | Zero setup, works locally |
| AI | Anthropic Claude API | Best shame messages |
| Styling | Tailwind CSS v4 | Clean light theme |
| Language | TypeScript | No runtime surprises |

---

## Project Structure

```
app/
  page.tsx                 ← Landing (counters, escalation demo)
  dashboard/page.tsx       ← Main app (sidebar + 5 tabs)
  shame/page.tsx           ← Public wall of shame
  shame/[userId]/page.tsx  ← Shareable shame card
  api/
    debts/route.ts         ← CRUD + late fee calc + validation
    shame/route.ts         ← AI escalation + NFT minting
    users/route.ts         ← User list
    seed/route.ts          ← Demo data (3 users, 3 debts)
lib/
  split.ts                 ← Minimum transaction algorithm
  fees.ts                  ← Late fee engine
  ai-shame.ts              ← Escalation ladder + Claude API
  nft-shame.ts             ← Soulbound NFT generator
  sounds.ts                ← Sound effect helper
components/
  ShameTable.tsx           ← Expandable debt rows + shame meter
  HallOfFame.tsx           ← Paid debts leaderboard
  OptimizedTransfers.tsx   ← Optimizer visualization
  ShameTicker.tsx          ← Live scrolling activity ticker
```

---

## Environment Variables

```env
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY="sk-ant-..."   # Optional — enables Claude at Tier 3
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set env vars in Vercel dashboard:
# ANTHROPIC_API_KEY → your Claude key
# DATABASE_URL → use a hosted DB (PlanetScale, Turso, Neon) for production
```

> **Note for Vercel:** SQLite works for demos. For production, swap `DATABASE_URL` to a hosted Postgres/MySQL/Turso instance and update `prisma/schema.prisma` provider accordingly.

---

## Error Handling

Every API route returns structured errors:
```json
{ "error": "Jamie already paid this debt. No shame needed! 🎉" }
{ "error": "Amount must be a positive number." }
{ "error": "Debtor not found. They may not be registered." }
```

The UI surfaces these as toast notifications with sound feedback.

---

## Sound Effects

Files in `/public/sounds/` (`.wav`, `.flac` supported):

| File | Triggers on |
|------|-------------|
| `shame.flac` | Shame message sent |
| `nft.waz.wav` | NFT minted |
| `paid.wav` | Debt marked paid |
| `success.waz.wav` | Debt added |
| `error.wav` | Any error |

---

Built with ❤️ for hackathon victory.
