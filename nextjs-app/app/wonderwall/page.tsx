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

  // localStorage에서 좋아요 동영상 데이터 로드 및 초기 메시지
  useEffect(() => {
    const savedData = localStorage.getItem('likedVideos')
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        setLikedVideos(parsed.videos || [])

        // 동영상 목록을 텍스트로 변환 (프롬프트용)
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
            } catch (e) { /* ignore */ }
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
            } catch (e) { /* ignore */ }
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
    <div className="flex h-screen bg-black md:pt-14 pb-16 md:pb-0">
      {/* 좌측: 좋아요 동영상 목록 (30%) */}
      <div className="w-[30%] border-r border-gray-800 flex flex-col">
        <div className="flex-shrink-0 px-4 py-4 border-b border-gray-800">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            &larr; 돌아가기
          </button>
          <h2 className="text-sm font-semibold text-white mt-2" style={{ fontFamily: 'Pretendard Variable, Pretendard, sans-serif' }}>
            좋아요한 동영상
          </h2>
          <p className="text-xs text-gray-500 mt-1">최근 1개월</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {likedVideos.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              좋아요한 동영상이 없습니다.<br />
              먼저 데이터를 불러와주세요.
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {likedVideos.map((video, index) => (
                <div key={index} className="p-3 hover:bg-gray-900 transition-colors">
                  <div className="flex gap-3">
                    {video.thumbnail && (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-24 h-14 object-cover rounded flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-white font-medium line-clamp-2 leading-relaxed">
                        {video.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 truncate">
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

      {/* 우측: 챗봇 인터페이스 (70%) */}
      <div className="w-[70%] flex flex-col">
        {/* 챗봇 헤더 */}
        <div className="flex-shrink-0 border-b border-gray-800 px-6 py-4">
          <h1 className="text-lg font-semibold text-white" style={{ fontFamily: 'Pretendard Variable, Pretendard, sans-serif' }}>
            Wonderwall
          </h1>
          <p className="text-xs text-gray-500 mt-1">당신의 관심사에 대해 이야기해요</p>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-white text-black'
                      : 'bg-gray-800 text-white'
                  }`}
                  style={{ fontFamily: 'Pretendard Variable, Pretendard, sans-serif' }}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-white rounded-2xl px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 입력 영역 */}
        <div className="flex-shrink-0 border-t border-gray-800 px-6 py-4">
          <form onSubmit={handleSubmit}>
            <div className="flex items-end gap-3 bg-gray-900 rounded-2xl px-4 py-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="메시지를 입력하세요..."
                className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none text-sm"
                style={{
                  fontFamily: 'Pretendard Variable, Pretendard, sans-serif',
                  minHeight: '24px',
                  maxHeight: '120px'
                }}
                rows={1}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white text-black rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
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
