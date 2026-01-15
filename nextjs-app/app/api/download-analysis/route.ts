import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    // 1. 쿠키에서 사용자 인증 확인
    const cookieStore = await cookies()
    const googleId = cookieStore.get('user_google_id')?.value

    if (!googleId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // 2. 쿼리 파라미터에서 filename 가져오기
    const searchParams = request.nextUrl.searchParams
    const filename = searchParams.get('filename')

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      )
    }

    // 3. 사용자 정보 조회 (RLS 우회)
    const adminClient = createAdminClient()
    const { data: user, error: userError } = await adminClient
      .from('users')
      .select('id')
      .eq('google_id', googleId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 4. 저장된 분석 데이터 조회 (본인 데이터만)
    const { data: analysis, error: analysisError } = await adminClient
      .from('subscription_analyses')
      .select('data, filename')
      .eq('user_id', user.id)
      .eq('filename', filename)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      )
    }

    // 5. JSON 파일로 다운로드
    const jsonContent = JSON.stringify(analysis.data, null, 2)

    return new NextResponse(jsonContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${analysis.filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Error in download-analysis:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
