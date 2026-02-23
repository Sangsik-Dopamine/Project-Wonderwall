'use client'

import { useEffect, useState } from 'react'

interface LikedVideo {
  videoId: string
  title: string
  channelTitle: string
  likedAt: string
}

function formatLikedDate(dateStr: string): string {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}/${day}`
}

export default function LikedVideosSidebar() {
  const [videos, setVideos] = useState<LikedVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLikedVideos() {
      try {
        const res = await fetch('/api/liked-videos')
        if (!res.ok) {
          if (res.status === 401) {
            setError('로그인이 필요합니다')
          } else {
            setError('동영상을 불러오지 못했습니다')
          }
          return
        }
        const data = await res.json()
        setVideos(data.videos || [])
      } catch {
        setError('네트워크 오류')
      } finally {
        setLoading(false)
      }
    }

    fetchLikedVideos()
  }, [])

  return (
    <div className="h-full flex flex-col">
      <div
        className="px-4 py-3 text-xs font-medium shrink-0"
        style={{
          color: 'var(--text-muted)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        좋아요한 동영상 (최근 3개월)
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div
            className="px-4 py-6 text-xs text-center"
            style={{ color: 'var(--text-muted)' }}
          >
            불러오는 중...
          </div>
        ) : error ? (
          <div
            className="px-4 py-6 text-xs text-center"
            style={{ color: 'var(--text-muted)' }}
          >
            {error}
          </div>
        ) : videos.length === 0 ? (
          <div
            className="px-4 py-6 text-xs text-center"
            style={{ color: 'var(--text-muted)' }}
          >
            좋아요한 동영상이 없습니다
          </div>
        ) : (
          <div className="py-1">
            {videos.map((video) => (
              <a
                key={video.videoId}
                href={`https://www.youtube.com/watch?v=${video.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2.5 transition-colors"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <div
                  className="text-sm leading-snug mb-1 line-clamp-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {video.title}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[11px]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {video.channelTitle}
                  </span>
                  <span
                    className="text-[11px]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {formatLikedDate(video.likedAt)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
