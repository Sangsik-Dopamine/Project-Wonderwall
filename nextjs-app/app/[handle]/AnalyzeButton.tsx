'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AnalyzeButton() {
  const router = useRouter()
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false)
  const [isLoadingLikedVideos, setIsLoadingLikedVideos] = useState(false)
  const [subscriptionResult, setSubscriptionResult] = useState<{ totalSubscriptions: number } | null>(null)
  const [likedVideosResult, setLikedVideosResult] = useState<{ totalVideos: number } | null>(null)
  const [error, setError] = useState('')

  const handleLoadSubscriptions = async () => {
    setIsLoadingSubscriptions(true)
    setError('')

    try {
      const response = await fetch('/api/analyze-interests', { method: 'POST' })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '구독채널 데이터 불러오기 중 오류가 발생했습니다')
        return
      }

      setSubscriptionResult({ totalSubscriptions: data.totalSubscriptions })
    } catch (err) {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setIsLoadingSubscriptions(false)
    }
  }

  const handleLoadLikedVideos = async () => {
    setIsLoadingLikedVideos(true)
    setError('')

    try {
      const response = await fetch('/api/analyze-liked-videos', { method: 'POST' })
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '좋아요한 동영상 목록 불러오기 중 오류가 발생했습니다')
        return
      }

      setLikedVideosResult({ totalVideos: data.totalVideos })
      // localStorage에 저장 (Wonderwall 페이지에서 사용)
      localStorage.setItem('likedVideos', JSON.stringify(data.likedVideosData))
    } catch (err) {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setIsLoadingLikedVideos(false)
    }
  }

  const Spinner = () => (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )

  return (
    <div className="space-y-10">
      {/* 데이터 가져오기 섹션 */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'Pretendard Variable, Pretendard, sans-serif' }}>
          데이터 가져오기
        </h2>
        <p className="text-sm text-gray-500 mb-5">YouTube에서 데이터를 수집합니다</p>

        <div className="space-y-3">
          {/* 구독채널 버튼 */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleLoadSubscriptions}
              disabled={isLoadingSubscriptions || isLoadingLikedVideos}
              className="flex items-center gap-2 px-5 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Pretendard Variable, Pretendard, sans-serif' }}
            >
              {isLoadingSubscriptions && <Spinner />}
              {isLoadingSubscriptions ? '불러오는 중...' : '유튜브에서 구독채널 데이터 불러오기'}
            </button>
            {subscriptionResult && (
              <span className="text-sm text-green-600 font-medium">
                {subscriptionResult.totalSubscriptions}개 채널 완료
              </span>
            )}
          </div>

          {/* 좋아요 동영상 버튼 */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleLoadLikedVideos}
              disabled={isLoadingSubscriptions || isLoadingLikedVideos}
              className="flex items-center gap-2 px-5 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Pretendard Variable, Pretendard, sans-serif' }}
            >
              {isLoadingLikedVideos && <Spinner />}
              {isLoadingLikedVideos ? '불러오는 중...' : '유튜브에서 좋아요한 동영상 목록 불러오기'}
            </button>
            {likedVideosResult && (
              <span className="text-sm text-green-600 font-medium">
                {likedVideosResult.totalVideos}개 동영상 완료
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 구분선 */}
      <hr className="border-gray-200" />

      {/* 다음단계로 진행 섹션 */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'Pretendard Variable, Pretendard, sans-serif' }}>
          다음단계로 진행
        </h2>
        <p className="text-sm text-gray-500 mb-5">수집된 데이터를 기반으로 Wonderwall을 생성합니다</p>

        <button
          onClick={() => router.push('/wonderwall')}
          className="px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
          style={{ fontFamily: 'Pretendard Variable, Pretendard, sans-serif' }}
        >
          나의 &quot;Wonderwall&quot; 만들기
        </button>
      </section>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  )
}
