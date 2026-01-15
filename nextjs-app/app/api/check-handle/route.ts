import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const handle = searchParams.get('handle')

  if (!handle) {
    return NextResponse.json(
      { error: 'Handle is required' },
      { status: 400 }
    )
  }

  // Handle 형식 검증
  if (handle.length < 3 || handle.length > 20) {
    return NextResponse.json(
      { error: 'Handle must be between 3 and 20 characters' },
      { status: 400 }
    )
  }

  if (!/^[a-z0-9_]+$/.test(handle)) {
    return NextResponse.json(
      { error: 'Handle can only contain lowercase letters, numbers, and underscores' },
      { status: 400 }
    )
  }

  try {
    const adminClient = createAdminClient()

    // Handle 중복 확인 (RLS 우회)
    const { data, error } = await adminClient
      .from('users')
      .select('id')
      .eq('handle', handle)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found (사용 가능)
      console.error('Error checking handle:', error)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      available: !data,
    })
  } catch (err) {
    console.error('Error in check-handle:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
