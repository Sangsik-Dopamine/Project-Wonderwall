import { createClient } from '@/utils/supabase/server'

/**
 * 사용자 토큰을 암호화하여 저장
 */
export async function saveUserTokens(params: {
  userId: string
  accessToken: string
  refreshToken: string
}) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('save_encrypted_tokens', {
    p_user_id: params.userId,
    p_access_token: params.accessToken,
    p_refresh_token: params.refreshToken,
  })

  if (error) throw error
}

/**
 * 사용자 토큰을 복호화하여 조회
 */
export async function getUserTokens(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users_with_tokens')
    .select('access_token, refresh_token')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

/**
 * 사용자 정보 저장 (토큰 포함)
 */
export async function createUser(params: {
  id: string
  email: string
  googleId: string
  handle: string
  accessToken?: string
  refreshToken?: string
}) {
  const supabase = await createClient()

  // 1. 기본 사용자 정보 저장
  const { error: insertError } = await supabase.from('users').insert({
    id: params.id,
    email: params.email,
    google_id: params.googleId,
    handle: params.handle,
  })

  if (insertError) throw insertError

  // 2. 토큰이 있으면 암호화하여 저장
  if (params.accessToken && params.refreshToken) {
    await saveUserTokens({
      userId: params.id,
      accessToken: params.accessToken,
      refreshToken: params.refreshToken,
    })
  }
}

/**
 * 사용자 정보 업데이트 (토큰 포함)
 */
export async function updateUserTokens(params: {
  userId: string
  accessToken: string
  refreshToken: string
}) {
  await saveUserTokens(params)
}
