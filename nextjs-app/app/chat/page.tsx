'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatSession {
  id: string
  title: string
  preview: string
  date: string
}

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [essay, setEssay] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 채팅 히스토리 (플레이스홀더)
  const [chatHistory] = useState<ChatSession[]>([
    { id: '1', title: '자아 발견 여정', preview: '너에 대해 알게 해줘서 고마워...', date: '오늘' },
    { id: '2', title: '관심사 탐색', preview: '어떤 영상을 좋아하는지...', date: '어제' },
    { id: '3', title: '가치관 대화', preview: '네가 중요하게 생각하는...', date: '2일 전' },
  ])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const savedEssay = localStorage.getItem('wonderwallEssay')
    if (savedEssay) {
      setEssay(savedEssay)
    }

    if (!isInitialized) {
      setIsInitialized(true)
      initializeChat(savedEssay || '')
    }
  }, [])

  // 메시지가 오면 웰컴 화면 숨기기
  useEffect(() => {
    if (messages.length > 0) {
      setShowWelcome(false)
    }
  }, [messages])

  const initializeChat = async (essayContent: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [],
          essay: essayContent,
          isInitial: true,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to initialize chat')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) return

      let assistantMessage = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line)
              if (data.text) {
                assistantMessage += data.text
                setMessages([{ role: 'assistant', content: assistantMessage }])
              }
            } catch (e) {
              // JSON 파싱 실패 무시
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error)
      setMessages([{
        role: 'assistant',
        content: '너에 대해 알게 해줘서 고마워. 나의 역할은 너의 자아를 발견하는 여정을 함께할 동반자야. 여정이 끝날때 즈음이면, 우리는 서로를 더 잘 알게 될거고, 너와 비슷한 영혼을 가진 사람을 발견하게 될거야. 그렇게 우리의 세계가 확장되는거지. 어때? 나와 함께 이 여행을 시작해 볼래?'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')

    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          essay: essay,
          isInitial: false,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) return

      let assistantMessage = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line)
              if (data.text) {
                assistantMessage += data.text
                setMessages([...newMessages, { role: 'assistant', content: assistantMessage }])
              }
            } catch (e) {
              // JSON 파싱 실패 무시
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages([...newMessages, { role: 'assistant', content: '죄송해요, 메시지를 처리하는 중에 오류가 발생했어요. 다시 시도해 주세요.' }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleSuggestionClick = useCallback((text: string) => {
    setInput(text)
    // 자동 전송
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent
      setInput('')
      const newMessages: Message[] = [...messages, { role: 'user', content: text }]
      setMessages(newMessages)
      setIsLoading(true)

      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          essay: essay,
          isInitial: false,
        }),
      }).then(async (response) => {
        if (!response.ok) throw new Error('Failed')
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        if (!reader) return

        let assistantMessage = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line)
                if (data.text) {
                  assistantMessage += data.text
                  setMessages([...newMessages, { role: 'assistant', content: assistantMessage }])
                }
              } catch (e) {}
            }
          }
        }
      }).catch(() => {
        setMessages([...newMessages, { role: 'assistant', content: '죄송해요, 메시지를 처리하는 중에 오류가 발생했어요. 다시 시도해 주세요.' }])
      }).finally(() => {
        setIsLoading(false)
      })
    }, 0)
  }, [messages, essay])

  // 텍스트 영역 자동 높이 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  return (
    <div className="flex flex-col h-screen bg-[#131314] relative md:pt-14 pb-16 md:pb-0">
      {/* 사이드바 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 - 채팅 히스토리 */}
      <div
        className={`fixed top-0 left-0 h-full w-[300px] bg-[#1e1f20] z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-base font-semibold text-white">대화 기록</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 새 대화 버튼 */}
        <div className="p-3">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#131314] hover:bg-white/10 text-white text-sm transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 대화 시작
          </button>
        </div>

        {/* 대화 목록 */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <p className="text-xs text-gray-500 px-3 py-2 font-medium">최근 대화</p>
          {chatHistory.map((session) => (
            <button
              key={session.id}
              className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/10 transition-colors group mb-1"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-white font-medium truncate">{session.title}</p>
                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{session.date}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1 truncate">{session.preview}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 헤더 */}
      <div className="flex-shrink-0 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          {/* 햄버거 메뉴 */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* 타이틀 */}
          <h1 className="text-lg font-semibold text-white tracking-tight">
            Wonderwall
          </h1>

          {/* 프로필 아바타 */}
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold hover:opacity-90 transition-opacity"
          >
            W
          </button>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* 웰컴 화면 */}
          {showWelcome && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fadeIn">
              {/* 에이전트 아바타 */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 flex items-center justify-center mb-8 shadow-lg shadow-purple-500/20">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              </div>

              {/* 인사 텍스트 */}
              <h2 className="text-3xl font-bold text-white mb-2 text-center">
                안녕하세요
              </h2>
              <p className="text-xl text-gray-400 mb-10 text-center">
                무엇을 도와드릴까요?
              </p>

              {/* 제안 칩 */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                <button
                  onClick={() => handleSuggestionClick('나에 대해 알려줘')}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-[#1e1f20] hover:bg-[#2a2b2d] border border-white/5 text-left transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">나에 대해 알려줘</p>
                    <p className="text-xs text-gray-500 mt-1">에세이 기반 분석</p>
                  </div>
                </button>

                <button
                  onClick={() => handleSuggestionClick('내 관심사가 뭐야?')}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-[#1e1f20] hover:bg-[#2a2b2d] border border-white/5 text-left transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">내 관심사가 뭐야?</p>
                    <p className="text-xs text-gray-500 mt-1">좋아요 영상 분석</p>
                  </div>
                </button>

                <button
                  onClick={() => handleSuggestionClick('여행을 시작해볼래')}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-[#1e1f20] hover:bg-[#2a2b2d] border border-white/5 text-left transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">여행을 시작해볼래</p>
                    <p className="text-xs text-gray-500 mt-1">자아 발견 여정</p>
                  </div>
                </button>

                <button
                  onClick={() => handleSuggestionClick('나와 맞는 사람은 어떤 사람이야?')}
                  className="flex items-start gap-3 p-4 rounded-2xl bg-[#1e1f20] hover:bg-[#2a2b2d] border border-white/5 text-left transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">나와 맞는 사람은?</p>
                    <p className="text-xs text-gray-500 mt-1">이상형 분석</p>
                  </div>
                </button>
              </div>

              {/* 로딩 중 표시 */}
              {isLoading && (
                <div className="mt-8 flex items-center gap-2 text-gray-400">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-sm">대화를 준비하고 있어요</span>
                </div>
              )}
            </div>
          )}

          {/* 메시지 목록 */}
          {!showWelcome && (
            <div className="py-6 space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 animate-fadeIn ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {/* 어시스턴트 아바타 */}
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </div>
                  )}

                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-[#1e1f20] text-white'
                        : 'text-[#e3e3e3]'
                    }`}
                  >
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {/* 타이핑 인디케이터 */}
              {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                <div className="flex gap-3 justify-start animate-fadeIn">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  </div>
                  <div className="py-3">
                    <div className="flex space-x-1.5">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 bg-[#1e1f20] rounded-[28px] px-4 py-2 border border-white/5 focus-within:border-white/20 transition-colors">
            {/* 첨부 버튼 (장식용) */}
            <button
              type="button"
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요"
              className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none text-[15px] py-2.5"
              style={{
                minHeight: '24px',
                maxHeight: '120px'
              }}
              rows={1}
              disabled={isLoading}
            />

            {/* 전송 버튼 */}
            {input.trim() ? (
              <button
                type="submit"
                disabled={isLoading}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white text-black rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </button>
            )}
          </div>
          <p className="text-[11px] text-gray-600 text-center mt-2">
            대화 내용은 서버에 저장되지 않으며, 학습에 사용되지 않습니다
          </p>
        </form>
      </div>
    </div>
  )
}
