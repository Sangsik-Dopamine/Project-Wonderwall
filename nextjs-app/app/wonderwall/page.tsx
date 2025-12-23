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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Wonderwall
          </h1>
          <p className="text-xl text-gray-600">
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
          <div className="text-center mb-12">
            <button
              onClick={handleGenerate}
              disabled={!keywords}
              className="px-12 py-6 text-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-2xl hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {keywords ? '나의 Wonderwall 만들기 ✨' : '키워드가 없습니다'}
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
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-white rounded-xl shadow-lg">
              <svg
                className="animate-spin h-6 w-6 text-purple-600"
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
              <span className="text-lg font-semibold text-gray-700">
                AI가 당신의 Wonderwall을 그리고 있습니다...
              </span>
            </div>
          </div>
        )}

        {/* AI 사고 과정 */}
        {thoughts && (
          <div className="mb-8 p-6 bg-white rounded-xl shadow-lg border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-2xl">🧠</div>
              <h3 className="text-lg font-bold text-gray-900">AI 사고 과정</h3>
            </div>
            <div className="bg-blue-50 rounded-lg p-6 max-h-64 overflow-y-auto">
              <div className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                {thoughts}
              </div>
            </div>
          </div>
        )}

        {/* 에세이 결과 */}
        {essay && (
          <div className="mb-8">
            <div className="p-8 bg-white rounded-2xl shadow-2xl border-2 border-purple-200">
              <div className="prose prose-lg max-w-none">
                <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {essay}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 공유 버튼 */}
        {isComplete && essay && (
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleShareLink}
              className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow-lg hover:from-blue-700 hover:to-cyan-700 transition-all transform hover:scale-105"
            >
              🔗 링크 공유하기
            </button>
            <button
              onClick={handleShareLinktree}
              className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105"
            >
              🌳 링크트리 공유하기
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
