import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens, getGoogleUserInfo } from '@/lib/google-oauth'
import { createClient } from '@/utils/supabase/server'
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

    // 3. Supabase에서 사용자 처리
    const supabase = await createClient()

    // 3-1. 기존 사용자 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, handle')
      .eq('google_id', userInfo.googleId)
      .single()

    if (existingUser) {
      // 기존 사용자: 토큰만 업데이트 (관리자 클라이언트 사용)
      const adminClient = createAdminClient()
      const encryptionKey = process.env.SUPABASE_ENCRYPTION_KEY!
      await adminClient.rpc('save_encrypted_tokens', {
        p_user_id: existingUser.id,
        p_access_token: tokens.accessToken,
        p_refresh_token: tokens.refreshToken,
        p_encryption_key: encryptionKey,
      })

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
      // 새 사용자: handle 생성 필요
      // handle은 이메일의 @ 앞부분을 기본값으로 사용
      const defaultHandle = userInfo.email.split('@')[0]

      // handle 중복 확인 및 유니크하게 생성
      let handle = defaultHandle
      let suffix = 1
      while (true) {
        const { data: existingHandle } = await supabase
          .from('users')
          .select('id')
          .eq('handle', handle)
          .single()

        if (!existingHandle) break
        handle = `${defaultHandle}${suffix}`
        suffix++
      }

      // 새 사용자 생성 (관리자 클라이언트 사용)
      const adminClient = createAdminClient()
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

      // 토큰 저장 (관리자 클라이언트 사용)
      const encryptionKey = process.env.SUPABASE_ENCRYPTION_KEY!
      await adminClient.rpc('save_encrypted_tokens', {
        p_user_id: userId,
        p_access_token: tokens.accessToken,
        p_refresh_token: tokens.refreshToken,
        p_encryption_key: encryptionKey,
      })

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
