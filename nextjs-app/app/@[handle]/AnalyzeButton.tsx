'use client'

import { useState } from 'react'

export default function AnalyzeButton() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<{
    filename: string
    totalSubscriptions: number
  } | null>(null)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/analyze-interests', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          filename: data.filename,
          totalSubscriptions: data.totalSubscriptions,
        })
      } else {
        setError(data.error || '분석 중 오류가 발생했습니다')
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleDownload = () => {
    if (!result) return

    // JSON 다운로드 API 호출
    window.location.href = `/api/download-analysis?filename=${result.filename}`
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing}
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
            분석 중...
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
        <div className="mt-8 p-6 bg-white rounded-xl shadow-lg border-2 border-purple-200">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">✅</div>
            <h3 className="text-lg font-bold text-gray-900">분석 완료!</h3>
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
      )}
    </div>
  )
}
