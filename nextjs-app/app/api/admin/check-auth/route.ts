import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const adminToken = cookieStore.get('admin_token')

    if (adminToken && adminToken.value) {
      // 토큰이 존재하면 인증됨
      return NextResponse.json({
        authenticated: true,
        isAdmin: true
      })
    } else {
      return NextResponse.json({
        authenticated: false,
        isAdmin: false
      })
    }
  } catch (error) {
    console.error('Admin auth check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
