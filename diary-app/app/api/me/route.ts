import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET(request: NextRequest) {
  const googleId = request.cookies.get('user_google_id')?.value

  if (!googleId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const adminClient = createAdminClient()

  const { data: user, error } = await adminClient
    .from('users')
    .select('id, email, google_id')
    .eq('google_id', googleId)
    .maybeSingle()

  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ user })
}
