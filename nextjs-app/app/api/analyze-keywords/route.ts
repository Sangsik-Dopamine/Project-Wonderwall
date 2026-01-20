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
    const MAX_KEYWORDS = 300
    const systemPrompt = `너는 유튜브 구독 채널 데이터를 분석해서 사용자의 관심사를 파악하는 전문가야. 채널 제목을 보고 각 채널의 핵심 주제를 키워드로 추출해줘. 단, 총 키워드 개수는 반드시 ${MAX_KEYWORDS}개 이하로 제한해줘.`

    const userPrompt = `다음은 유튜브 채널 제목 리스트이다. 각 채널의 특징을 분석해서 핵심 키워드를 추출해줘. 다른 설명은 생략하고 오직 추출된 키워드들만 콤마(,)로 구분된 형식으로 나열해줘. 총 키워드 개수는 ${MAX_KEYWORDS}개를 넘지 않도록 해줘.

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
