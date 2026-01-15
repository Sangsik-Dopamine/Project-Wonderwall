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

    // 3. Supabase에서 사용자 처리
    // Admin client를 사용하여 RLS를 우회 (custom OAuth flow에서는 auth.uid()가 없으므로)
    const adminClient = createAdminClient()

    // 3-1. 기존 사용자 확인
    const { data: existingUser, error: userQueryError } = await adminClient
      .from('users')
      .select('id, handle')
      .eq('google_id', userInfo.googleId)
      .single()

    console.log('User query result:', {
      hasUser: !!existingUser,
      error: userQueryError?.code,
      errorMessage: userQueryError?.message,
      googleId: userInfo.googleId,
    })

    // 기존 사용자가 있거나, 에러가 PGRST116(no rows)가 아닌 다른 에러면 기존 사용자 처리 시도
    if (existingUser || (userQueryError && userQueryError.code !== 'PGRST116')) {
      // 기존 사용자: 토큰만 업데이트
      // encrypt_token RPC로 암호화 후 직접 UPDATE (save_encrypted_tokens의 auth.uid() 체크 우회)

      // 에러가 있는데 사용자가 없으면 google_id로 다시 조회 시도
      let userId = existingUser?.id
      let userHandle = existingUser?.handle

      if (!existingUser && userQueryError) {
        console.log('Query error, trying alternative lookup...')
        // maybeSingle()로 재시도 (에러 없이 null 반환)
        const { data: retryUser } = await adminClient
          .from('users')
          .select('id, handle')
          .eq('google_id', userInfo.googleId)
          .maybeSingle()

        if (retryUser) {
          userId = retryUser.id
          userHandle = retryUser.handle
          console.log('Found user on retry:', { userId, userHandle })
        } else {
          // 정말 새 사용자인 경우 - PGRST116이 아닌 에러였지만 사용자 없음
          console.log('No user found, proceeding to create new user')
        }
      }

      if (userId && userHandle) {
        const { data: encryptedAccess } = await adminClient.rpc('encrypt_token', {
          token: tokens.accessToken
        })
        const { data: encryptedRefresh } = await adminClient.rpc('encrypt_token', {
          token: tokens.refreshToken
        })

        const { error: updateError } = await adminClient
          .from('users')
          .update({
            access_token_encrypted: encryptedAccess,
            refresh_token_encrypted: encryptedRefresh,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        if (updateError) {
          console.error('Failed to update tokens:', updateError)
        }

        // 세션 쿠키 설정
        const response = NextResponse.redirect(
          new URL(`/${userHandle}`, request.url)
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
    }

    // 새 사용자 생성 (PGRST116 = no rows found)
    // handle은 이메일의 @ 앞부분을 기본값으로 사용
    const defaultHandle = userInfo.email.split('@')[0]

    // handle 중복 확인 및 유니크하게 생성
    let handle = defaultHandle
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
    }

    // 새 사용자 생성
    const newUserId = crypto.randomUUID()

    const { error: insertError } = await adminClient.from('users').insert({
      id: newUserId,
      email: userInfo.email,
      google_id: userInfo.googleId,
      handle,
    })

    if (insertError) {
      console.error('Failed to create user:', insertError)
      // UNIQUE 제약조건 에러인 경우 (이미 존재하는 사용자) - 다시 조회 후 로그인 처리
      if (insertError.code === '23505') {
        console.log('User already exists (UNIQUE violation), fetching existing user...')
        const { data: duplicateUser } = await adminClient
          .from('users')
          .select('id, handle')
          .eq('google_id', userInfo.googleId)
          .maybeSingle()

        if (duplicateUser) {
          const response = NextResponse.redirect(
            new URL(`/${duplicateUser.handle}`, request.url)
          )
          response.cookies.set('user_google_id', userInfo.googleId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
          })
          return response
        }
      }
      return NextResponse.redirect(
        new URL('/login?error=create_user_failed', request.url)
      )
    }

    // 토큰 저장 (encrypt_token RPC로 암호화 후 직접 UPDATE)
    const { data: encryptedAccessNew } = await adminClient.rpc('encrypt_token', {
      token: tokens.accessToken
    })
    const { data: encryptedRefreshNew } = await adminClient.rpc('encrypt_token', {
      token: tokens.refreshToken
    })

    await adminClient
      .from('users')
      .update({
        access_token_encrypted: encryptedAccessNew,
        refresh_token_encrypted: encryptedRefreshNew,
      })
      .eq('id', newUserId)

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
  } catch (err) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(
      new URL('/login?error=oauth_failed', request.url)
    )
  }
}
