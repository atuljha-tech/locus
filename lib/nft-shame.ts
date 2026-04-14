/**
 * NFT of Shame — Soulbound Non-Transferable Token
 * Mints a permanent on-chain record of debt shame.
 * (Mock implementation for hackathon demo — swap txHash for real chain call)
 */

import { v4 as uuidv4 } from 'uuid'

export interface ShameNFTMetadata {
  name:        string
  description: string
  image:       string
  attributes:  { trait_type: string; value: string | number }[]
  soulbound:   boolean
  mintedAt:    string
}

export function generateShameNFTMetadata(params: {
  debtorName:  string
  amount:      number
  description: string
  daysOverdue: number
  creditorName: string
}): ShameNFTMetadata {
  const { debtorName, amount, description, daysOverdue, creditorName } = params

  return {
    name:        `Certificate of Shame #${Math.floor(Math.random() * 9999)}`,
    description: `${debtorName} owes ${creditorName} $${amount} for "${description}" and has been a deadbeat for ${daysOverdue} days. This token is permanently, irrevocably, forever recorded on the blockchain. There is no escape.`,
    image:       generateShameImageSVG(debtorName, amount),
    attributes: [
      { trait_type: 'Debtor',       value: debtorName },
      { trait_type: 'Amount Owed',  value: amount },
      { trait_type: 'Days Overdue', value: daysOverdue },
      { trait_type: 'Shame Level',  value: daysOverdue > 7 ? 'LEGENDARY' : daysOverdue > 3 ? 'EPIC' : 'RARE' },
      { trait_type: 'Soulbound',    value: 'TRUE — Cannot be transferred, sold, or escaped' },
      { trait_type: 'Creditor',     value: creditorName },
    ],
    soulbound: true,
    mintedAt:  new Date().toISOString(),
  }
}

export async function mintShameNFT(params: {
  debtorId:    string
  debtId:      string
  metadata:    ShameNFTMetadata
}): Promise<{ tokenId: string; txHash: string; success: boolean }> {
  // Simulate blockchain delay
  await new Promise(r => setTimeout(r, 1500))

  const tokenId = `SHAME-${uuidv4().slice(0, 8).toUpperCase()}`
  const txHash  = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`

  return { tokenId, txHash, success: true }
}

function generateShameImageSVG(name: string, amount: number): string {
  // Returns a data URI for the NFT image
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#1a0a2e"/>
        <stop offset="100%" style="stop-color:#2d0a0a"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#bg)"/>
    <rect x="10" y="10" width="380" height="380" fill="none" stroke="#ef4444" stroke-width="3" rx="12"/>
    <text x="200" y="80" text-anchor="middle" font-family="monospace" font-size="60">☢️</text>
    <text x="200" y="140" text-anchor="middle" font-family="monospace" font-size="18" fill="#ef4444" font-weight="bold">CERTIFICATE OF SHAME</text>
    <text x="200" y="180" text-anchor="middle" font-family="monospace" font-size="14" fill="#f97316">This certifies that</text>
    <text x="200" y="215" text-anchor="middle" font-family="monospace" font-size="22" fill="#ffffff" font-weight="bold">${name}</text>
    <text x="200" y="250" text-anchor="middle" font-family="monospace" font-size="14" fill="#f97316">is a certified deadbeat who owes</text>
    <text x="200" y="290" text-anchor="middle" font-family="monospace" font-size="32" fill="#ef4444" font-weight="bold">$${amount}</text>
    <text x="200" y="330" text-anchor="middle" font-family="monospace" font-size="11" fill="#6b7280">SOULBOUND • NON-TRANSFERABLE • PERMANENT</text>
    <text x="200" y="360" text-anchor="middle" font-family="monospace" font-size="10" fill="#374151">There is no escape from the blockchain.</text>
  </svg>`

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}
