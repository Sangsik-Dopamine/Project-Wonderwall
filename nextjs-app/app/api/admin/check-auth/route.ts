import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin_session')

    if (adminSession?.value === 'authenticated') {
      return NextResponse.json({ authenticated: true })
    } else {
      return NextResponse.json(
        { error: 'Unauthorized' },
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
