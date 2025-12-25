import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkAdminAuth } from '@/utils/admin-auth'
import Anthropic from '@anthropic-ai/sdk'

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    // 이메일 기반 인증 확인
    const { isAdmin } = await checkAdminAuth()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type } = await request.json()

    if (!type || (type !== 'keywords' && type !== 'wonderwall')) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "keywords" or "wonderwall"' },
        { status: 400 }
      )
    }

    // 설정 조회
    const { data: settingsData, error: settingsError } = await supabase
      .rpc('get_admin_settings', { p_setting_type: type })
      .single()

    if (settingsError || !settingsData) {
      return NextResponse.json(
        { error: 'Settings not found. Please save settings first.' },
        { status: 404 }
      )
    }

    const { model, api_key: apiKey } = settingsData

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 400 }
      )
    }

    // 모델에 따라 다른 API 호출
    let result = ''
    const testMessage = '테스트 메시지입니다. "API 테스트 성공"이라고만 답변해주세요.'

    if (model.startsWith('claude')) {
      // Anthropic Claude API 테스트
      const anthropic = new Anthropic({ apiKey })

      const message = await anthropic.messages.create({
        model: model === 'claude-sonnet-4-5' ? 'claude-sonnet-4-5-20250929' : model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: testMessage }],
      })

      const content = message.content[0]
      if (content.type === 'text') {
        result = content.text
      }
    } else if (model.startsWith('gpt')) {
      // OpenAI API 테스트
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: testMessage }],
          max_tokens: 100,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      result = data.choices[0].message.content
    } else if (model.startsWith('gemini')) {
      // Google Gemini API 테스트
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: testMessage }]
            }]
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`)
      }

      const data = await response.json()
      result = data.candidates[0].content.parts[0].text
    } else {
      return NextResponse.json(
        { error: 'Unsupported model' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('API test error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'API test failed' },
      { status: 500 }
    )
  }
}
