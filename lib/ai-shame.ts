/**
 * AI Shame Escalation Ladder
 * Tier 0 (T+0h):   Mild reminder
 * Tier 1 (T+24h):  Snarky nudge
 * Tier 2 (T+48h):  Passive-aggressive
 * Tier 3 (T+72h+): Scorched earth (Claude-generated)
 */

const SHAME_PROMPTS = [
  // Tier 0 — Mild
  (name: string, amount: number, desc: string) =>
    `Hey ${name}! Just a friendly reminder that you owe $${amount} for "${desc}". No rush... well, actually yes rush. 😅`,

  // Tier 1 — Snarky
  (name: string, amount: number, desc: string) =>
    `${name}, it's been 24 hours. Your $${amount} for "${desc}" is still floating in the void. Your wallet called — it said it's embarrassed for you.`,

  // Tier 2 — Passive-Aggressive
  (name: string, amount: number, desc: string) =>
    `Oh ${name}! No worries about that $${amount} for "${desc}". I'm sure you've just been INCREDIBLY busy. We'll just add it to the list of things you've forgotten, right next to calling your mom back. 🙂`,

  // Tier 3 — Scorched Earth (fallback if no API key)
  (name: string, amount: number, desc: string) =>
    `ATTENTION ${name.toUpperCase()}: Your $${amount} debt for "${desc}" has now achieved LEGENDARY status. We've notified your ancestors. Your credit score is crying. The debt has been immortalized on the blockchain. Pay. Now. ☢️`,
]

export async function generateShameMessage(
  debtorName: string,
  amount: number,
  description: string,
  tier: number
): Promise<string> {
  // Tier 3 — try Claude API for maximum scorched-earth energy
  if (tier >= 3 && process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your-anthropic-api-key') {
    try {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

      const msg = await client.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Write a hilariously over-the-top, passive-aggressive debt collection message for someone named ${debtorName} who owes $${amount} for "${description}" and has ignored 3 reminders. Make it dramatic, funny, and slightly threatening (in a comedic way). Max 2 sentences. No hashtags.`,
        }],
      })

      const text = msg.content[0]
      if (text.type === 'text') return text.text
    } catch {
      // Fall through to default
    }
  }

  const clampedTier = Math.min(tier, SHAME_PROMPTS.length - 1)
  return SHAME_PROMPTS[clampedTier](debtorName, amount, description)
}

export function getTierLabel(tier: number): string {
  return ['😊 Mild', '😏 Snarky', '😤 Passive-Aggressive', '☢️ Scorched Earth'][Math.min(tier, 3)]
}

export function getTierColor(tier: number): string {
  return ['text-green-400', 'text-yellow-400', 'text-orange-400', 'text-red-500'][Math.min(tier, 3)]
}

export function getTierBg(tier: number): string {
  return [
    'bg-green-500/10 border-green-500/30',
    'bg-yellow-500/10 border-yellow-500/30',
    'bg-orange-500/10 border-orange-500/30',
    'bg-red-500/10 border-red-500/30',
  ][Math.min(tier, 3)]
}
