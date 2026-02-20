'use client'

import { useState, useEffect, useCallback } from 'react'
import ChatHeader from './components/chat-header'
import WelcomeScreen from './components/welcome-screen'
import MessageList from './components/message-list'
import ChatInput from './components/chat-input'
import SidePanel from './components/side-panel'

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
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [likedVideos, setLikedVideos] = useState<LikedVideo[]>([])
  const [likedVideosText, setLikedVideosText] = useState('')
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
  const [hasStartedChat, setHasStartedChat] = useState(false)

  // Load liked videos from localStorage
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
  }, [])

  const sendMessage = useCallback(async (userMessage: string, currentMessages: Message[]) => {
    const newMessages: Message[] = [...currentMessages, { role: 'user', content: userMessage }]
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
            } catch {
              /* ignore parse errors */
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages([
        ...newMessages,
        { role: 'assistant', content: '메시지를 처리하는 중에 오류가 발생했어요. 다시 시도해 주세요.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [likedVideosText])

  const handleSelectVideo = (video: LikedVideo) => {
    setHasStartedChat(true)
    const userMessage = `"${video.title}" 영상에 대해 이야기하고 싶어`
    sendMessage(userMessage, [])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')

    if (!hasStartedChat) {
      setHasStartedChat(true)
    }
    sendMessage(userMessage, messages)
  }

  const handleSelectSession = () => {
    // Mock: just close the panel for now
    setIsSidePanelOpen(false)
  }

  return (
    <div className="flex flex-col h-dvh bg-[#131314]">
      <SidePanel
        isOpen={isSidePanelOpen}
        onClose={() => setIsSidePanelOpen(false)}
        sessions={[]}
        onSelectSession={handleSelectSession}
      />

      <ChatHeader onMenuToggle={() => setIsSidePanelOpen(true)} />

      {!hasStartedChat ? (
        <div className="flex-1 overflow-y-auto">
          <WelcomeScreen
            likedVideos={likedVideos}
            onSelectVideo={handleSelectVideo}
          />
        </div>
      ) : (
        <MessageList messages={messages} isLoading={isLoading} />
      )}

      <ChatInput
        input={input}
        isLoading={isLoading}
        onInputChange={setInput}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
