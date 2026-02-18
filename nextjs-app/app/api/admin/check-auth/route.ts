import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// 허용된 어드민 이메일 목록
const ADMIN_EMAILS = ['park.sangsik@gmail.com']

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    // 로그인 안 된 경우
    if (error || !user) {
      return NextResponse.json(
        { authenticated: false, isAdmin: false, email: null },
        { status: 401 }
      )
    }

    const email = user.email || null
    const isAdmin = email ? ADMIN_EMAILS.includes(email) : false

    // 로그인은 됐지만 어드민이 아닌 경우 - 200 반환 (로그인 상태이므로)
    return NextResponse.json({
      authenticated: true,
      isAdmin,
      email
    })
  } catch (error) {
    console.error('Admin auth check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
