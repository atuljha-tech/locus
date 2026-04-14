# ⚙️ Setup Guide — SplitEase

Get running in under 5 minutes.

## Prerequisites

- Node.js 18+ (`node --version`)
- npm 9+ (`npm --version`)
- Git

## Steps

### 1. Clone the repo

```bash
git clone https://github.com/atuljha-tech/locus.git
cd locus
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up the database

```bash
npx prisma db push
```

This creates a local SQLite file at `prisma/dev.db`. No external database needed.

### 4. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY="sk-ant-..."   # Optional — get one at console.anthropic.com
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> Without `ANTHROPIC_API_KEY`, Tier 3 shame messages use a built-in fallback. The app works fully without it.

### 5. Run the dev server

```bash
npm run dev
```

Open **http://localhost:3000**

### 6. Load demo data

Click **"Load Demo Data"** on the landing page, or:

```bash
curl -X POST http://localhost:3000/api/seed
```

This creates 3 users (You, Jamie, Priya) and 3 debts covering all status types.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `prisma: command not found` | Run `npx prisma db push` instead |
| Database error on first run | Run `npx prisma db push` to create tables |
| Sounds not playing | Browser autoplay policy — click anywhere first |
| Claude messages not working | Add `ANTHROPIC_API_KEY` to `.env.local` |
| Port 3000 in use | Run `npm run dev -- -p 3001` |

---

## Production / Vercel Deploy

1. Push to GitHub (already done)
2. Import repo at **vercel.com/new**
3. Set environment variables in Vercel dashboard
4. For production database, use [Turso](https://turso.tech) (free SQLite hosting) or [Neon](https://neon.tech) (free Postgres)

---

## Available Scripts

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run start      # Start production server
npx prisma studio  # Visual database browser
npx prisma db push # Sync schema to database
```
