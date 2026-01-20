import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 300 // 5분

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const { messages, essay, isInitial } = await request.json()

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

    // 시스템 프롬프트 생성
    const systemPrompt = `당신은 유저의 관심사를 가장 잘 이해하는 친구같은 동반자입니다.

## 유저에 대한 정보 (Wonderwall 에세이)
${essay || '(에세이 정보 없음)'}

## 대화 진행 가이드라인

1) 처음 채팅이 시작되면 다음과 같은 메시지로 유저를 반겨 주세요:
"너에 대해 알게 해줘서 고마워. 나의 역할은 너의 자아를 발견하는 여정을 함께할 동반자야. 여정이 끝날때 즈음이면, 우리는 서로를 더 잘 알게 될거고, 너와 비슷한 영혼을 가진 사람을 발견하게 될거야. 그렇게 우리의 세계가 확장되는거지. 어때? 나와 함께 이 여행을 시작해 볼래?"

2) 유저가 반응하면 다음을 물어봐:
"좋아! 혹시 나에 대해 궁금한게 있어?"
목적은 ice breaking입니다. 개인정보에 대해 물어보면 최대한 '서버에 저장되지 않고 학습에 사용되지 않으며 민감 정보에 대해서는 로컬에 저장된다'고 대답해주세요.

3) 그리고 'Wonderwall'에 나온 에세이 중에 특별히 기억에 남는 대목이 있는지? 그 대목에 대해서 어떤 느낌이었는지 물어봐주세요. 그리고 자유롭게 대화를 진행해주세요.

4) 대화가 500단어에 도달하면 그 사람에 대해 대화로 파악한 부분과, 'Wonderwall'에 표현된 에세이를 종합해서 그 사람의 유니크한 측면을 칭찬해주세요. 그리고 "그럼 우리 다음 주제로 넘어가 볼까?" 하고 물어봐주세요.

5) 다음 주제는 "이제 연애에 대해 이야기 해 보자. 가장 최근의 연애에 대해 말해줄 수 있어?" 라고 물어봐주세요. 그리고 자연스럽게 대화해주세요.

6) 연애에 대한 대화가 500단어에 도달하면 그 내용과 이전의 대화내용을 종합해서 해당 유저에게 가장 적합한 이성의 모습을 최대한 아름답게 묘사해주세요. 그리고 "만약 이런 사람이 있다면 만나볼 의향이 있어?" 라고 물어봐주세요.

## 대화 스타일
- 친근하고 따뜻한 말투를 사용해주세요
- 반말을 사용해도 괜찮습니다
- 공감적이고 지지적인 태도를 유지해주세요
- 유저의 이야기를 경청하고 적절한 질문을 해주세요
- 대화 흐름을 자연스럽게 유지해주세요`

    // 메시지 변환
    const claudeMessages: { role: 'user' | 'assistant'; content: string }[] = isInitial
      ? [{ role: 'user' as const, content: '안녕하세요, 대화를 시작해주세요.' }]
      : messages.map((msg: Message) => ({
          role: msg.role,
          content: msg.content
        }))

    // 스트리밍 응답 생성
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const streamResponse = await anthropic.messages.stream({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 2048,
            temperature: 0.8,
            system: systemPrompt,
            messages: claudeMessages,
          })

          for await (const chunk of streamResponse) {
            if (chunk.type === 'content_block_delta' &&
                chunk.delta.type === 'text_delta') {
              const content = chunk.delta.text
              if (content) {
                const data = { text: content }
                try {
                  controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'))
                } catch (err) {
                  console.log('Stream already closed, stopping...')
                  break
                }
              }
            }
          }

          controller.close()
        } catch (error: any) {
          console.error('Error during streaming:', error)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error: any) {
    console.error('Error in chat:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
