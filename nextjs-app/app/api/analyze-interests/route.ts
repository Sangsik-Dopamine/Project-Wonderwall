import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/utils/supabase/admin'
import { getYouTubeSubscriptions, generateSubscriptionFilename } from '@/lib/youtube-api'
import { refreshAccessToken } from '@/lib/google-oauth'

export async function POST(request: NextRequest) {
  try {
    // 1. 쿠키에서 사용자 인증 확인
    const cookieStore = await cookies()
    const googleId = cookieStore.get('user_google_id')?.value

    if (!googleId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // 2. 사용자 정보 조회 (RLS 우회)
    const adminClient = createAdminClient()
    const { data: user, error: userError } = await adminClient
      .from('users')
      .select('id')
      .eq('google_id', googleId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 3. 저장된 액세스 토큰 가져오기 (decrypt_token RPC로 복호화)
    const { data: accessTokenData } = await adminClient.rpc('decrypt_token', {
      encrypted_token: (await adminClient.from('users').select('access_token_encrypted').eq('id', user.id).single()).data?.access_token_encrypted
    })
    const { data: refreshTokenData } = await adminClient.rpc('decrypt_token', {
      encrypted_token: (await adminClient.from('users').select('refresh_token_encrypted').eq('id', user.id).single()).data?.refresh_token_encrypted
    })

    const tokens = {
      access_token: accessTokenData,
      refresh_token: refreshTokenData
    }

    console.log('Token data retrieved:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
    })

    if (!tokens.access_token) {
      console.error('No valid tokens found')
      return NextResponse.json(
        { error: 'No valid access token found' },
        { status: 500 }
      )
    }

    console.log('Access token retrieved:', {
      hasToken: !!tokens.access_token,
      tokenLength: tokens.access_token?.length,
      tokenPrefix: tokens.access_token?.substring(0, 20) + '...',
    })

    // 4. 토큰 갱신 (만료되었을 수 있으므로)
    console.log('Refreshing access token...')
    let accessToken = tokens.access_token

    try {
      const refreshedTokens = await refreshAccessToken(tokens.refresh_token)
      accessToken = refreshedTokens.accessToken

      console.log('Token refreshed successfully')

      // 새로운 액세스 토큰 저장 (encrypt_token RPC로 암호화 후 직접 UPDATE)
      const { data: encryptedAccess } = await adminClient.rpc('encrypt_token', {
        token: accessToken
      })
      await adminClient
        .from('users')
        .update({
          access_token_encrypted: encryptedAccess,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
    } catch (refreshError) {
      console.error('Failed to refresh token:', refreshError)
      // 토큰 갱신 실패 시 기존 토큰으로 시도
      console.log('Using existing access token...')
    }

    // 5. YouTube 구독 정보 가져오기
    console.log('Fetching YouTube subscriptions...')
    const subscriptionData = await getYouTubeSubscriptions(accessToken)

    console.log(`Retrieved ${subscriptionData.totalSubscriptions} subscriptions`)

    // 6. JSON 파일명 생성
    const filename = generateSubscriptionFilename(user.id)

    // 7. Supabase에 저장 (관리자 클라이언트 사용)
    const { error: saveError } = await adminClient
      .from('subscription_analyses')
      .insert({
        user_id: user.id,
        data: subscriptionData,
        filename,
      })

    if (saveError) {
      console.error('Failed to save subscription data:', saveError)
      return NextResponse.json(
        { error: 'Failed to save data' },
        { status: 500 }
      )
    }

    // 7. 성공 응답
    return NextResponse.json({
      success: true,
      filename,
      totalSubscriptions: subscriptionData.totalSubscriptions,
      subscriptionData, // 프론트엔드로 데이터 전달
    })
  } catch (error: any) {
    console.error('Error in analyze-interests:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
