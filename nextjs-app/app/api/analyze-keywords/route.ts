import { NextRequest } from 'next/server'
import { GoogleGenAI } from '@google/genai'

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

    // Gemini API 초기화
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set')
      return new Response(
        JSON.stringify({ error: 'Gemini API key is not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const ai = new GoogleGenAI({ apiKey })

    console.log('Total channels:', subscriptionData.channels?.length || 0)

    // 채널 수 제한 (최대 100개) - Gemini API 타임아웃 방지
    const MAX_CHANNELS = 100
    const limitedData = {
      ...subscriptionData,
      channels: subscriptionData.channels?.slice(0, MAX_CHANNELS) || []
    }

    console.log('Analyzing channels:', limitedData.channels.length)

    // 프롬프트 생성
    const prompt = `다음은 JSON 형식의 유튜브 채널 리스트이다. 각 채널의 특징을 분석해서 채널당 3개의 핵심 키워드를 추출해라. 다른 설명은 생략하고 오직 추출된 키워드들만 콤마(,)로 구분된 마크다운 형식으로 나열해라.

${JSON.stringify(limitedData, null, 2)}`

    console.log('Calling Gemini API with streaming...')
    console.log('Prompt length:', prompt.length, 'characters')

    // 스트리밍 응답 생성
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Gemini API 스트리밍 호출 (thinking mode 활성화)
          const response = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt,
          })

          // 스트리밍 응답 처리 (response를 직접 iterate)
          for await (const chunk of response) {
            // 사고 과정과 최종 텍스트를 구분하여 전송
            const data: any = {
              text: chunk.text || '',
              thoughts: '',
            }

            // 사고 과정 추출
            if (chunk.candidates?.[0]?.content?.parts) {
              const parts = chunk.candidates[0].content.parts
              for (const part of parts) {
                if (part.thought) {
                  data.thoughts = part.text || ''
                }
              }
            }

            // JSON 형식으로 전송 (프론트엔드에서 파싱)
            if (data.text || data.thoughts) {
              try {
                controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'))
              } catch (err) {
                // Controller가 이미 닫혔으면 무시
                console.log('Stream already closed, stopping...')
                break
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
