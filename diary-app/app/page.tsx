'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Calendar from './components/Calendar'
import EntryHistory from './components/EntryHistory'
import TextEditor from './components/TextEditor'
import LikedVideosSidebar from './components/LikedVideosSidebar'

interface EntryItem {
  entry_date: string
  updated_at: string
}

function getTodayString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export default function DiaryPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(getTodayString())
  const [content, setContent] = useState('')
  const [entries, setEntries] = useState<EntryItem[]>([])
  const [entryDates, setEntryDates] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  // 인증 확인
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/me')
        if (res.ok) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
          router.push('/login')
        }
      } catch {
        setIsAuthenticated(false)
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  // 엔트리 날짜 목록 로드
  const loadEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/entries')
      if (res.ok) {
        const data = await res.json()
        setEntries(data.entries || [])
        setEntryDates(new Set((data.entries || []).map((e: EntryItem) => e.entry_date)))
      }
    } catch {
      console.error('Failed to load entries')
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadEntries()
    }
  }, [isAuthenticated, loadEntries])

  // 선택한 날짜의 일기 로드
  useEffect(() => {
    if (!isAuthenticated) return

    async function loadEntry() {
      try {
        const res = await fetch(`/api/entries?date=${selectedDate}`)
        if (res.ok) {
          const data = await res.json()
          setContent(data.entry?.content || '')
          setLastSaved(null)
        }
      } catch {
        console.error('Failed to load entry')
      }
    }
    loadEntry()
  }, [selectedDate, isAuthenticated])

  // 저장
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, content }),
      })

      if (res.ok) {
        const now = new Date()
        setLastSaved(
          `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} 저장됨`
        )
        await loadEntries()
      }
    } catch {
      console.error('Failed to save entry')
    } finally {
      setIsSaving(false)
    }
  }

  if (isAuthenticated === null) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          로딩 중...
        </span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* 좌측 패널: 캘린더 + 기록 리스트 */}
      <div
        className="w-64 shrink-0 flex flex-col h-full"
        style={{
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* 앱 타이틀 */}
        <div
          className="px-4 py-3"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h1
            className="text-base font-semibold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Diary
          </h1>
        </div>

        {/* 캘린더 */}
        <div style={{ borderBottom: '1px solid var(--border)' }}>
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            entryDates={entryDates}
          />
        </div>

        {/* 엔트리 히스토리 */}
        <EntryHistory
          entries={entries}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
      </div>

      {/* 중앙: 텍스트 에디터 */}
      <div className="flex-1 flex flex-col min-w-0" style={{ background: 'var(--bg-secondary)' }}>
        <TextEditor
          date={selectedDate}
          content={content}
          onChange={setContent}
          onSave={handleSave}
          isSaving={isSaving}
          lastSaved={lastSaved}
        />
      </div>

      {/* 우측 사이드바: 좋아요 동영상 */}
      <div
        className="w-72 shrink-0 h-full"
        style={{
          background: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border)',
        }}
      >
        <LikedVideosSidebar />
      </div>
    </div>
  )
}
