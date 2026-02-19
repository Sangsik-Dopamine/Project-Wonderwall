'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'

function OnboardingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const defaultHandle = searchParams.get('handle') || ''

  const [handle, setHandle] = useState(defaultHandle)
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setHandle(defaultHandle)
  }, [defaultHandle])

  const checkHandleAvailability = async (handleToCheck: string) => {
    if (!handleToCheck || handleToCheck.length < 3) {
      setIsAvailable(null)
      return
    }

    setIsChecking(true)
    setError('')

    try {
      const response = await fetch(`/api/check-handle?handle=${handleToCheck}`)
      const data = await response.json()

      if (response.ok) {
        setIsAvailable(data.available)
      } else {
        setError(data.error || '핸들 확인 중 오류가 발생했습니다')
        setIsAvailable(null)
      }
    } catch {
      setError('네트워크 오류가 발생했습니다')
      setIsAvailable(null)
    } finally {
      setIsChecking(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHandle = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 20)

    setHandle(newHandle)
  }

  useEffect(() => {
    if (handle === defaultHandle) {
      setIsAvailable(true)
      return
    }

    if (!handle || handle.length < 3) {
      setIsAvailable(null)
      return
    }

    const timeoutId = setTimeout(() => {
      checkHandleAvailability(handle)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [handle, defaultHandle])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!handle || handle.length < 3) {
      setError('핸들은 최소 3자 이상이어야 합니다')
      return
    }

    if (isAvailable === false) {
      setError('이미 사용 중인 핸들입니다')
      return
    }

    try {
      const response = await fetch('/api/update-handle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ handle }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/@${handle}`)
      } else {
        setError(data.error || '핸들 업데이트 중 오류가 발생했습니다')
      }
    } catch {
      setError('네트워크 오류가 발생했습니다')
    }
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
              Setup
            </p>
            <h1
              className="text-3xl font-extralight tracking-tight mb-3"
              style={{ color: 'var(--foreground)' }}
            >
              환영합니다
            </h1>
            <p
              className="text-sm"
              style={{ color: 'var(--foreground-secondary)' }}
            >
              사용하실 핸들(아이디)을 설정해주세요
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                htmlFor="handle"
                className="block text-xs font-medium mb-2 tracking-wide"
                style={{ color: 'var(--foreground-secondary)' }}
              >
                핸들 (Handle)
              </label>
              <div className="relative">
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: 'var(--foreground-muted)' }}
                >
                  @
                </span>
                <input
                  type="text"
                  id="handle"
                  value={handle}
                  onChange={handleChange}
                  className="input-dark pl-9"
                  placeholder="your_handle"
                  minLength={3}
                  maxLength={20}
                  required
                />
              </div>

              <div className="mt-3 min-h-[20px]">
                {isChecking && (
                  <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                    확인 중...
                  </p>
                )}
                {!isChecking && isAvailable === true && handle.length >= 3 && (
                  <p className="text-xs" style={{ color: '#4ade80' }}>
                    사용 가능한 핸들입니다
                  </p>
                )}
                {!isChecking && isAvailable === false && (
                  <p className="text-xs" style={{ color: '#f87171' }}>
                    이미 사용 중인 핸들입니다
                  </p>
                )}
                {error && (
                  <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
                )}
              </div>
            </div>

            <div
              className="mb-8 p-4 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)',
              }}
            >
              <p
                className="text-xs font-medium mb-2"
                style={{ color: 'var(--foreground-secondary)' }}
              >
                핸들 규칙:
              </p>
              <ul
                className="text-xs space-y-1"
                style={{ color: 'var(--foreground-muted)' }}
              >
                <li>{'  '}3~20자 사이</li>
                <li>{'  '}영문 소문자, 숫자, 언더스코어(_)만 사용 가능</li>
                <li>{'  '}나중에 변경할 수 없습니다</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={!handle || handle.length < 3 || isAvailable === false || isChecking}
              className="btn-primary w-full"
            >
              시작하기
            </button>
          </form>

          <p
            className="mt-6 text-xs text-center"
            style={{ color: 'var(--foreground-muted)' }}
          >
            설정한 핸들은 프로필 URL로 사용됩니다 (@{handle || 'your_handle'})
          </p>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="card-surface p-8 max-w-md w-full">
          <div className="flex items-center justify-center">
            <div className="spinner" />
          </div>
        </div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
