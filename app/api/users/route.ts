import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const users = await prisma.user.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(users)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
