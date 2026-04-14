import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const users = await prisma.user.findMany({ orderBy: { name: 'asc' } })

    if (users.length === 0) {
      return NextResponse.json([], {
        headers: { 'X-Hint': 'No users found. POST /api/seed to load demo data.' },
      })
    }

    return NextResponse.json(users)
  } catch (e) {
    console.error('[GET /api/users]', e)
    return NextResponse.json(
      { error: 'Failed to load users. Is the database set up? Run: npx prisma db push' },
      { status: 500 }
    )
  }
}
