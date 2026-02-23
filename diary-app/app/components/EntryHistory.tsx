'use client'

interface EntryItem {
  entry_date: string
  updated_at: string
}

interface EntryHistoryProps {
  entries: EntryItem[]
  selectedDate: string
  onDateSelect: (date: string) => void
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const weekday = weekdays[date.getDay()]
  return `${month}/${day} (${weekday})`
}

export default function EntryHistory({ entries, selectedDate, onDateSelect }: EntryHistoryProps) {
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div
        className="px-4 py-3 text-xs font-medium"
        style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
      >
        기록 ({entries.length})
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {entries.length === 0 ? (
          <div
            className="px-4 py-6 text-xs text-center"
            style={{ color: 'var(--text-muted)' }}
          >
            아직 작성한 일기가 없습니다
          </div>
        ) : (
          entries.map((entry) => (
            <button
              key={entry.entry_date}
              onClick={() => onDateSelect(entry.entry_date)}
              className="w-full text-left px-4 py-2.5 transition-colors cursor-pointer"
              style={{
                borderBottom: '1px solid var(--border)',
                background: entry.entry_date === selectedDate ? 'var(--bg-sidebar)' : 'transparent',
              }}
            >
              <div
                className="text-sm"
                style={{
                  color: entry.entry_date === selectedDate
                    ? 'var(--text-primary)'
                    : 'var(--text-secondary)',
                  fontWeight: entry.entry_date === selectedDate ? 500 : 400,
                }}
              >
                {formatDisplayDate(entry.entry_date)}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
