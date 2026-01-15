'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AnalyzeButton() {
  const router = useRouter()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isExtractingKeywords, setIsExtractingKeywords] = useState(false)
  const [result, setResult] = useState<{
    filename: string
    totalSubscriptions: number
    subscriptionData?: any
  } | null>(null)
  const [keywords, setKeywords] = useState('')
  const [thoughts, setThoughts] = useState('') // AI 사고 과정
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setError('')
    setResult(null)
    setKeywords('')
    setThoughts('')

    try {
      // 1. JSON 파일 생성 및 저장
      const response = await fetch('/api/analyze-interests', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '분석 중 오류가 발생했습니다')
        setIsAnalyzing(false)
        return
      }

      setResult({
        filename: data.filename,
        totalSubscriptions: data.totalSubscriptions,
        subscriptionData: data.subscriptionData,
      })

      setIsAnalyzing(false)

      // 2. Gemini API로 키워드 추출 (스트리밍)
      setIsExtractingKeywords(true)

      // 타임아웃 설정 (3분)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 180000)

      try {
        const keywordResponse = await fetch('/api/analyze-keywords', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscriptionData: data.subscriptionData,
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!keywordResponse.ok) {
          const errorData = await keywordResponse.json()
          setError(errorData.error || '키워드 추출 중 오류가 발생했습니다')
          setIsExtractingKeywords(false)
          return
        }

        // 스트리밍 응답 처리
        const reader = keywordResponse.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          setError('스트리밍을 시작할 수 없습니다')
          setIsExtractingKeywords(false)
          return
        }

        let accumulatedKeywords = ''
        let accumulatedThoughts = ''
        let buffer = ''
        let lastUpdateTime = Date.now()

        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            console.log('스트리밍 완료!')
            break
          }

          // 청크를 디코딩하여 텍스트로 변환
          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk

          // 개행 문자로 구분된 JSON 파싱
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // 마지막 불완전한 줄은 버퍼에 보관

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line)

                // 사고 과정 누적
                if (data.thoughts) {
                  accumulatedThoughts += data.thoughts
                  setThoughts(accumulatedThoughts)
                }

                // 최종 키워드 누적
                if (data.text) {
                  accumulatedKeywords += data.text
                  setKeywords(accumulatedKeywords)
                  // localStorage에 저장 (Wonderwall 페이지에서 사용)
                  localStorage.setItem('extractedKeywords', accumulatedKeywords)
                }
              } catch (e) {
                console.error('JSON 파싱 에러:', e)
              }
            }
          }

          // 진행 상황 로깅
          const now = Date.now()
          if (now - lastUpdateTime > 1000) {
            console.log('수신된 사고 과정:', accumulatedThoughts.length, '키워드:', accumulatedKeywords.length)
            lastUpdateTime = now
          }
        }
      } catch (streamError: any) {
        console.error('Streaming error:', streamError)
        if (streamError.name === 'AbortError') {
          setError('요청 시간이 초과되었습니다. 채널 수가 너무 많을 수 있습니다.')
        } else {
          setError('스트리밍 중 오류가 발생했습니다: ' + streamError.message)
        }
        setIsExtractingKeywords(false)
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setIsAnalyzing(false)
      setIsExtractingKeywords(false)
    }
  }

  const handleCreateWonderwall = () => {
    router.push('/wonderwall')
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing || isExtractingKeywords}
        className="px-12 py-6 text-xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-2xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isAnalyzing ? (
          <span className="flex items-center gap-3">
            <svg
              className="animate-spin h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            구독 채널 수집 중...
          </span>
        ) : isExtractingKeywords ? (
          <span className="flex items-center gap-3">
            <svg
              className="animate-spin h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            AI로 키워드 추출 중...
          </span>
        ) : (
          '나의 관심사 분석하기'
        )}
      </button>

      {error && (
        <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8 w-full max-w-4xl space-y-6">
          {/* JSON 파일 정보 */}
          <div className="p-6 bg-white rounded-xl shadow-lg border-2 border-purple-200">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="text-lg font-bold text-gray-900">데이터 수집 완료!</h3>
              <p className="text-sm text-gray-600 mt-1">
                총 {result.totalSubscriptions}개의 구독 채널 정보를 수집했습니다
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">저장된 파일:</p>
              <p className="text-sm font-mono text-gray-900 break-all">
                {result.filename}
              </p>
            </div>
          </div>

          {/* AI 사고 과정 (Reasoning) */}
          {thoughts && (
            <div className="p-6 bg-white rounded-xl shadow-lg border-2 border-blue-200">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">🧠</div>
                <h3 className="text-lg font-bold text-gray-900">AI 사고 과정</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Gemini가 생각하는 과정을 실시간으로 확인하세요
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-6 max-h-96 overflow-y-auto">
                <div className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {thoughts}
                </div>
              </div>
            </div>
          )}

          {/* 키워드 추출 결과 */}
          {keywords && (
            <>
              <div className="p-6 bg-white rounded-xl shadow-lg border-2 border-green-200">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">🎯</div>
                  <h3 className="text-lg font-bold text-gray-900">키워드 추출 완료!</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    AI가 분석한 당신의 관심사 키워드
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
                  <div className="text-sm text-gray-800 whitespace-pre-wrap">
                    {keywords}
                  </div>
                </div>
              </div>

              {/* Wonderwall 버튼 */}
              <div className="text-center">
                <button
                  onClick={handleCreateWonderwall}
                  className="px-12 py-6 text-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-2xl hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105"
                >
                  추가 분석 진행하여 나의 Wonderwall 만들기 🚀
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
