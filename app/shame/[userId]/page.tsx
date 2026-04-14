import { prisma } from '@/lib/db'
import { formatCurrency } from '@/lib/fees'
import Link from 'next/link'
import { notFound } from 'next/navigation'

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

  const totalOwed = user.owedDebts.reduce((s, d) => s + d.amount + d.lateFee, 0)
  const hasNFT    = user.shameTokens.length > 0

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Shame card */}
        <div className={`rounded-2xl border overflow-hidden
          ${hasNFT ? 'border-purple-500/50 shadow-2xl shadow-purple-500/20' : 'border-red-500/40 shadow-2xl shadow-red-500/20'}`}>

          {/* Header */}
          <div className={`p-6 text-center ${hasNFT ? 'bg-gradient-to-b from-purple-900/40 to-dark-800' : 'bg-gradient-to-b from-red-900/40 to-dark-800'}`}>
            <div className="text-5xl mb-3">{user.avatar ?? '👤'}</div>
            <h1 className="text-2xl font-black text-white">{user.name}</h1>
            <p className={`text-sm mt-1 ${hasNFT ? 'text-purple-300' : 'text-red-300'}`}>
              {hasNFT ? '☢️ Certified Blockchain Deadbeat' : '🔴 Certified Deadbeat'}
            </p>
          </div>

          {/* Amount */}
          <div className="bg-dark-800 px-6 py-4 text-center border-y border-white/10">
            <div className="text-4xl font-black text-red-400">{formatCurrency(totalOwed)}</div>
            <div className="text-sm text-gray-500 mt-1">Total owed across {user.owedDebts.length} debt{user.owedDebts.length !== 1 ? 's' : ''}</div>
          </div>

          {/* Debts list */}
          <div className="bg-dark-800 px-6 py-4 space-y-2">
            {user.owedDebts.map(debt => (
              <div key={debt.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-white">{debt.description || 'Unnamed debt'}</span>
                  <span className="text-gray-500 ml-2">→ {debt.creditor.name}</span>
                </div>
                <span className="text-red-400 font-medium">{formatCurrency(debt.amount)}</span>
              </div>
            ))}
          </div>

          {/* NFT section */}
          {hasNFT && (
            <div className="bg-purple-900/20 border-t border-purple-500/30 px-6 py-4">
              <div className="text-xs font-bold text-purple-300 mb-2">☢️ SOULBOUND NFT OF SHAME</div>
              {user.shameTokens.map(token => (
                <div key={token.id} className="text-xs text-gray-400 font-mono space-y-1">
                  <div>Token: {token.tokenId}</div>
                  <div className="truncate">Tx: {token.txHash}</div>
                  <div className="text-gray-600">Minted: {new Date(token.mintedAt).toLocaleString()}</div>
                </div>
              ))}
              <p className="text-xs text-purple-400 mt-2 italic">
                This shame is permanently recorded on the blockchain. There is no escape.
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="bg-dark-900 px-6 py-4 text-center">
            <p className="text-xs text-gray-600 mb-3">
              Shared via Splitwise Enforcer — Pay up or get shamed.
            </p>
            <Link
              href="/"
              className="inline-block px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-all"
            >
              Enforce your own debts →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
