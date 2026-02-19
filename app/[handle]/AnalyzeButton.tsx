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
    } catch {
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
      localStorage.setItem('likedVideos', JSON.stringify(data.likedVideosData))
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setIsLoadingLikedVideos(false)
    }
  }

  return (
    <div className="space-y-10">
      {/* Data Collection Section */}
      <section>
        <h2
          className="text-base font-medium mb-1"
          style={{ color: 'var(--foreground)' }}
        >
          데이터 가져오기
        </h2>
        <p
          className="text-sm mb-6"
          style={{ color: 'var(--foreground-muted)' }}
        >
          YouTube에서 데이터를 수집합니다
        </p>

        <div className="space-y-3">
          {/* Subscription button */}
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={handleLoadSubscriptions}
              disabled={isLoadingSubscriptions || isLoadingLikedVideos}
              className="btn-secondary flex items-center gap-2.5 text-sm"
            >
              {isLoadingSubscriptions && <div className="spinner" style={{ width: 16, height: 16 }} />}
              {isLoadingSubscriptions ? '불러오는 중...' : '유튜브에서 구독채널 데이터 불러오기'}
            </button>
            {subscriptionResult && (
              <span className="text-sm" style={{ color: '#4ade80' }}>
                {subscriptionResult.totalSubscriptions}개 채널 완료
              </span>
            )}
          </div>

          {/* Liked videos button */}
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={handleLoadLikedVideos}
              disabled={isLoadingSubscriptions || isLoadingLikedVideos}
              className="btn-secondary flex items-center gap-2.5 text-sm"
            >
              {isLoadingLikedVideos && <div className="spinner" style={{ width: 16, height: 16 }} />}
              {isLoadingLikedVideos ? '불러오는 중...' : '유튜브에서 좋아요한 동영상 목록 불러오기'}
            </button>
            {likedVideosResult && (
              <span className="text-sm" style={{ color: '#4ade80' }}>
                {likedVideosResult.totalVideos}개 동영상 완료
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border)' }} />

      {/* Next Step Section */}
      <section>
        <h2
          className="text-base font-medium mb-1"
          style={{ color: 'var(--foreground)' }}
        >
          다음단계로 진행
        </h2>
        <p
          className="text-sm mb-6"
          style={{ color: 'var(--foreground-muted)' }}
        >
          수집된 데이터를 기반으로 Wonderwall을 생성합니다
        </p>

        <button
          onClick={() => router.push('/wonderwall')}
          className="btn-primary text-base px-10 py-4"
        >
          나의 &quot;Wonderwall&quot; 만들기
        </button>
      </section>

      {/* Error Message */}
      {error && (
        <div
          className="p-4 rounded-xl text-sm"
          style={{
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.2)',
            color: '#f87171',
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}
