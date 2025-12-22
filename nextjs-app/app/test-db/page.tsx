'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function TestDbPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [message, setMessage] = useState('')
  const [details, setDetails] = useState('')

  useEffect(() => {
    async function testConnection() {
      try {
        // Supabase 연결 테스트: auth.getSession() 호출
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          setStatus('failed')
          setMessage('실패')
          setDetails(`에러: ${error.message}`)
          return
        }

        // 추가 테스트: 간단한 쿼리 실행으로 API 연결 확인
        const { error: healthError } = await supabase
          .from('_health_check')
          .select('*')
          .limit(0)

        // 테이블 관련 에러는 괜찮음 (연결 자체는 성공)
        const isTableError = healthError && (
          healthError.message.includes('does not exist') ||
          healthError.message.includes('Could not find the table') ||
          healthError.code === 'PGRST116' ||
          healthError.code === '42P01'
        )

        if (healthError && !isTableError) {
          setStatus('failed')
          setMessage('실패')
          setDetails(`연결 에러: ${healthError.message}`)
          return
        }

        // 연결 성공
        setStatus('success')
        setMessage('성공')
        setDetails('Supabase와 성공적으로 연결되었습니다!')
      } catch (err) {
        setStatus('failed')
        setMessage('실패')
        setDetails(`예외 발생: ${err instanceof Error ? err.message : '알 수 없는 에러'}`)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Supabase 연결 테스트
        </h1>

        <div className="text-center">
          {status === 'loading' && (
            <div className="text-blue-600 text-xl font-semibold">
              테스트 중...
            </div>
          )}

          {status === 'success' && (
            <div>
              <div className="text-green-600 text-3xl font-bold mb-2">
                ✅ {message}
              </div>
              <p className="text-gray-600 mt-2">{details}</p>
            </div>
          )}

          {status === 'failed' && (
            <div>
              <div className="text-red-600 text-3xl font-bold mb-2">
                ❌ {message}
              </div>
              <p className="text-gray-600 mt-2 text-sm">{details}</p>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded text-sm text-gray-600">
          <p className="font-semibold mb-2">연결 정보:</p>
          <p className="break-all">
            URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || '설정 안됨'}
          </p>
          <p className="mt-1">
            API Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '설정됨' : '설정 안됨'}
          </p>
        </div>

        <div className="mt-4 text-center">
          <a
            href="/"
            className="text-blue-600 hover:underline"
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  )
}
