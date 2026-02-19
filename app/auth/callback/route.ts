import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens, getGoogleUserInfo } from '@/lib/google-oauth'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  // OAuth 에러 처리
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${error}`, request.url)
    )
  }

  // Authorization Code가 없으면 에러
  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=no_code', request.url)
    )
  }

  try {
    // 1. Authorization Code를 Access Token으로 교환
    const tokens = await exchangeCodeForTokens(code)

    // refresh_token이 없으면 에러 (첫 로그인 시 필수)
    if (!tokens.refreshToken) {
      console.error('No refresh token received')
      return NextResponse.redirect(
        new URL('/login?error=no_refresh_token', request.url)
      )
    }

    // 2. Access Token으로 사용자 정보 조회
    const userInfo = await getGoogleUserInfo(tokens.accessToken)

    // 3. Admin Client 사용 (RLS 우회)
    const adminClient = createAdminClient()

    // 4. 기존 사용자 확인
    const { data: existingUser } = await adminClient
      .from('users')
      .select('id, handle')
      .eq('google_id', userInfo.googleId)
      .maybeSingle()

    if (existingUser) {
      // 기존 사용자: 토큰 암호화 후 업데이트
      const { data: encryptedAccess } = await adminClient.rpc('encrypt_token', {
        token: tokens.accessToken
      })
      const { data: encryptedRefresh } = await adminClient.rpc('encrypt_token', {
        token: tokens.refreshToken
      })

      await adminClient
        .from('users')
        .update({
          access_token_encrypted: encryptedAccess,
          refresh_token_encrypted: encryptedRefresh,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingUser.id)

      // 세션 쿠키 설정
      const response = NextResponse.redirect(
        new URL(`/${existingUser.handle}`, request.url)
      )
      response.cookies.set('user_google_id', userInfo.googleId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7일
        path: '/',
      })

      return response
    } else {
      // 새 사용자: handle 생성
      const defaultHandle = userInfo.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '')

      // handle 중복 확인
      let handle = defaultHandle || 'user'
      let suffix = 1
      while (true) {
        const { data: existingHandle } = await adminClient
          .from('users')
          .select('id')
          .eq('handle', handle)
          .maybeSingle()

        if (!existingHandle) break
        handle = `${defaultHandle}${suffix}`
        suffix++
        if (suffix > 100) break
      }

      // 새 사용자 생성
      const userId = crypto.randomUUID()

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

      // 토큰 암호화 후 저장
      const { data: encryptedAccess } = await adminClient.rpc('encrypt_token', {
        token: tokens.accessToken
      })
      const { data: encryptedRefresh } = await adminClient.rpc('encrypt_token', {
        token: tokens.refreshToken
      })

      await adminClient
        .from('users')
        .update({
          access_token_encrypted: encryptedAccess,
          refresh_token_encrypted: encryptedRefresh,
        })
        .eq('id', userId)

      // 세션 쿠키 설정
      const response = NextResponse.redirect(
        new URL(`/onboarding?handle=${handle}`, request.url)
      )
      response.cookies.set('user_google_id', userInfo.googleId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7일
        path: '/',
      })

      return response
    }
  } catch (err) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(
      new URL('/login?error=oauth_failed', request.url)
    )
  }
}
