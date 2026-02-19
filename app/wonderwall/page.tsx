'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface LikedVideo {
  videoId: string
  title: string
  channelTitle: string
  thumbnail: string
  likedAt: string
}

export default function WonderwallPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [likedVideos, setLikedVideos] = useState<LikedVideo[]>([])
  const [likedVideosText, setLikedVideosText] = useState('')
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
    const savedData = localStorage.getItem('likedVideos')
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        setLikedVideos(parsed.videos || [])

        const videosText = (parsed.videos || [])
          .map((v: LikedVideo, i: number) => `${i + 1}. "${v.title}" (채널: ${v.channelTitle})`)
          .join('\n')
        setLikedVideosText(videosText)
      } catch (e) {
        console.error('Failed to parse liked videos:', e)
      }
    }

    if (!isInitialized) {
      setIsInitialized(true)
      initializeChat(savedData)
    }
  }, [])

  const initializeChat = async (savedData: string | null) => {
    let videosText = ''
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        videosText = (parsed.videos || [])
          .map((v: LikedVideo, i: number) => `${i + 1}. "${v.title}" (채널: ${v.channelTitle})`)
          .join('\n')
      } catch (e) {
        // ignore
      }
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [],
          likedVideos: videosText,
          mode: 'wonderwall',
          isInitial: true,
        }),
      })

      if (!response.ok) throw new Error('Failed to initialize chat')

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
            } catch { /* ignore */ }
          }
        }
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error)
      setMessages([{
        role: 'assistant',
        content: '안녕! 너의 좋아요한 동영상 목록을 보면서 이야기해볼까? 어떤 영상이 제일 기억에 남아?'
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
          likedVideos: likedVideosText,
          mode: 'wonderwall',
          isInitial: false,
        }),
      })

      if (!response.ok) throw new Error('Failed to send message')

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
            } catch { /* ignore */ }
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages([...newMessages, { role: 'assistant', content: '메시지를 처리하는 중에 오류가 발생했어요. 다시 시도해 주세요.' }])
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
    <div className="flex h-screen" style={{ background: 'var(--background)' }}>
      {/* Left panel: Liked videos (30%) */}
      <div
        className="w-[30%] flex flex-col"
        style={{ borderRight: '1px solid var(--border)' }}
      >
        <div
          className="flex-shrink-0 px-5 py-5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <button
            onClick={() => router.back()}
            className="text-sm transition-colors duration-200"
            style={{ color: 'var(--foreground-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--foreground-muted)')}
          >
            {'<-'} 돌아가기
          </button>
          <h2
            className="text-sm font-medium mt-3"
            style={{ color: 'var(--foreground)' }}
          >
            좋아요한 동영상
          </h2>
          <p
            className="text-xs mt-1"
            style={{ color: 'var(--foreground-muted)' }}
          >
            최근 1개월
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {likedVideos.length === 0 ? (
            <div
              className="p-5 text-center text-sm"
              style={{ color: 'var(--foreground-muted)' }}
            >
              좋아요한 동영상이 없습니다.
              <br />
              먼저 데이터를 불러와주세요.
            </div>
          ) : (
            <div>
              {likedVideos.map((video, index) => (
                <div
                  key={index}
                  className="p-3 transition-colors duration-200 cursor-default"
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--background-surface)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="flex gap-3">
                    {video.thumbnail && (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-24 h-14 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-xs font-medium leading-relaxed line-clamp-2"
                        style={{ color: 'var(--foreground)' }}
                      >
                        {video.title}
                      </p>
                      <p
                        className="text-xs mt-1 truncate"
                        style={{ color: 'var(--foreground-muted)' }}
                      >
                        {video.channelTitle}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right panel: Chat interface (70%) */}
      <div className="w-[70%] flex flex-col">
        {/* Chat header */}
        <div
          className="flex-shrink-0 px-8 py-5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h1
            className="text-lg font-light tracking-wide"
            style={{ color: 'var(--foreground)' }}
          >
            Wonderwall
          </h1>
          <p
            className="text-xs mt-1"
            style={{ color: 'var(--foreground-muted)' }}
          >
            당신의 관심사에 대해 이야기해요
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="space-y-5">
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
          className="flex-shrink-0 px-8 py-5"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <form onSubmit={handleSubmit}>
            <div
              className="flex items-end gap-3 rounded-2xl px-5 py-3.5 transition-colors duration-200"
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
          </form>
        </div>
      </div>
    </div>
  )
}
