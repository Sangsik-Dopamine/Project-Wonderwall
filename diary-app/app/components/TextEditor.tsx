'use client'

interface TextEditorProps {
  date: string
  content: string
  onChange: (content: string) => void
  onSave: () => void
  isSaving: boolean
  lastSaved: string | null
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
  const weekday = weekdays[date.getDay()]
  return `${year}년 ${month}월 ${day}일 ${weekday}`
}

export default function TextEditor({ date, content, onChange, onSave, isSaving, lastSaved }: TextEditorProps) {
  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-8 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <h2
          className="text-lg font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          {formatDisplayDate(date)}
        </h2>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {lastSaved}
            </span>
          )}
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
            style={{
              background: 'var(--accent)',
              color: 'var(--bg-primary)',
            }}
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-8">
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="오늘 하루를 기록해보세요..."
          className="w-full h-full resize-none outline-none text-[15px] leading-relaxed"
          style={{
            background: 'transparent',
            color: 'var(--text-primary)',
          }}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
              e.preventDefault()
              onSave()
            }
          }}
        />
      </div>
    </div>
  )
}
