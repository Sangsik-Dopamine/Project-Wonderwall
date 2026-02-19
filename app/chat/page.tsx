'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [essay, setEssay] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
            } catch {
              // ignore
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
            } catch {
              // ignore
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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div
        className="flex-shrink-0 px-6 py-5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-sm transition-colors duration-200"
            style={{ color: 'var(--foreground-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--foreground-muted)')}
          >
            {'<-'} 돌아가기
          </button>
          <h1
            className="text-base font-light tracking-wide"
            style={{ color: 'var(--foreground)' }}
          >
            나를 이해하는 에이전트
          </h1>
          <div className="w-20" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-5">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[80%] rounded-2xl px-5 py-3.5"
                style={
                  message.role === 'user'
                    ? { background: 'var(--foreground)', color: 'var(--background)' }
                    : { background: 'var(--background-surface)', color: 'var(--foreground)', border: '1px solid var(--border)' }
                }
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <div className="flex justify-start">
              <div
                className="rounded-2xl px-5 py-3.5"
                style={{ background: 'var(--background-surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--foreground-muted)', animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--foreground-muted)', animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--foreground-muted)', animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div
        className="flex-shrink-0 px-6 py-5"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div
            className="flex items-end gap-3 rounded-2xl px-5 py-3.5"
            style={{
              background: 'var(--background-surface)',
              border: '1px solid var(--border)',
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요..."
              className="flex-1 bg-transparent resize-none focus:outline-none text-sm"
              style={{
                color: 'var(--foreground)',
                minHeight: '24px',
                maxHeight: '120px',
              }}
              rows={1}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: 'var(--foreground)',
                color: 'var(--background)',
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p
            className="text-xs text-center mt-3"
            style={{ color: 'var(--foreground-muted)' }}
          >
            대화 내용은 서버에 저장되지 않으며, 학습에 사용되지 않습니다.
          </p>
        </form>
      </div>
    </div>
  )
}
