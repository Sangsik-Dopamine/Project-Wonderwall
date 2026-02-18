import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkAdminAuth } from '@/utils/admin-auth'

// 설정 데이터 타입
interface AdminSettingsData {
  model?: string
  api_key?: string
  system_prompt?: string
  user_prompt_template?: string
}

// 유효한 설정 타입
type SettingType = 'keywords' | 'wonderwall' | 'agent_a' | 'agent_b'

// Supabase 클라이언트 생성 함수
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseServiceKey)
}

// GET: 설정 로드
export async function GET() {
  try {
    // 이메일 기반 인증 확인
    const { isAdmin } = await checkAdminAuth()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseClient()

    // agent_a 설정 조회
    const { data: agentAData } = await supabase
      .rpc('get_admin_settings', { p_setting_type: 'agent_a' })
      .single() as { data: AdminSettingsData | null }

    // agent_b 설정 조회
    const { data: agentBData } = await supabase
      .rpc('get_admin_settings', { p_setting_type: 'agent_b' })
      .single() as { data: AdminSettingsData | null }

    // 기존 keywords 설정 조회 (하위 호환성)
    const { data: keywordsData } = await supabase
      .rpc('get_admin_settings', { p_setting_type: 'keywords' })
      .single() as { data: AdminSettingsData | null }

    // 기존 wonderwall 설정 조회 (하위 호환성)
    const { data: wonderwallData } = await supabase
      .rpc('get_admin_settings', { p_setting_type: 'wonderwall' })
      .single() as { data: AdminSettingsData | null }

    const result: Record<string, unknown> = {}

    if (agentAData) {
      result.agent_a = {
        model: agentAData.model || 'claude-sonnet-4-5',
        apiKey: agentAData.api_key || '',
        systemPrompt: agentAData.system_prompt || '',
        userPromptTemplate: agentAData.user_prompt_template || '',
      }
    }

    if (agentBData) {
      result.agent_b = {
        model: agentBData.model || 'claude-sonnet-4-5',
        apiKey: agentBData.api_key || '',
        systemPrompt: agentBData.system_prompt || '',
        userPromptTemplate: agentBData.user_prompt_template || '',
      }
    }

    // 하위 호환성 유지
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

    const validTypes: SettingType[] = ['keywords', 'wonderwall', 'agent_a', 'agent_b']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "keywords", "wonderwall", "agent_a", or "agent_b"' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // RPC 함수를 통해 설정 저장
    const { error } = await supabase.rpc('save_admin_settings', {
      p_setting_type: type,
      p_model: settings.model || 'claude-sonnet-4-5',
      p_api_key: settings.apiKey || '',
      p_system_prompt: settings.systemPrompt || '',
      p_user_prompt_template: settings.userPromptTemplate || '',
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
