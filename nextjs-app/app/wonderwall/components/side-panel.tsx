'use client'

import { useEffect } from 'react'

interface ChatSession {
  id: string
  title: string
  date: string
}

interface SidePanelProps {
  isOpen: boolean
  onClose: () => void
  sessions: ChatSession[]
  onSelectSession: (session: ChatSession) => void
}

const MOCK_SESSIONS: ChatSession[] = [
  { id: '1', title: '음악 취향에 대한 이야기', date: '오늘' },
  { id: '2', title: '여행 브이로그 이야기', date: '어제' },
  { id: '3', title: '요리 영상에 대해서', date: '2일 전' },
  { id: '4', title: '운동 루틴 공유', date: '3일 전' },
  { id: '5', title: '독서 추천 대화', date: '1주 전' },
]

export default function SidePanel({ isOpen, onClose, sessions, onSelectSession }: SidePanelProps) {
  const displaySessions = sessions.length > 0 ? sessions : MOCK_SESSIONS

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sliding panel */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-[#1a1a1a] z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-label="이전 대화 세션"
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#2a2a2a]">
          <h2 className="text-base font-medium text-[#e0e0e0]">
            대화 기록
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2a2a2a] transition-colors"
            aria-label="메뉴 닫기"
          >
            <svg className="w-5 h-5 text-[#a0a0a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* New chat button */}
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={onClose}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#2a2a2a] hover:bg-[#333333] text-[#e0e0e0] text-sm transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 대화
          </button>
        </div>

        {/* Session list */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <div className="flex flex-col gap-0.5">
            {displaySessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session)}
                className="flex flex-col gap-0.5 px-4 py-3 rounded-xl text-left hover:bg-[#2a2a2a] transition-colors group"
              >
                <span className="text-sm text-[#d0d0d0] group-hover:text-[#e8e8e8] line-clamp-1 transition-colors">
                  {session.title}
                </span>
                <span className="text-xs text-[#606060]">
                  {session.date}
                </span>
              </button>
            ))}
          </div>
        </nav>
      </aside>
    </>
  )
}
