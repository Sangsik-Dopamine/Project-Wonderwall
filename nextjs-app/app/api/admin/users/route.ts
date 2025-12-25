import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkAdminAuth } from '@/utils/admin-auth'

// Supabase 클라이언트 초기화 (service role key 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface UserRow {
  id: string
  email: string
  created_at: string
  raw_data: Record<string, unknown> | null
}

export async function GET() {
  try {
    // 이메일 기반 인증 확인
    const { isAdmin } = await checkAdminAuth()
    if (!isAdmin) {
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
    const usersWithStatus = (users as UserRow[]).map((user) => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      has_json: user.raw_data && Object.keys(user.raw_data).length > 0,
    }))

    return NextResponse.json({ users: usersWithStatus })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
