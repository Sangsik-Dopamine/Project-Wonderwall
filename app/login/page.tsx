'use client'

import { getGoogleOAuthURL } from '@/lib/google-oauth'

export default function LoginPage() {
  const handleGoogleLogin = () => {
    const authUrl = getGoogleOAuthURL()
    window.location.href = authUrl
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--background)' }}>
      {/* Ambient glow */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none animate-[glow-pulse_5s_ease-in-out_infinite]"
        style={{
          background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="card-surface p-8 md:p-10">
          <div className="text-center mb-10">
            <p
              className="text-[11px] tracking-[0.3em] uppercase mb-4"
              style={{ color: 'var(--foreground-muted)' }}
            >
              Welcome to
            </p>
            <h1
              className="text-3xl font-extralight tracking-tight mb-3"
              style={{ color: 'var(--foreground)' }}
            >
              Wonderwall
            </h1>
            <p
              className="text-sm"
              style={{ color: 'var(--foreground-secondary)' }}
            >
              당신의 관심사가 만들어낸 아름다운 초상화
            </p>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-medium transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.08)]"
            style={{
              background: 'var(--background-elevated)',
              border: '1px solid var(--border-hover)',
              color: 'var(--foreground)',
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-sm">Google로 로그인</span>
          </button>

          <div
            className="mt-8 p-4 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border)',
            }}
          >
            <p
              className="text-xs font-medium mb-2"
              style={{ color: 'var(--foreground-secondary)' }}
            >
              로그인 시 다음 권한을 요청합니다:
            </p>
            <ul
              className="text-xs space-y-1"
              style={{ color: 'var(--foreground-muted)' }}
            >
              <li>{'  '}이메일 주소</li>
              <li>{'  '}프로필 정보</li>
              <li>{'  '}YouTube 구독 목록 조회 (읽기 전용)</li>
            </ul>
          </div>

          <p
            className="mt-6 text-xs text-center"
            style={{ color: 'var(--foreground-muted)' }}
          >
            로그인하시면 서비스 이용약관 및 개인정보 처리방침에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}
