import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getYouTubeSubscriptions, generateSubscriptionFilename } from '@/lib/youtube-api'

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
    const { data: tokenData, error: tokenError } = await adminClient.rpc(
      'get_decrypted_tokens',
      { p_user_id: user.id }
    )

    if (tokenError || !tokenData) {
      console.error('Failed to get tokens:', tokenError)
      return NextResponse.json(
        { error: 'Failed to retrieve access tokens' },
        { status: 500 }
      )
    }

    // 4. YouTube 구독 정보 가져오기
    console.log('Fetching YouTube subscriptions...')
    const subscriptionData = await getYouTubeSubscriptions(
      tokenData.access_token
    )

    console.log(`Retrieved ${subscriptionData.totalSubscriptions} subscriptions`)

    // 5. JSON 파일명 생성
    const filename = generateSubscriptionFilename(user.id)

    // 6. Supabase에 저장 (관리자 클라이언트 사용)
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
    })
  } catch (error: any) {
    console.error('Error in analyze-interests:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
