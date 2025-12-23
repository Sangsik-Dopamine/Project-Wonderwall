import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  try {
    const { keywords } = await request.json()

    if (!keywords) {
      return new Response(
        JSON.stringify({ error: 'Keywords are required' }),
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

    console.log('Creating Wonderwall essay with Claude 3.5 Sonnet...')
    console.log('Keywords length:', keywords.length, 'characters')

    // 프롬프트 생성
    const systemPrompt = `너는 한 사람의 관심사와 취향을 기반으로 그 사람의 숨겨진 아름다운 면을 드러내는 에세이스트야. 전반적으로 "당신의 취향은 어떤 것 때문에 이렇게 돋보입니다" 하는 식으로 차분하고 설명적으로 출력해 주고, 전체 분량은 2500자 정도로 맞춰줘. 출력 전에 결과물을 한번 더 검토하고, 성적이거나 정치적으로 민감한 내용은 삭제해주고 긍정적인 부분을 부각시켜줘.`

    const userPrompt = `아래는 어떤 사람의 유투브 구독채널에서 추출한 키워드야. 이것을 기반으로 다음 작업을 순차적으로 진행해줘.

1) 이 사람의 취향과 개성을 추론하고, 취향, 관심사를 유의미한 카테고리로 묶어줘. 출력순서는 문화와 예술, 인문, 과학 등 비실용적 분야가 앞에, 경제, 투자 등 실용적 분야가 뒤에 나오도록 배치해줘.

2) 그리고 각 카테고리별로 이 사람의 취향과 관심사에 대해 임팩트있게 소개한 글을 출력하는데, 그 분야의 관심사에 대해 '평범한 사람들' 보다 특별히 매력적이거나 개성있는 부분에 대해 출력해줘.

3) 그 다음 이 사람이 종합적으로 이 사람의 성격이나 강점이 다른사람에 비해 어떨 것 같다는 것을 긍정적인 방향으로 추론해서 글을 마무리해줘.

4) 별도의 섹션으로 사람이 관심있어할만한 고유명사 (인명, 지명, 작품명) 중 특이하면서 그 분야에 대한 깊은 조예를 보여줄 수 있는 키워드를 별도로 정리해줘

---

키워드:
${keywords}`

    // 스트리밍 응답 생성
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Claude API 스트리밍 호출
          const streamResponse = await anthropic.messages.stream({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4096,
            temperature: 0.8,
            system: systemPrompt,
            messages: [
              { role: 'user', content: userPrompt }
            ],
          })

          // 스트리밍 응답 처리
          for await (const chunk of streamResponse) {
            if (chunk.type === 'content_block_delta' &&
                chunk.delta.type === 'text_delta') {
              const content = chunk.delta.text

              if (content) {
                // 간단한 JSON 형식으로 전송 (thoughts는 비어있음)
                const data = {
                  text: content,
                  thoughts: '',
                }
                controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'))
              }
            }
          }

          console.log('Wonderwall essay completed')
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
    console.error('Error in create-wonderwall:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
