'use client'

import { getGoogleOAuthURL } from '@/lib/google-oauth'

export default function LoginPage() {
  const handleLogin = () => {
    window.location.href = getGoogleOAuthURL()
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center max-w-sm mx-auto px-6">
        <h1
          className="text-3xl font-light tracking-tight mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Diary
        </h1>
        <p
          className="text-sm mb-10"
          style={{ color: 'var(--text-muted)' }}
        >
          YouTube 취향이 담긴 나만의 일기장
        </p>

        <button
          onClick={handleLogin}
          className="w-full py-3 px-6 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          style={{
            background: 'var(--accent)',
            color: 'var(--bg-primary)',
          }}
        >
          Google 계정으로 로그인
        </button>

        <p
          className="mt-4 text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          YouTube 좋아요 동영상을 불러오기 위해 Google 로그인이 필요합니다
        </p>
      </div>
    </div>
  )
}
