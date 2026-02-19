'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type AgentSettings = {
  systemPrompt: string
  userPromptTemplate: string
}

type User = {
  id: string
  email: string
  created_at: string
  has_json: boolean
}

const DEFAULT_AGENT_A_SYSTEM = `너는 유튜브 구독 채널 데이터를 분석해서 사용자의 관심사를 파악하는 전문가야. 채널 제목을 보고 각 채널의 핵심 주제를 키워드로 추출해줘. 단, 총 키워드 개수는 반드시 300개 이하로 제한해줘.`

const DEFAULT_AGENT_A_USER = `다음은 유튜브 채널 제목 리스트이다. 각 채널의 특징을 분석해서 핵심 키워드를 추출해줘. 다른 설명은 생략하고 오직 추출된 키워드들만 콤마(,)로 구분된 형식으로 나열해줘. 총 키워드 개수는 300개를 넘지 않도록 해줘.

채널 리스트:
{channelTitles}`

const DEFAULT_AGENT_B_SYSTEM = `너는 사용자의 관심사에 관하여 대화를 나누어주는 친구같은 AI 에이전트야.

## 사용자의 좋아요 표시한 동영상 목록
{likedVideos}

## 대화 진행 가이드라인

1) 우선 사용자의 '좋아요 표시한 동영상 목록'을 읽어와서 어떤 영상에 대해 이야기하고 싶은지 물어봐줘. 예를 들면 "최근에 '주피디의 역사여행'에서 이 동영상에 좋아요를 눌렀네? 혹시 어떤점이 좋았는지 말해줄 수 있어?" 라는 icebreak을 먼저 해줘. 실제 사용자의 좋아요 목록에 있는 동영상 제목과 채널명을 사용해서 자연스럽게 말해줘.

2) 그리고 상대방의 관심사와 생각을 끌어내는 대화를 진행해줘. 사용자가 좋아요한 다른 영상들에 대해서도 자연스럽게 화제를 넓혀가면서 대화해줘.

## 대화 스타일
- 친근하고 따뜻한 반말 사용
- 공감적이고 호기심 어린 태도
- 사용자의 이야기를 경청하고 적절한 질문하기
- 대화 흐름을 자연스럽게 유지하기`

