import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens, getGoogleUserInfo } from '@/lib/google-oauth'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${error}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=no_code', request.url)
    )
  }

  try {
    const tokens = await exchangeCodeForTokens(code)

    if (!tokens.refreshToken) {
      console.error('No refresh token received')
      return NextResponse.redirect(
        new URL('/login?error=no_refresh_token', request.url)
      )
    }

    const userInfo = await getGoogleUserInfo(tokens.accessToken)
    const adminClient = createAdminClient()

    // 기존 사용자 확인
    const { data: existingUser } = await adminClient
      .from('users')
      .select('id, google_id')
      .eq('google_id', userInfo.googleId)
      .maybeSingle()

    if (existingUser) {
      // 기존 사용자: 토큰 업데이트
      const { data: encryptedAccess } = await adminClient.rpc('encrypt_token', {
        token: tokens.accessToken,
      })
      const { data: encryptedRefresh } = await adminClient.rpc('encrypt_token', {
        token: tokens.refreshToken,
      })

      await adminClient
        .from('users')
        .update({
          access_token_encrypted: encryptedAccess,
          refresh_token_encrypted: encryptedRefresh,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id)
    } else {
      // 새 사용자 생성
      const userId = crypto.randomUUID()
      const handle = userInfo.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user'

      const { error: insertError } = await adminClient.from('users').insert({
        id: userId,
        email: userInfo.email,
        google_id: userInfo.googleId,
        handle,
      })

      if (insertError) {
        console.error('Failed to create user:', insertError)
        return NextResponse.redirect(
          new URL('/login?error=create_user_failed', request.url)
        )
      }

      const { data: encryptedAccess } = await adminClient.rpc('encrypt_token', {
        token: tokens.accessToken,
      })
      const { data: encryptedRefresh } = await adminClient.rpc('encrypt_token', {
        token: tokens.refreshToken,
      })

      await adminClient
        .from('users')
        .update({
          access_token_encrypted: encryptedAccess,
          refresh_token_encrypted: encryptedRefresh,
        })
        .eq('id', userId)
    }

    // 세션 쿠키 설정 후 메인 페이지로 리다이렉트
    const response = NextResponse.redirect(new URL('/', request.url))
    response.cookies.set('user_google_id', userInfo.googleId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(
      new URL('/login?error=oauth_failed', request.url)
    )
  }
}
