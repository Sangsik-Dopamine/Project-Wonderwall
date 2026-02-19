import { createAdminClient } from '@/utils/supabase/admin'
import { notFound } from 'next/navigation'
import AnalyzeButton from './AnalyzeButton'

interface UserPageProps {
  params: Promise<{
    handle: string
  }>
}

export default async function UserPage({ params }: UserPageProps) {
  const { handle } = await params

  const cleanHandle = handle.replace(/^@/, '')

  const adminClient = createAdminClient()

  const { data: user, error } = await adminClient
    .from('users')
    .select('id, email, handle')
    .eq('handle', cleanHandle)
    .single()

  if (error || !user) {
    notFound()
  }

  return (
    <div className="min-h-screen px-6 py-16" style={{ background: 'var(--background)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <p
            className="text-[11px] tracking-[0.3em] uppercase mb-3"
            style={{ color: 'var(--foreground-muted)' }}
          >
            Profile
          </p>
          <h1
            className="text-3xl font-extralight tracking-tight"
            style={{ color: 'var(--foreground)' }}
          >
            @{user.handle}
          </h1>
        </div>

        {/* Content card */}
        <div className="card-surface p-8 md:p-10">
          <AnalyzeButton />
        </div>
      </div>
    </div>
  )
}
