import { prisma } from '@/lib/db'
import { formatCurrency } from '@/lib/fees'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { userId: string } }): Promise<Metadata> {
  const user = await prisma.user.findUnique({ where: { id: params.userId } }).catch(() => null)
  if (!user) return {}
  return {
    title: `${user.name} owes money — Wall of Shame | Splitwise Enforcer`,
    description: `${user.name} has been publicly shamed for unpaid debts. Pay up or stay on the Wall of Shame forever.`,
    openGraph: {
      title: `☢️ ${user.name} is a certified deadbeat`,
      description: 'Permanently recorded on the Wall of Shame.',
    },
  }
}

export default async function UserShamePage({ params }: { params: { userId: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    include: {
      owedDebts: {
        where:   { status: { not: 'PAID' } },
        include: { creditor: { select: { name: true } } },
        orderBy: { amount: 'desc' },
      },
      shameTokens: { include: { debt: true } },
    },
  }).catch(() => null)

  if (!user) notFound()

  const totalOwed = user.owedDebts.reduce((s: number, d: { amount: number; lateFee: number }) => s + d.amount + d.lateFee, 0)
  const hasNFT    = user.shameTokens.length > 0
  const initials  = user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  const accentColor = hasNFT ? '#a855f7' : '#ef4444'
  const glowColor   = hasNFT ? 'rgba(168,85,247,0.3)' : 'rgba(239,68,68,0.3)'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0a0a0f 0%, #0f0a1a 60%, #100808 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 16px', position: 'relative', overflowX: 'hidden',
    }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 500, height: 500, borderRadius: '50%',
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 440 }}>

        {/* Badge */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 99,
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            fontSize: 11, fontWeight: 800, color: '#f87171', letterSpacing: '0.1em',
          }}>
            🏛️ WALL OF SHAME — PUBLIC LEDGER
          </span>
        </div>

        {/* Main card */}
        <div style={{
          borderRadius: 28,
          background: hasNFT
            ? 'linear-gradient(145deg, rgba(88,28,135,0.25) 0%, rgba(15,10,30,0.95) 100%)'
            : 'linear-gradient(145deg, rgba(127,29,29,0.2) 0%, rgba(15,10,10,0.95) 100%)',
          border: `2px solid ${hasNFT ? 'rgba(168,85,247,0.4)' : 'rgba(239,68,68,0.3)'}`,
          backdropFilter: 'blur(20px)',
          overflow: 'hidden',
          boxShadow: `0 24px 80px ${glowColor}, 0 4px 20px rgba(0,0,0,0.5)`,
        }}>

          {/* Top stripe */}
          <div style={{
            height: 4,
            background: hasNFT
              ? 'linear-gradient(90deg, #7c3aed, #a855f7, #c084fc)'
              : 'linear-gradient(90deg, #991b1b, #ef4444, #f97316)',
          }} />

          {/* Header */}
          <div style={{
            padding: '32px 32px 24px', textAlign: 'center',
            background: hasNFT
              ? 'linear-gradient(180deg, rgba(124,58,237,0.15) 0%, transparent 100%)'
              : 'linear-gradient(180deg, rgba(239,68,68,0.1) 0%, transparent 100%)',
          }}>
            {/* Avatar */}
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px',
              background: hasNFT
                ? 'linear-gradient(135deg, #6d28d9, #4c1d95)'
                : 'linear-gradient(135deg, rgba(239,68,68,0.4), rgba(239,68,68,0.15))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: user.avatar ? 40 : 24, fontWeight: 900,
              color: hasNFT ? '#e9d5ff' : '#fca5a5',
              border: `3px solid ${hasNFT ? 'rgba(168,85,247,0.5)' : 'rgba(239,68,68,0.4)'}`,
              boxShadow: `0 0 30px ${glowColor}`,
            }}>
              {user.avatar ?? initials}
            </div>

            <h1 style={{
              fontSize: 28, fontWeight: 900, color: '#fff',
              letterSpacing: '-0.03em', marginBottom: 8,
            }}>
              {user.name}
            </h1>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 14px', borderRadius: 99,
              background: hasNFT ? 'rgba(168,85,247,0.15)' : 'rgba(239,68,68,0.12)',
              border: `1px solid ${hasNFT ? 'rgba(168,85,247,0.3)' : 'rgba(239,68,68,0.25)'}`,
              fontSize: 12, fontWeight: 700,
              color: hasNFT ? '#c084fc' : '#f87171',
            }}>
              {hasNFT ? '☢️ Certified Blockchain Deadbeat' : '🔴 Certified Deadbeat'}
            </div>
          </div>

          {/* Total amount */}
          <div style={{
            padding: '20px 32px',
            textAlign: 'center',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(0,0,0,0.2)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', marginBottom: 8 }}>
              TOTAL OWED
            </div>
            <div style={{
              fontSize: 52, fontWeight: 900, letterSpacing: '-0.05em',
              color: accentColor, lineHeight: 1,
              textShadow: `0 0 40px ${glowColor}`,
            }}>
              {formatCurrency(totalOwed)}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
              across {user.owedDebts.length} debt{user.owedDebts.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Debts list */}
          {user.owedDebts.length > 0 && (
            <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {user.owedDebts.map((debt: { id: string; description: string; amount: number; lateFee: number; creditor: { name: string } }) => (
                <div key={debt.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                      {debt.description || 'Unnamed debt'}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                      → {debt.creditor.name}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#f87171' }}>
                      {formatCurrency(debt.amount)}
                    </div>
                    {debt.lateFee > 0 && (
                      <div style={{ fontSize: 10, color: '#f97316', fontWeight: 600 }}>
                        +{formatCurrency(debt.lateFee)} fee
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* NFT section */}
          {hasNFT && (
            <div style={{
              margin: '0 28px 20px',
              padding: '16px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(88,28,135,0.1))',
              border: '1.5px solid rgba(168,85,247,0.3)',
            }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: '#c084fc', marginBottom: 8 }}>
                ☢️ SOULBOUND NFT OF SHAME
              </div>
              {user.shameTokens.map((token: { id: string; tokenId: string; txHash: string; mintedAt: Date }) => (
                <div key={token.id} style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', lineHeight: 1.8 }}>
                  <div>Token: #{token.tokenId}</div>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Tx: {token.txHash.slice(0, 32)}…
                  </div>
                  <div>Minted: {new Date(token.mintedAt).toLocaleDateString()}</div>
                </div>
              ))}
              <p style={{ fontSize: 11, color: '#9f7aea', marginTop: 8, fontStyle: 'italic' }}>
                This shame is permanently recorded on the blockchain. There is no escape.
              </p>
            </div>
          )}

          {/* Footer */}
          <div style={{
            padding: '20px 28px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            textAlign: 'center',
            background: 'rgba(0,0,0,0.2)',
          }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 16, lineHeight: 1.5 }}>
              Shared via <strong style={{ color: 'rgba(255,255,255,0.5)' }}>Splitwise Enforcer</strong><br />
              Pay with USDC via Locus — or stay shamed forever.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/shame" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '10px 20px', borderRadius: 99, textDecoration: 'none',
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                color: '#f87171', fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
              }}>
                🏛️ Wall of Shame
              </Link>
              <Link href="/" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '10px 20px', borderRadius: 99, textDecoration: 'none',
                background: 'linear-gradient(135deg, #5934FF, #4101F6)',
                color: '#fff', fontSize: 13, fontWeight: 700,
                boxShadow: '0 4px 16px rgba(65,1,246,0.4)', transition: 'all 0.2s',
              }}>
                💸 Enforce Your Debts
              </Link>
            </div>
          </div>
        </div>

        {/* Powered by footer */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
            Powered by PayWithLocus · Splitwise Enforcer · Locus Paygentic Hackathon #1
          </span>
        </div>
      </div>
    </div>
  )
}
