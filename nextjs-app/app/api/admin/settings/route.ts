import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// Supabase 클라이언트 초기화 (service role key 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 인증 체크 헬퍼 함수
async function checkAuth() {
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin_session')
  return adminSession?.value === 'authenticated'
}

// GET: 설정 로드
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    if (!(await checkAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // keywords 설정 조회
    const { data: keywordsData, error: keywordsError } = await supabase
      .rpc('get_admin_settings', { p_setting_type: 'keywords' })
      .single()

    // wonderwall 설정 조회
    const { data: wonderwallData, error: wonderwallError } = await supabase
      .rpc('get_admin_settings', { p_setting_type: 'wonderwall' })
      .single()

    const result: any = {}

    if (keywordsData) {
      result.keywords = {
        model: keywordsData.model || 'claude-sonnet-4-5',
        apiKey: keywordsData.api_key || '',
        systemPrompt: keywordsData.system_prompt || '',
        userPromptTemplate: keywordsData.user_prompt_template || '',
      }
    }

    if (wonderwallData) {
      result.wonderwall = {
        model: wonderwallData.model || 'claude-sonnet-4-5',
        apiKey: wonderwallData.api_key || '',
        systemPrompt: wonderwallData.system_prompt || '',
        userPromptTemplate: wonderwallData.user_prompt_template || '',
      }
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error loading settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to load settings' },
      { status: 500 }
    )
  }
}

// POST: 설정 저장
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    if (!(await checkAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, settings } = await request.json()

    if (!type || !settings) {
      return NextResponse.json(
        { error: 'Type and settings are required' },
        { status: 400 }
      )
    }

    if (type !== 'keywords' && type !== 'wonderwall') {
      return NextResponse.json(
        { error: 'Invalid type. Must be "keywords" or "wonderwall"' },
        { status: 400 }
      )
    }

    // RPC 함수를 통해 설정 저장
    const { error } = await supabase.rpc('save_admin_settings', {
      p_setting_type: type,
      p_model: settings.model,
      p_api_key: settings.apiKey,
      p_system_prompt: settings.systemPrompt,
      p_user_prompt_template: settings.userPromptTemplate,
    })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error saving settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save settings' },
      { status: 500 }
    )
  }
}
