import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Admin Client
 * Service Role Key를 사용하여 RLS를 우회할 수 있는 관리자 클라이언트
 * 주의: 서버 사이드에서만 사용해야 합니다!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('Admin Client Debug:', {
    hasUrl: !!supabaseUrl,
    hasServiceKey: !!supabaseServiceKey,
    serviceKeyPrefix: supabaseServiceKey?.substring(0, 20) + '...',
  })

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase admin credentials')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
