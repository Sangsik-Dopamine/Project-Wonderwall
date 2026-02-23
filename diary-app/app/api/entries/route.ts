import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

// 특정 날짜의 일기 조회 또는 사용자의 모든 엔트리 날짜 목록 조회
export async function GET(request: NextRequest) {
  const googleId = request.cookies.get('user_google_id')?.value
  if (!googleId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const adminClient = createAdminClient()

  // 사용자 조회
  const { data: user } = await adminClient
    .from('users')
    .select('id')
    .eq('google_id', googleId)
    .maybeSingle()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  if (date) {
    // 특정 날짜의 일기 조회
    const { data: entry, error } = await adminClient
      .from('diary_entries')
      .select('id, entry_date, content, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('entry_date', date)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ entry })
  } else {
    // 엔트리가 있는 날짜 목록 조회
    const { data: entries, error } = await adminClient
      .from('diary_entries')
      .select('entry_date, updated_at')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ entries: entries || [] })
  }
}

// 일기 저장 (생성 또는 업데이트)
export async function POST(request: NextRequest) {
  const googleId = request.cookies.get('user_google_id')?.value
  if (!googleId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const adminClient = createAdminClient()

  const { data: user } = await adminClient
    .from('users')
    .select('id')
    .eq('google_id', googleId)
    .maybeSingle()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const body = await request.json()
  const { date, content } = body

  if (!date || typeof content !== 'string') {
    return NextResponse.json({ error: 'date and content are required' }, { status: 400 })
  }

  // upsert: 이미 해당 날짜 엔트리가 있으면 업데이트, 없으면 생성
  const { data: entry, error } = await adminClient
    .from('diary_entries')
    .upsert(
      {
        user_id: user.id,
        entry_date: date,
        content,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,entry_date',
      }
    )
    .select('id, entry_date, content, created_at, updated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ entry })
}
