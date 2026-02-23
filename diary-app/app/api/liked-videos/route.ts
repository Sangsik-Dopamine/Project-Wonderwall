import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getYouTubeLikedVideos } from '@/lib/youtube-api'
import { refreshAccessToken } from '@/lib/google-oauth'

export async function GET(request: NextRequest) {
  const googleId = request.cookies.get('user_google_id')?.value
  if (!googleId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const adminClient = createAdminClient()

  // 사용자의 암호화된 토큰 조회
  const { data: user } = await adminClient
    .from('users')
    .select('id, access_token_encrypted, refresh_token_encrypted')
    .eq('google_id', googleId)
    .maybeSingle()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // 토큰 복호화
  const { data: accessToken } = await adminClient.rpc('decrypt_token', {
    encrypted_token: user.access_token_encrypted,
  })
  const { data: refreshToken } = await adminClient.rpc('decrypt_token', {
    encrypted_token: user.refresh_token_encrypted,
  })

  if (!accessToken || !refreshToken) {
    return NextResponse.json({ error: 'Token decryption failed' }, { status: 500 })
  }

  try {
    // 좋아요 동영상 목록 가져오기
    const likedVideos = await getYouTubeLikedVideos(accessToken)
    return NextResponse.json(likedVideos)
  } catch {
    // 액세스 토큰 만료 시 리프레시
    try {
      const newTokens = await refreshAccessToken(refreshToken)

      // 새 토큰 저장
      const { data: encryptedAccess } = await adminClient.rpc('encrypt_token', {
        token: newTokens.accessToken,
      })
      await adminClient
        .from('users')
        .update({ access_token_encrypted: encryptedAccess })
        .eq('id', user.id)

      // 재시도
      const likedVideos = await getYouTubeLikedVideos(newTokens.accessToken)
      return NextResponse.json(likedVideos)
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError)
      return NextResponse.json(
        { error: 'Failed to fetch liked videos. Please re-login.' },
        { status: 401 }
      )
    }
  }
}
