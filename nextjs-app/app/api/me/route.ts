import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const googleId = cookieStore.get('user_google_id')?.value

    if (!googleId) {
      return NextResponse.json({ authenticated: false }, { status: 200 })
    }

    const adminClient = createAdminClient()
    const { data: user } = await adminClient
      .from('users')
      .select('handle')
      .eq('google_id', googleId)
      .single()

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 200 })
    }

    return NextResponse.json({
      authenticated: true,
      handle: user.handle,
    })
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 200 })
  }
}
