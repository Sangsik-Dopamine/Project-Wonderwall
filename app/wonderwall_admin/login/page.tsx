'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/wonderwall_admin')
      } else {
        setError(data.error || '로그인 실패')
      }
    } catch {
      setError('로그인 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-md">
        <div className="card-surface p-8 md:p-10">
          <div className="text-center mb-10">
            <p
              className="text-[11px] tracking-[0.3em] uppercase mb-4"
              style={{ color: 'var(--foreground-muted)' }}
            >
              Admin
            </p>
            <h1
              className="text-2xl font-extralight tracking-tight"
              style={{ color: 'var(--foreground)' }}
            >
              로그인
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                className="block text-xs font-medium mb-2 tracking-wide"
                style={{ color: 'var(--foreground-secondary)' }}
              >
                ID
              </label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="input-dark"
                placeholder="아이디 입력"
                required
              />
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-2 tracking-wide"
                style={{ color: 'var(--foreground-secondary)' }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-dark"
                placeholder="비밀번호 입력"
                required
              />
            </div>

            {error && (
              <div className="text-sm text-center" style={{ color: '#f87171' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
