import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkAdminAuth } from '@/utils/admin-auth'

// Supabase 클라이언트 초기화 (service role key 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET: 설정 로드
export async function GET() {
  try {
    // 이메일 기반 인증 확인
    const { isAdmin } = await checkAdminAuth()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // keywords 설정 조회
    const { data: keywordsData } = await supabase
      .rpc('get_admin_settings', { p_setting_type: 'keywords' })
      .single()

    // wonderwall 설정 조회
    const { data: wonderwallData } = await supabase
      .rpc('get_admin_settings', { p_setting_type: 'wonderwall' })
      .single()

    const result: Record<string, unknown> = {}

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
  } catch (error) {
    console.error('Error loading settings:', error)
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    )
  }
}

// POST: 설정 저장
export async function POST(request: NextRequest) {
  try {
    // 이메일 기반 인증 확인
    const { isAdmin } = await checkAdminAuth()
    if (!isAdmin) {
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
  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}
