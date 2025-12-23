import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'

interface UserPageProps {
  params: Promise<{
    handle: string
  }>
}

export default async function UserPage({ params }: UserPageProps) {
  const { handle } = await params

  // @ 제거 (URL에서 @park.sangsik로 오면 park.sangsik만 추출)
  const cleanHandle = handle.replace(/^@/, '')

  const supabase = await createClient()

  // 사용자 정보 조회
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, handle')
    .eq('handle', cleanHandle)
    .single()

  if (error || !user) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* 프로필 헤더 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {user.handle.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  @{user.handle}
                </h1>
                <p className="text-gray-600 mt-1">{user.email}</p>
              </div>
            </div>
          </div>

          {/* YouTube 구독 분석 영역 */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              YouTube 구독 분석
            </h2>

            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                곧 구독 분석 기능이 추가됩니다!
              </h3>
              <p className="text-gray-600">
                YouTube 구독 채널을 분석하고 인사이트를 제공할 예정입니다.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">-</div>
                <div className="text-sm text-gray-600">구독 채널</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">-</div>
                <div className="text-sm text-gray-600">카테고리</div>
              </div>
              <div className="bg-pink-50 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-pink-600 mb-2">-</div>
                <div className="text-sm text-gray-600">총 조회수</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
