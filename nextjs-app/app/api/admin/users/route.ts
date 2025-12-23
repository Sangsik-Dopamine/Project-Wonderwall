import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// Supabase 클라이언트 초기화 (service role key 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 인증 체크 헬퍼 함수
async function checkAuth() {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin_session')
  return adminSession?.value === 'authenticated'
}

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    if (!(await checkAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 사용자 리스트 조회 (email, created_at, raw_data 존재 여부)
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, created_at, raw_data')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // JSON 파일 생성 여부 확인 (raw_data가 비어있지 않은지 체크)
    const usersWithStatus = users.map((user: any) => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      has_json: user.raw_data && Object.keys(user.raw_data).length > 0,
    }))

    return NextResponse.json({ users: usersWithStatus })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
