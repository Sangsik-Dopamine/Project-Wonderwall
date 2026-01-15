import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // 쿠키에서 사용자 google_id 가져오기
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const googleId = cookieStore.get('user_google_id')?.value

    console.log('Update Handle - Cookies Debug:', {
      allCookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value })),
      googleId,
    })

    if (!googleId) {
      console.log('No google_id cookie found')
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // 요청 body에서 handle 가져오기
    const { handle } = await request.json()

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

    const adminClient = createAdminClient()

    // 현재 사용자 조회 (RLS 우회)
    const { data: currentUser, error: userError } = await adminClient
      .from('users')
      .select('id, handle')
      .eq('google_id', googleId)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Handle이 동일하면 업데이트 불필요
    if (currentUser.handle === handle) {
      return NextResponse.json({
        success: true,
        handle,
      })
    }

    // Handle 중복 확인
    const { data: existingHandle } = await adminClient
      .from('users')
      .select('id')
      .eq('handle', handle)
      .single()

    if (existingHandle) {
      return NextResponse.json(
        { error: 'Handle already taken' },
        { status: 409 }
      )
    }

    // Handle 업데이트
    const { error: updateError } = await adminClient
      .from('users')
      .update({ handle })
      .eq('id', currentUser.id)

    if (updateError) {
      console.error('Error updating handle:', updateError)
      return NextResponse.json(
        { error: 'Failed to update handle' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      handle,
    })
  } catch (err) {
    console.error('Error in update-handle:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