const DEFAULT_AGENT_B_USER = `안녕하세요, 대화를 시작해주세요.`

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'agent_a' | 'agent_b' | 'users'>('agent_a')
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [saving, setSaving] = useState(false)

  const [agentASettings, setAgentASettings] = useState<AgentSettings>({
    systemPrompt: DEFAULT_AGENT_A_SYSTEM,
    userPromptTemplate: DEFAULT_AGENT_A_USER,
  })

  const [agentBSettings, setAgentBSettings] = useState<AgentSettings>({
    systemPrompt: DEFAULT_AGENT_B_SYSTEM,
    userPromptTemplate: DEFAULT_AGENT_B_USER,
  })

  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/check-auth')
      const data = await response.json()

      if (data.isAdmin) {
        setAuthorized(true)
        loadSettings()
        loadUsers()
      } else {
        router.push('/wonderwall_admin/login')
      }
    } catch {
      router.push('/wonderwall_admin/login')
    }
  }

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.agent_a) {
          setAgentASettings({
            systemPrompt: data.agent_a.systemPrompt || DEFAULT_AGENT_A_SYSTEM,
            userPromptTemplate: data.agent_a.userPromptTemplate || DEFAULT_AGENT_A_USER,
          })
        }
        if (data.agent_b) {
          setAgentBSettings({
            systemPrompt: data.agent_b.systemPrompt || DEFAULT_AGENT_B_SYSTEM,
            userPromptTemplate: data.agent_b.userPromptTemplate || DEFAULT_AGENT_B_USER,
          })
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const saveSettings = async (type: 'agent_a' | 'agent_b') => {
    const settings = type === 'agent_a' ? agentASettings : agentBSettings
    setSaving(true)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, settings }),
      })

      if (response.ok) {
        alert('설정이 저장되었습니다')
      } else {
        alert('저장 실패')
      }
    } catch {
      alert('저장 중 오류 발생')
    } finally {
      setSaving(false)
    }
  }

  const resetToDefault = (type: 'agent_a' | 'agent_b') => {
    if (confirm('기본 프롬프트로 초기화하시겠습니까?')) {
      if (type === 'agent_a') {
        setAgentASettings({
          systemPrompt: DEFAULT_AGENT_A_SYSTEM,
          userPromptTemplate: DEFAULT_AGENT_A_USER,
        })
      } else {
        setAgentBSettings({
          systemPrompt: DEFAULT_AGENT_B_SYSTEM,
          userPromptTemplate: DEFAULT_AGENT_B_USER,
        })
      }
    }
  }

  const downloadJSON = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/download-json?userId=${userId}`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `user_${userId}_channels.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const data = await response.json()
        alert(`다운로드 실패: ${data.error}`)
      }
    } catch {
      alert('다운로드 중 오류 발생')
    }
  }

  const renderAgentTab = (type: 'agent_a' | 'agent_b') => {
    const settings = type === 'agent_a' ? agentASettings : agentBSettings
    const setSettings = type === 'agent_a' ? setAgentASettings : setAgentBSettings
    const agentName = type === 'agent_a' ? 'A에이전트' : 'B에이전트'
    const description = type === 'agent_a'
      ? '유튜브 구독채널 목록을 기반으로 키워드를 확장하는 에이전트'
      : '유튜브 좋아요 동영상을 기반으로 대화하는 에이전트'
    const variableHint = type === 'agent_a'
      ? '사용 가능한 변수: {channelTitles}'
      : '사용 가능한 변수: {likedVideos}'

    return (
      <div className="space-y-6">
        <div
          className="rounded-xl p-5"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border)',
          }}
        >
          <h3
            className="text-base font-medium mb-1"
            style={{ color: 'var(--foreground)' }}
          >
            {agentName}
          </h3>
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
            {description}
          </p>
        </div>

        <div>
          <label
            className="block text-xs font-medium mb-2 tracking-wide"
            style={{ color: 'var(--foreground-secondary)' }}
          >
            System Prompt
          </label>
          <p className="text-xs mb-2" style={{ color: 'var(--foreground-muted)' }}>
            {variableHint}
          </p>
          <textarea
            value={settings.systemPrompt}
            onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
            className="input-dark font-mono text-xs leading-relaxed"
            style={{ minHeight: '300px' }}
            placeholder="System prompt를 입력하세요"
          />
        </div>

        <div>
          <label
            className="block text-xs font-medium mb-2 tracking-wide"
            style={{ color: 'var(--foreground-secondary)' }}
          >
            User Prompt Template
          </label>
          <p className="text-xs mb-2" style={{ color: 'var(--foreground-muted)' }}>
            {variableHint}
          </p>
          <textarea
            value={settings.userPromptTemplate}
            onChange={(e) => setSettings({ ...settings, userPromptTemplate: e.target.value })}
            className="input-dark font-mono text-xs leading-relaxed"
            style={{ minHeight: '150px' }}
            placeholder="User prompt 템플릿을 입력하세요"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => saveSettings(type)}
            disabled={saving}
            className="btn-primary flex-1"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
          <button
            onClick={() => resetToDefault(type)}
            className="btn-secondary px-6"
          >
            기본값으로 초기화
          </button>
        </div>
      </div>
    )
  }

  const renderUsersTab = () => {
    return (
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left py-3 px-4 text-xs font-medium tracking-wide" style={{ color: 'var(--foreground-secondary)' }}>User ID</th>
                <th className="text-left py-3 px-4 text-xs font-medium tracking-wide" style={{ color: 'var(--foreground-secondary)' }}>Email</th>
                <th className="text-left py-3 px-4 text-xs font-medium tracking-wide" style={{ color: 'var(--foreground-secondary)' }}>가입일시</th>
                <th className="text-left py-3 px-4 text-xs font-medium tracking-wide" style={{ color: 'var(--foreground-secondary)' }}>JSON</th>
                <th className="text-left py-3 px-4 text-xs font-medium tracking-wide" style={{ color: 'var(--foreground-secondary)' }}>다운로드</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="transition-colors duration-150"
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--background-surface)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="py-3 px-4 text-xs" style={{ color: 'var(--foreground-muted)' }}>{user.id}</td>
                  <td className="py-3 px-4 text-sm" style={{ color: 'var(--foreground)' }}>{user.email}</td>
                  <td className="py-3 px-4 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                    {new Date(user.created_at).toLocaleString('ko-KR')}
                  </td>
                  <td className="py-3 px-4">
                    {user.has_json ? (
                      <span style={{ color: '#4ade80' }}>Yes</span>
                    ) : (
                      <span style={{ color: 'var(--foreground-muted)' }}>-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {user.has_json && (
                      <button
                        onClick={() => downloadJSON(user.id)}
                        className="text-sm transition-colors duration-200"
                        style={{ color: 'var(--accent-warm)' }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                      >
                        다운로드
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-6 py-12 md:px-8" style={{ background: 'var(--background)' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <p
              className="text-[11px] tracking-[0.3em] uppercase mb-2"
              style={{ color: 'var(--foreground-muted)' }}
            >
              Admin
            </p>
            <h1
              className="text-2xl font-extralight tracking-tight"
              style={{ color: 'var(--foreground)' }}
            >
              에이전트 프롬프트 관리
            </h1>
          </div>
          <Link
            href="/"
            className="text-xs transition-colors duration-200"
            style={{
              color: 'var(--foreground-muted)',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '2px',
            }}
          >
            홈으로
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8">
          {[
            { key: 'agent_a' as const, label: 'A에이전트' },
            { key: 'agent_b' as const, label: 'B에이전트' },
            { key: 'users' as const, label: '사용자 관리' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
              style={
                activeTab === tab.key
                  ? { background: 'var(--foreground)', color: 'var(--background)' }
                  : { background: 'transparent', color: 'var(--foreground-muted)', border: '1px solid var(--border)' }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="card-surface p-8">
          {activeTab === 'agent_a' && renderAgentTab('agent_a')}
          {activeTab === 'agent_b' && renderAgentTab('agent_b')}
          {activeTab === 'users' && renderUsersTab()}
        </div>
      </div>
    </div>
  )
}
