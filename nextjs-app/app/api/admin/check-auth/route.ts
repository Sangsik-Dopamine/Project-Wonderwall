import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/utils/admin-auth'

export async function GET() {
  try {
    const { isAdmin, email } = await checkAdminAuth()

    if (isAdmin) {
      return NextResponse.json({ authenticated: true, isAdmin: true, email })
    } else {
      return NextResponse.json(
        { error: 'Unauthorized', isAdmin: false },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Admin auth check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
