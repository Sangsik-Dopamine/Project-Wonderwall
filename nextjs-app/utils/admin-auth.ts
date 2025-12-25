import { createClient } from '@/utils/supabase/server'

// 허용된 어드민 이메일 목록
const ADMIN_EMAILS = ['park.sangsik@gmail.com']

/**
 * 현재 로그인한 사용자가 어드민인지 확인
 * @returns { isAdmin: boolean, email: string | null }
 */
export async function checkAdminAuth(): Promise<{ isAdmin: boolean; email: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return { isAdmin: false, email: null }
    }

    const email = user.email || null
    const isAdmin = email ? ADMIN_EMAILS.includes(email) : false

    return { isAdmin, email }
  } catch (error) {
    console.error('Admin auth check error:', error)
    return { isAdmin: false, email: null }
  }
}

/**
 * 클라이언트 사이드에서 어드민 여부 확인용 API 호출
 */
export async function checkAdminStatus(): Promise<{ isAdmin: boolean; email: string | null }> {
  try {
    const response = await fetch('/api/admin/check-auth')
    if (response.ok) {
      return await response.json()
    }
    return { isAdmin: false, email: null }
  } catch {
    return { isAdmin: false, email: null }
  }
}
