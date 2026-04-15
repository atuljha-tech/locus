/**
 * OpenClaw AI — Shame Escalation Engine
 * Powered by OpenClaw (claw_dev_*) API — Locus Paygentic Hackathon
 *
 * Tier 0 (T+0h):   Mild reminder
 * Tier 1 (T+24h):  Snarky nudge
 * Tier 2 (T+48h):  Passive-aggressive
 * Tier 3 (T+72h+): Scorched earth (OpenClaw AI-generated)
 */

const SHAME_PROMPTS = [
  // Tier 0 — Mild
  (name: string, amount: number, desc: string) =>
    `Hey ${name}! Just a friendly reminder that you owe $${amount.toFixed(2)} for "${desc}". No rush... well, actually yes rush. 😅`,

  // Tier 1 — Snarky
  (name: string, amount: number, desc: string) =>
    `${name}, it's been 24 hours. Your $${amount.toFixed(2)} for "${desc}" is still floating in the void. Your wallet called — it said it's embarrassed for you.`,

  // Tier 2 — Passive-Aggressive
  (name: string, amount: number, desc: string) =>
    `Oh ${name}! No worries about that $${amount.toFixed(2)} for "${desc}". I'm sure you've just been INCREDIBLY busy. We'll just add it to the list of things you've forgotten, right next to calling your mom back. 🙂`,

  // Tier 3 — Scorched Earth (fallback if no API key)
  (name: string, amount: number, desc: string) =>
    `ATTENTION ${name.toUpperCase()}: Your $${amount.toFixed(2)} debt for "${desc}" has now achieved LEGENDARY status. We've notified your ancestors. Your credit score is crying. The debt has been immortalized on the blockchain. Pay. Now. ☢️`,
]

/**
 * OpenClaw AI client — uses Anthropic-compatible SDK
 * API key format: claw_dev_*
 */
async function callOpenClaw(prompt: string, maxTokens = 200): Promise<string | null> {
  const apiKey = process.env.OPENCLAW_API_KEY
  if (!apiKey || !apiKey.startsWith('claw_')) return null

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({
      apiKey,
      baseURL: 'https://api.anthropic.com', // OpenClaw is Anthropic-compatible
    })

    const msg = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = msg.content[0]
    if (text.type === 'text') return text.text
  } catch (err) {
    console.warn('[OpenClaw] API call failed, using fallback:', err)
  }
  return null
}

export async function generateShameMessage(
  debtorName: string,
  amount: number,
  description: string,
  tier: number
): Promise<string> {
  // Tier 3 — try OpenClaw AI for maximum scorched-earth energy
  if (tier >= 3) {
    const aiMsg = await callOpenClaw(
      `Write a hilariously over-the-top, passive-aggressive debt collection message for someone named ${debtorName} who owes $${amount.toFixed(2)} for "${description}" and has ignored 3 reminders. Make it dramatic, funny, and slightly threatening (in a comedic way). Max 2 sentences. No hashtags.`
    )
    if (aiMsg) return aiMsg
  }

  // Tier 2 — try AI for passive-aggressive tone
  if (tier === 2) {
    const aiMsg = await callOpenClaw(
      `Write a passive-aggressive, sarcastic debt reminder for ${debtorName} who owes $${amount.toFixed(2)} for "${description}". Be politely savage. Max 1 sentence.`,
      100
    )
    if (aiMsg) return aiMsg
  }

  return SHAME_PROMPTS[Math.min(tier, 3)](debtorName, amount, description)
}

export interface DebtRiskAnalysis {
  riskScore: number        // 0-100
  riskLabel: string        // LOW / MEDIUM / HIGH / CRITICAL
  riskColor: string
  prediction: string       // AI-generated prediction
  recommendation: string   // What to do
  paymentProbability: number // 0-100%
  estimatedPayDate: string
}

/**
 * AI-powered debt risk analysis using OpenClaw
 */
