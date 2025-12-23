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
    } catch (err) {
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

  // 핸들 변경 시 디바운스 적용하여 중복 확인
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
    } catch (err) {
      setError('네트워크 오류가 발생했습니다')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            환영합니다! 🎉
          </h1>
          <p className="text-gray-600">
            사용하실 핸들(아이디)을 설정해주세요
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="handle"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              핸들 (Handle)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                @
              </span>
              <input
                type="text"
                id="handle"
                value={handle}
                onChange={handleChange}
                className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="your_handle"
                minLength={3}
                maxLength={20}
                required
              />
            </div>

            <div className="mt-2 min-h-[20px]">
              {isChecking && (
                <p className="text-sm text-gray-500">확인 중...</p>
              )}
              {!isChecking && isAvailable === true && handle.length >= 3 && (
                <p className="text-sm text-green-600">✓ 사용 가능한 핸들입니다</p>
              )}
              {!isChecking && isAvailable === false && (
                <p className="text-sm text-red-600">✗ 이미 사용 중인 핸들입니다</p>
              )}
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>
          </div>

          <div className="mb-6 p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-800 font-medium mb-2">
              핸들 규칙:
            </p>
            <ul className="text-xs text-purple-700 space-y-1">
              <li>• 3~20자 사이</li>
              <li>• 영문 소문자, 숫자, 언더스코어(_)만 사용 가능</li>
              <li>• 나중에 변경할 수 없습니다</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={!handle || handle.length < 3 || isAvailable === false || isChecking}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            시작하기
          </button>
        </form>

        <p className="mt-4 text-xs text-gray-500 text-center">
          설정한 핸들은 프로필 URL로 사용됩니다 (@{handle || 'your_handle'})
        </p>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
          <div className="text-center">
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
