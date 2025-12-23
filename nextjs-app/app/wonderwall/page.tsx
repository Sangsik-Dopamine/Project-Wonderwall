'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function WonderwallPage() {
  const router = useRouter()
  const [keywords, setKeywords] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [essay, setEssay] = useState('')
  const [thoughts, setThoughts] = useState('')
  const [error, setError] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    // localStorage에서 키워드 가져오기
    const savedKeywords = localStorage.getItem('extractedKeywords')
    if (savedKeywords) {
      setKeywords(savedKeywords)
    }
  }, [])

  const handleGenerate = async () => {
    if (!keywords) {
      setError('키워드가 없습니다. 먼저 관심사 분석을 진행해주세요.')
      return
    }

    setIsGenerating(true)
    setError('')
    setEssay('')
    setThoughts('')
    setIsComplete(false)

    try {
      const response = await fetch('/api/create-wonderwall', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keywords }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Wonderwall 생성 중 오류가 발생했습니다')
        setIsGenerating(false)
        return
      }

      // 스트리밍 응답 처리
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        setError('스트리밍을 시작할 수 없습니다')
        setIsGenerating(false)
        return
      }

      let accumulatedEssay = ''
      let accumulatedThoughts = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          console.log('Wonderwall 생성 완료!')
          setIsComplete(true)
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        // 개행 문자로 구분된 JSON 파싱
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line)

              if (data.thoughts) {
                accumulatedThoughts += data.thoughts
                setThoughts(accumulatedThoughts)
              }

              if (data.text) {
                accumulatedEssay += data.text
                setEssay(accumulatedEssay)
              }
            } catch (e) {
              console.error('JSON 파싱 에러:', e)
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Wonderwall 생성 에러:', err)
      setError('네트워크 오류가 발생했습니다: ' + err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleShareLink = () => {
    // TODO: 링크 공유 기능 구현
    alert('링크 공유 기능은 준비 중입니다')
  }

  const handleShareLinktree = () => {
    // TODO: 링크트리 공유 기능 구현
    alert('링크트리 공유 기능은 준비 중입니다')
  }

  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Pretendard Variable, Pretendard, sans-serif' }}>
            Wonderwall
          </h1>
          <p className="text-base text-gray-500">
            당신의 관심사가 만들어낸 아름다운 초상화
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* 생성 버튼 */}
        {!essay && !isGenerating && (
          <div className="text-center mb-16">
            <button
              onClick={handleGenerate}
              disabled={!keywords}
              className="px-10 py-4 text-base font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Pretendard Variable, Pretendard, sans-serif' }}
            >
              {keywords ? '나의 Wonderwall 만들기' : '키워드가 없습니다'}
            </button>
            {!keywords && (
              <p className="mt-4 text-sm text-gray-500">
                먼저 관심사 분석을 완료해주세요
              </p>
            )}
          </div>
        )}

        {/* 생성 중 표시 */}
        {isGenerating && (
          <div className="text-center mb-16">
            <p className="text-base text-gray-600" style={{ fontFamily: 'Pretendard Variable, Pretendard, sans-serif' }}>
              AI가 당신의 Wonderwall을 작성하고 있습니다...
            </p>
          </div>
        )}


        {/* 에세이 결과 */}
        {essay && (
          <div className="mb-12">
            <div className="bg-white px-12 py-16 rounded-lg shadow-sm border border-gray-100">
              <style jsx>{`
                .essay-content {
                  font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
                  font-size: 18px;
                  line-height: 2.2;
                  color: #1a1a1a;
                  letter-spacing: -0.02em;
                }

                .essay-content h1,
                .essay-content h2,
                .essay-content h3 {
                  font-weight: 700;
                  margin-top: 2.5em;
                  margin-bottom: 1em;
                  line-height: 1.4;
                }

                .essay-content h1 {
                  font-size: 28px;
                }

                .essay-content h2 {
                  font-size: 24px;
                }

                .essay-content h3 {
                  font-size: 20px;
                }

                .essay-content p {
                  margin-bottom: 1.8em;
                }

                .essay-content strong {
                  font-weight: 600;
                  color: #000;
                }
              `}</style>
              <div
                className="essay-content"
                dangerouslySetInnerHTML={{
                  __html: essay
                    .split('\n\n')
                    .map((para, i) => {
                      // 숫자로 시작하는 줄은 제목으로 처리
                      if (para.match(/^[0-9]+[).]\s/)) {
                        return `<h2>${para}</h2>`
                      }
                      // **로 감싸진 텍스트는 섹션 제목
                      if (para.match(/^\*\*.+\*\*$/)) {
                        return `<h3>${para.replace(/\*\*/g, '')}</h3>`
                      }
                      // 일반 단락
                      return para.trim() ? `<p>${para}</p>` : ''
                    })
                    .join('')
                }}
              />
            </div>
          </div>
        )}

        {/* 공유 버튼 */}
        {isComplete && essay && (
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleShareLink}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              style={{ fontFamily: 'Pretendard Variable, Pretendard, sans-serif' }}
            >
              링크 공유하기
            </button>
            <button
              onClick={handleShareLinktree}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              style={{ fontFamily: 'Pretendard Variable, Pretendard, sans-serif' }}
            >
              링크트리 공유하기
            </button>
          </div>
        )}

        {/* 뒤로 가기 버튼 */}
        <div className="text-center mt-12">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 underline"
          >
            ← 돌아가기
          </button>
        </div>
      </div>
    </div>
  )
}
