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
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setError('')
    setResult(null)
    setKeywords('')

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

      // 2. Gemini API로 키워드 추출
      setIsExtractingKeywords(true)

      const keywordResponse = await fetch('/api/analyze-keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionData: data.subscriptionData,
        }),
      })

      const keywordData = await keywordResponse.json()

      if (keywordResponse.ok) {
        setKeywords(keywordData.keywords)
      } else {
        setError(keywordData.error || '키워드 추출 중 오류가 발생했습니다')
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setIsAnalyzing(false)
      setIsExtractingKeywords(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    window.location.href = `/api/download-analysis?filename=${result.filename}`
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

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-1">저장된 파일:</p>
              <p className="text-sm font-mono text-gray-900 break-all">
                {result.filename}
              </p>
            </div>

            <button
              onClick={handleDownload}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              📥 JSON 파일 다운로드
            </button>
          </div>

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
