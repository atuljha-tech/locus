import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { DEMO_USERS } from '@/lib/demo-data'

export async function GET() {
  try {
    const users = await prisma.user.findMany({ orderBy: { name: 'asc' } })
    // If DB empty or unavailable, return hardcoded demo users
    if (users.length === 0) return NextResponse.json(DEMO_USERS)
    return NextResponse.json(users)
  } catch {
    return NextResponse.json(DEMO_USERS)
  }
}
