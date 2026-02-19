import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAgentPrompts, DEFAULT_AGENT_A_SYSTEM, DEFAULT_AGENT_A_USER } from '@/lib/agent-prompts'

// Vercel function timeout 설정 (Pro plan 이상 필요)
export const maxDuration = 300 // 5분

const MAX_KEYWORDS = 300

export async function POST(request: NextRequest) {
  try {
    const { subscriptionData } = await request.json()

    if (!subscriptionData) {
      return new Response(
        JSON.stringify({ error: 'Subscription data is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Anthropic API 초기화
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not set')
      return new Response(
        JSON.stringify({ error: 'Anthropic API key is not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const anthropic = new Anthropic({ apiKey })

    console.log('Total channels:', subscriptionData.channels?.length || 0)

    // 채널 제목만 추출 (간소화)
    const channels = subscriptionData.channels || []
    const channelTitles = channels.map((channel: any) => channel.title).join('\n')

    console.log('Calling Claude API for keyword extraction...')
    console.log('Analyzing channels:', channels.length)

    // Supabase에서 프롬프트 가져오기 (없으면 기본값 사용)
    let prompts
    try {
      prompts = await getAgentPrompts('agent_a')
    } catch (error) {
      console.log('Using default prompts due to error:', error)
      prompts = {
        systemPrompt: DEFAULT_AGENT_A_SYSTEM,
        userPromptTemplate: DEFAULT_AGENT_A_USER,
      }
    }

    // 변수 치환
    const systemPrompt = prompts.systemPrompt
    const userPrompt = prompts.userPromptTemplate.replace('{channelTitles}', channelTitles)

    console.log('Prompt length:', userPrompt.length, 'characters')

    // 스트리밍 응답 생성
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Claude API 스트리밍 호출
          const streamResponse = await anthropic.messages.stream({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 8192,
            temperature: 0.7,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
          })

          // 키워드 개수 추적을 위한 변수
          let keywordCount = 0
          let accumulatedText = ''
          let limitReached = false

          // 스트리밍 응답 처리
          for await (const chunk of streamResponse) {
            if (chunk.type === 'content_block_delta' &&
                chunk.delta.type === 'text_delta') {
              const content = chunk.delta.text
              if (content) {
                // 콤마를 세어 키워드 개수 추적
                accumulatedText += content
                const commaCount = (accumulatedText.match(/,/g) || []).length
                keywordCount = commaCount + 1 // 키워드 개수 = 콤마 개수 + 1

                // MAX_KEYWORDS 개수에 도달하면 스트림 종료
                if (keywordCount >= MAX_KEYWORDS) {
                  console.log(`Reached ${MAX_KEYWORDS} keywords limit, stopping stream`)
                  limitReached = true
                  break
                }

                const data = { text: content, thoughts: '' }
                try {
                  controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'))
                } catch (err) {
                  console.log('Stream already closed, stopping...')
                  break
                }
              }
            }
          }

          console.log(`Keywords extraction completed. Total keywords: ${keywordCount}${limitReached ? ' (limit reached)' : ''}`)
          controller.close()
        } catch (error: any) {
          console.error('Error during streaming:', error)
          controller.error(error)
        }
      },
    })

    // 스트리밍 응답 반환
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error: any) {
    console.error('Error in analyze-keywords:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
