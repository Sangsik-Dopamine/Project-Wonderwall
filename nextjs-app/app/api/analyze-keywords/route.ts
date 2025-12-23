import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const { subscriptionData } = await request.json()

    if (!subscriptionData) {
      return NextResponse.json(
        { error: 'Subscription data is required' },
        { status: 400 }
      )
    }

    // Gemini API 초기화
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set')
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    // 프롬프트 생성
    const prompt = `다음은 JSON 형식의 유튜브 채널 리스트이다. 각 채널의 특징을 분석해서 채널당 3개의 핵심 키워드를 추출해라. 다른 설명은 생략하고 오직 추출된 키워드들만 콤마(,)로 구분된 마크다운 형식으로 나열해라.

${JSON.stringify(subscriptionData, null, 2)}`

    console.log('Calling Gemini API...')
    console.log('Total channels:', subscriptionData.channels?.length || 0)

    // Gemini API 호출
    const result = await model.generateContent(prompt)
    const response = await result.response
    const keywords = response.text()

    console.log('Keywords extracted successfully')
    console.log('Keywords length:', keywords.length)

    return NextResponse.json({
      success: true,
      keywords,
    })
  } catch (error: any) {
    console.error('Error in analyze-keywords:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
