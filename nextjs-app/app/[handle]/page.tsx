import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import AnalyzeButton from './AnalyzeButton'

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
          {/* 분석 버튼 영역 */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <AnalyzeButton />
          </div>
        </div>
      </div>
    </div>
  )
}