export async function analyzeDebtRisk(params: {
  debtorName: string
  amount: number
  daysOverdue: number
  description: string
  shameCount: number
  hasNFT: boolean
}): Promise<DebtRiskAnalysis> {
  const { debtorName, amount, daysOverdue, description, shameCount, hasNFT } = params

  // Calculate base risk score
  let riskScore = 0
  riskScore += Math.min(daysOverdue * 8, 40)   // overdue days (max 40)
  riskScore += Math.min(amount / 10, 20)         // amount (max 20)
  riskScore += Math.min(shameCount * 5, 20)      // shame messages (max 20)
  riskScore += hasNFT ? 15 : 0                   // NFT minted = very bad
  riskScore = Math.min(Math.round(riskScore), 100)

  const riskLabel = riskScore >= 80 ? 'CRITICAL' : riskScore >= 60 ? 'HIGH' : riskScore >= 35 ? 'MEDIUM' : 'LOW'
  const riskColor = riskScore >= 80 ? '#ef4444' : riskScore >= 60 ? '#f97316' : riskScore >= 35 ? '#eab308' : '#22c55e'
  const paymentProbability = Math.max(5, 100 - riskScore)

  // Try AI prediction
  let prediction = ''
  let recommendation = ''

  const aiResponse = await callOpenClaw(
    `Analyze this debt situation and give a 1-sentence prediction and 1-sentence recommendation:
    - Debtor: ${debtorName}
    - Amount: $${amount.toFixed(2)} for "${description}"
    - Days overdue: ${daysOverdue}
    - Shame messages sent: ${shameCount}
    - NFT minted: ${hasNFT}
    
    Format your response as JSON: {"prediction": "...", "recommendation": "..."}
    Keep each under 15 words. Be direct and slightly humorous.`,
    150
  )

  if (aiResponse) {
    try {
      const parsed = JSON.parse(aiResponse.replace(/```json\n?|\n?```/g, '').trim())
      prediction = parsed.prediction || ''
      recommendation = parsed.recommendation || ''
    } catch {
      // fallback
    }
  }

  if (!prediction) {
    prediction = daysOverdue > 7
      ? `${debtorName} is showing classic debt-avoidance behavior patterns.`
      : daysOverdue > 3
      ? `${debtorName} may need stronger incentives to pay.`
      : `${debtorName} is likely to pay within the next few days.`
  }

  if (!recommendation) {
    recommendation = riskScore >= 80
      ? 'Escalate immediately — mint NFT and share shame link publicly.'
      : riskScore >= 60
      ? 'Send scorched-earth message and consider involving mutual friends.'
      : riskScore >= 35
      ? 'Send a snarky reminder and set a firm deadline.'
      : 'A gentle nudge should be sufficient.'
  }

  const daysToPayment = Math.round((riskScore / 10) + 1)
  const estimatedDate = new Date(Date.now() + daysToPayment * 86400000)
  const estimatedPayDate = estimatedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return { riskScore, riskLabel, riskColor, prediction, recommendation, paymentProbability, estimatedPayDate }
}

export interface GroupInsight {
  summary: string
  topDebtor: string
  totalAtRisk: number
  aiInsight: string
  actionItems: string[]
}

/**
 * AI-powered group financial insights
 */
export async function generateGroupInsights(params: {
  totalOwed: number
  overdueCount: number
  totalDebts: number
  users: { name: string; owedAmount: number }[]
}): Promise<GroupInsight> {
  const { totalOwed, overdueCount, totalDebts, users } = params

  const topDebtor = users.sort((a, b) => b.owedAmount - a.owedAmount)[0]

  const aiResponse = await callOpenClaw(
    `You are a financial analyst for a friend group. Analyze this data and give insights:
    - Total owed: $${totalOwed.toFixed(2)}
    - Overdue debts: ${overdueCount}/${totalDebts}
    - Top debtor: ${topDebtor?.name} owes $${topDebtor?.owedAmount.toFixed(2)}
    
    Respond as JSON: {
      "summary": "one sentence group financial health summary",
      "aiInsight": "one clever insight about the group dynamics",
      "actionItems": ["action 1", "action 2", "action 3"]
    }
    Be witty but informative. Max 15 words per item.`,
    250
  )

  let summary = `Group has $${totalOwed.toFixed(2)} in outstanding debts with ${overdueCount} overdue.`
  let aiInsight = `${overdueCount > totalDebts / 2 ? 'More than half your debts are overdue — time for intervention.' : 'Your group is mostly on track with payments.'}`
  let actionItems = [
    `Send reminders to ${overdueCount} overdue debtors`,
    'Use the optimizer to reduce payment complexity',
    'Consider setting shorter due dates',
  ]

  if (aiResponse) {
    try {
      const parsed = JSON.parse(aiResponse.replace(/```json\n?|\n?```/g, '').trim())
      if (parsed.summary) summary = parsed.summary
      if (parsed.aiInsight) aiInsight = parsed.aiInsight
      if (parsed.actionItems?.length) actionItems = parsed.actionItems
    } catch { /* use fallbacks */ }
  }

  return {
    summary,
    topDebtor: topDebtor?.name ?? 'N/A',
    totalAtRisk: totalOwed,
    aiInsight,
    actionItems,
  }
}
