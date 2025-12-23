import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// Vercel function timeout 설정 (Pro plan 이상 필요)
export const maxDuration = 300 // 5분

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

    // 프롬프트 생성
    const systemPrompt = `너는 유튜브 구독 채널 데이터를 분석해서 사용자의 관심사를 파악하는 전문가야. 채널 제목을 보고 각 채널의 핵심 주제를 3개의 키워드로 추출해줘.`

    const userPrompt = `다음은 유튜브 채널 제목 리스트이다. 각 채널의 특징을 분석해서 채널당 3개의 핵심 키워드를 추출해줘. 다른 설명은 생략하고 오직 추출된 키워드들만 콤마(,)로 구분된 형식으로 나열해줘.

채널 리스트:
${channelTitles}`

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

          // 스트리밍 응답 처리
          for await (const chunk of streamResponse) {
            if (chunk.type === 'content_block_delta' &&
                chunk.delta.type === 'text_delta') {
              const content = chunk.delta.text
              if (content) {
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

          console.log('Keywords extraction completed')
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
