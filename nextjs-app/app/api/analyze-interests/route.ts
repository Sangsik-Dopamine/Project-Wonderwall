import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
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

    // 2. 사용자 정보 조회
    const supabase = await createClient()
    const { data: user, error: userError } = await supabase
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

    // 3. 저장된 액세스 토큰 가져오기 (관리자 클라이언트 사용)
    const adminClient = createAdminClient()
    const encryptionKey = process.env.SUPABASE_ENCRYPTION_KEY!
    const { data: tokenData, error: tokenError } = await adminClient.rpc(
      'get_decrypted_tokens',
      {
        p_user_id: user.id,
        p_encryption_key: encryptionKey
      }
    )

    console.log('Token data retrieved:', {
      hasData: !!tokenData,
      dataType: Array.isArray(tokenData) ? 'array' : typeof tokenData,
      dataLength: Array.isArray(tokenData) ? tokenData.length : 'N/A',
    })

    if (tokenError || !tokenData) {
      console.error('Failed to get tokens:', tokenError)
      return NextResponse.json(
        { error: 'Failed to retrieve access tokens' },
        { status: 500 }
      )
    }

    // RPC 함수는 배열로 반환하므로 첫 번째 요소 가져오기
    const tokens = Array.isArray(tokenData) ? tokenData[0] : tokenData

    if (!tokens || !tokens.access_token) {
      console.error('No valid tokens found:', tokens)
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

      // 새로운 액세스 토큰 저장
      await adminClient.rpc('save_encrypted_tokens', {
        p_user_id: user.id,
        p_access_token: accessToken,
        p_refresh_token: tokens.refresh_token,
        p_encryption_key: encryptionKey,
      })
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
