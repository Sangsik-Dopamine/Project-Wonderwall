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

    // URL에서 userId 파라미터 추출
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // 사용자의 raw_data 조회
    const { data: user, error } = await supabase
      .from('users')
      .select('email, raw_data')
      .eq('id', userId)
      .single()

    if (error || !user) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.raw_data || Object.keys(user.raw_data).length === 0) {
      return NextResponse.json(
        { error: 'No channel data available for this user' },
        { status: 404 }
      )
    }

    // JSON 파일로 반환
    const jsonContent = JSON.stringify(user.raw_data, null, 2)
    const filename = `user_${userId}_channels.json`

    return new NextResponse(jsonContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Error downloading JSON:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to download JSON' },
      { status: 500 }
    )
  }
}
