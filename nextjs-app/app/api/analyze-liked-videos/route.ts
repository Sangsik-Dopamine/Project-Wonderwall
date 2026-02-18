import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getYouTubeLikedVideos } from '@/lib/youtube-api'
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

    // 3. 저장된 액세스 토큰 가져오기
    const adminClient = createAdminClient()
    const encryptionKey = process.env.SUPABASE_ENCRYPTION_KEY!
    const { data: tokenData, error: tokenError } = await adminClient.rpc(
      'get_decrypted_tokens',
      {
        p_user_id: user.id,
        p_encryption_key: encryptionKey
      }
    )

    if (tokenError || !tokenData) {
      console.error('Failed to get tokens:', tokenError)
      return NextResponse.json(
        { error: 'Failed to retrieve access tokens' },
        { status: 500 }
      )
    }

    const tokens = Array.isArray(tokenData) ? tokenData[0] : tokenData

    if (!tokens || !tokens.access_token) {
      return NextResponse.json(
        { error: 'No valid access token found' },
        { status: 500 }
      )
    }

    // 4. 토큰 갱신
    let accessToken = tokens.access_token

    try {
      const refreshedTokens = await refreshAccessToken(tokens.refresh_token)
      accessToken = refreshedTokens.accessToken

      await adminClient.rpc('save_encrypted_tokens', {
        p_user_id: user.id,
        p_access_token: accessToken,
        p_refresh_token: tokens.refresh_token,
        p_encryption_key: encryptionKey,
      })
    } catch (refreshError) {
      console.error('Failed to refresh token:', refreshError)
    }

    // 5. YouTube 좋아요한 동영상 가져오기 (최근 1개월)
    console.log('Fetching YouTube liked videos...')
    const likedVideosData = await getYouTubeLikedVideos(accessToken)

    console.log(`Retrieved ${likedVideosData.totalVideos} liked videos`)

    // 6. Supabase에 저장
    const { error: saveError } = await adminClient
      .from('liked_videos')
      .upsert({
        user_id: user.id,
        data: likedVideosData,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (saveError) {
      console.error('Failed to save liked videos:', saveError)
      // 저장 실패해도 데이터는 반환
    }

    // 7. 성공 응답
    return NextResponse.json({
      success: true,
      totalVideos: likedVideosData.totalVideos,
      likedVideosData,
    })
  } catch (error: any) {
    console.error('Error in analyze-liked-videos:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
