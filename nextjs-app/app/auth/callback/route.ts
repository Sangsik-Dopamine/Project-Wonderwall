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
    console.log('Token exchange successful:', { hasRefreshToken: !!tokens.refreshToken })

    // refresh_token이 없으면 에러 (첫 로그인 시 필수)
    if (!tokens.refreshToken) {
      console.error('No refresh token received')
      return NextResponse.redirect(
        new URL('/login?error=no_refresh_token', request.url)
      )
    }

    // 2. Access Token으로 사용자 정보 조회
    const userInfo = await getGoogleUserInfo(tokens.accessToken)
    console.log('User info retrieved:', { email: userInfo.email, googleId: userInfo.googleId })

    // 3. Supabase Admin Client 생성
    const adminClient = createAdminClient()

    // 4. 기존 사용자 조회 (maybeSingle로 에러 없이 null 반환)
    const { data: existingUser, error: queryError } = await adminClient
      .from('users')
      .select('id, handle')
      .eq('google_id', userInfo.googleId)
      .maybeSingle()

    console.log('Existing user query:', {
      found: !!existingUser,
      handle: existingUser?.handle,
      error: queryError?.message
    })

    let userId: string
    let userHandle: string
    let isNewUser = false

    if (existingUser) {
      // 기존 사용자
      userId = existingUser.id
      userHandle = existingUser.handle
    } else {
      // 새 사용자 생성
      isNewUser = true

      // handle 생성 (이메일 @ 앞부분)
      const defaultHandle = userInfo.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '')

      // handle 중복 확인
      let handle = defaultHandle
      let suffix = 1
      while (true) {
        const { data: handleExists } = await adminClient
          .from('users')
          .select('id')
          .eq('handle', handle)
          .maybeSingle()

        if (!handleExists) break
        handle = `${defaultHandle}${suffix}`
        suffix++
        if (suffix > 100) {
          handle = `${defaultHandle}_${Date.now()}`
          break
        }
      }

      userId = crypto.randomUUID()
      userHandle = handle

      // 새 사용자 삽입
      const { error: insertError } = await adminClient
        .from('users')
        .insert({
          id: userId,
          email: userInfo.email,
          google_id: userInfo.googleId,
          handle: userHandle,
        })

      if (insertError) {
        console.error('Insert error:', insertError)

        // UNIQUE 에러 시 기존 사용자 재조회
        if (insertError.code === '23505') {
          console.log('UNIQUE violation - fetching existing user')
          const { data: retryUser } = await adminClient
            .from('users')
            .select('id, handle')
            .eq('google_id', userInfo.googleId)
            .maybeSingle()

          if (retryUser) {
            userId = retryUser.id
            userHandle = retryUser.handle
            isNewUser = false
          } else {
            return NextResponse.redirect(
              new URL(`/login?error=create_failed_${insertError.code}`, request.url)
            )
          }
        } else {
          return NextResponse.redirect(
            new URL(`/login?error=create_failed_${insertError.code}`, request.url)
          )
        }
      }
    }

    // 5. 토큰 암호화 및 저장
    console.log('Encrypting and saving tokens for user:', userId)

    const { data: encryptedAccess, error: encryptAccessError } = await adminClient.rpc('encrypt_token', {
      token: tokens.accessToken
    })
    const { data: encryptedRefresh, error: encryptRefreshError } = await adminClient.rpc('encrypt_token', {
      token: tokens.refreshToken
    })

    if (encryptAccessError || encryptRefreshError) {
      console.error('Encryption error:', { encryptAccessError, encryptRefreshError })
      // 암호화 실패해도 로그인은 진행 (토큰만 저장 안 됨)
    } else {
      const { error: updateError } = await adminClient
        .from('users')
        .update({
          access_token_encrypted: encryptedAccess,
          refresh_token_encrypted: encryptedRefresh,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Token update error:', updateError)
        // 업데이트 실패해도 로그인은 진행
      }
    }

    // 6. 세션 쿠키 설정 및 리다이렉트
    const redirectUrl = isNewUser ? `/onboarding?handle=${userHandle}` : `/${userHandle}`
    console.log('Redirecting to:', redirectUrl)

    const response = NextResponse.redirect(new URL(redirectUrl, request.url))
    response.cookies.set('user_google_id', userInfo.googleId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/',
    })

    return response
  } catch (err: any) {
    console.error('OAuth callback error:', err?.message || err)
    return NextResponse.redirect(
      new URL(`/login?error=oauth_failed&detail=${encodeURIComponent(err?.message || 'unknown')}`, request.url)
    )
  }
}
