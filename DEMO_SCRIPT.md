# 🎬 SplitEase — Video Demo Script

Total runtime: ~3–4 minutes. Follow this order exactly.

---

## Before you start recording

1. Run `npm run dev` — confirm http://localhost:3000 loads
2. Open browser in full screen, zoom to 90%
3. Have the app open at the **landing page**
4. Make sure demo data is NOT loaded yet (fresh state looks better)

---

## Scene 1 — Landing Page (30 sec)

**What to show:**
- The hero headline "Split smarter. Collect faster."
- Point out the animated counters loading in
- Show the escalation ladder cycling through tiers (it auto-plays)
- Point out the 3 feature cards: AI Shame, Optimizer, NFT

**What to say:**
> "SplitEase is a debt-splitting app with three features you haven't seen before. Let me show you."

**Action:** Click **"Load Demo Data"** → wait for ✅ confirmation toast

---

## Scene 2 — Dashboard Overview (45 sec)

**Action:** Click **"Open App →"**

**What to show:**
- The sidebar with nav items
- The greeting header and today's date
- The 4 stat cards: Total Owed, Overdue count, Late Fees, NFTs Minted
- The live scrolling ticker at the bottom

**What to say:**
> "The dashboard shows everything at a glance — who owes what, how much in late fees, and a live activity feed."

---

## Scene 3 — Debts Tab + AI Shame (60 sec) ← THE MAIN DEMO

**Action:** Click **"Debts"** in sidebar

**What to show:**
1. The debt list — 3 debts with colored left borders
2. Click on **Jamie's overdue debt** (red border) to expand it
3. Show the shame meter — it's at "Roast" level
4. Click **"🔥 Send Shame"** → hear the sound → toast appears with the message
5. Collapse and re-expand to show the shame message now saved

**What to say:**
> "Jamie owes $64 for dinner and it's 3 days overdue. Watch what happens when I send a shame message."
> *(after clicking)* "That's Tier 3 — scorched earth. The AI escalates automatically over 72 hours."

---

## Scene 4 — Optimizer Tab (30 sec) ← THE CS DEPTH MOMENT

**Action:** Click **"Optimizer"** in sidebar

**What to show:**
- The algorithm explainer card
- The net balances section (who owes, who is owed)
- The optimal transfers list — show how 3 debts → 2 transfers

**What to say:**
> "Instead of everyone paying everyone else, the optimizer computes net balances and finds the minimum number of transfers. O(n log n), provably minimal. 3 debts become 2 payments."

---

## Scene 5 — Add Debt (20 sec)

**Action:** Click **"Add Debt"** in sidebar

**What to show:**
- Fill in: Debtor = Jamie, Creditor = You, Amount = 25, Description = "Taxi home"
- Click **"Add Debt"** → hear success sound → redirects to Debts tab

**What to say:**
> "Adding a new debt takes 5 seconds."

---

## Scene 6 — Mint NFT of Shame (30 sec) ← THE DEMO MOMENT

**Action:** Go back to **Debts** tab → expand Jamie's debt → click **"🎨 Mint NFT"**

**What to show:**
- The loading state
- The NFT card appearing with token ID and tx hash
- The purple "Soulbound NFT Minted" badge

**What to say:**
> "After 3 days overdue, we can mint a soulbound, non-transferable NFT of Shame. Permanently on the blockchain. There is no escape."
> *(pause for effect)*

---

## Scene 7 — Wall of Shame (20 sec)

**Action:** Click **"Wall of Shame 🔥"** in sidebar → navigates to /shame

**What to show:**
- The public wall with Jamie's debt listed
- The NFT badge on the card
- Click **"Share shame →"** to show the shareable URL `/shame/[userId]`

**What to say:**
> "The Wall of Shame is public. Anyone with the link can see it. The shareable card can be sent directly to the person who owes you."

---

## Scene 8 — Hall of Fame (10 sec)

**Action:** Click **"Hall of Fame"** in sidebar

**What to show:**
- Priya's paid debt with the gold medal
- The trophy banner

**What to say:**
> "And for the people who actually pay — the Hall of Fame."

---

## Closing (10 sec)

**Action:** Navigate back to landing page

**What to say:**
> "SplitEase — split smarter, collect faster. Three features, one app, zero excuses."

---

## Tips for recording

- Use **QuickTime** (Mac) or **OBS** for screen recording
- Record at 1920×1080, 60fps if possible
- Keep cursor movements slow and deliberate
- Pause 1 second after each click before moving on
- If a sound plays — let it finish before talking
- The whole demo should be 3–4 minutes max
