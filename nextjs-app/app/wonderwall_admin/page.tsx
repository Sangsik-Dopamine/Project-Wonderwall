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

// 기본 프롬프트 - A에이전트 (구독채널 기반 키워드 확장)
const DEFAULT_AGENT_A_SYSTEM = `너는 유튜브 구독 채널 데이터를 분석해서 사용자의 관심사를 파악하는 전문가야. 채널 제목을 보고 각 채널의 핵심 주제를 키워드로 추출해줘. 단, 총 키워드 개수는 반드시 300개 이하로 제한해줘.`

const DEFAULT_AGENT_A_USER = `다음은 유튜브 채널 제목 리스트이다. 각 채널의 특징을 분석해서 핵심 키워드를 추출해줘. 다른 설명은 생략하고 오직 추출된 키워드들만 콤마(,)로 구분된 형식으로 나열해줘. 총 키워드 개수는 300개를 넘지 않도록 해줘.

채널 리스트:
{channelTitles}`

// 기본 프롬프트 - B에이전트 (좋아요 동영상 기반 대화)
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
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-bold text-white mb-2">{agentName}</h3>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            System Prompt
          </label>
          <p className="text-xs text-gray-500 mb-2">{variableHint}</p>
          <textarea
            value={settings.systemPrompt}
            onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm"
            style={{ minHeight: '300px' }}
            placeholder="System prompt를 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            User Prompt Template
          </label>
          <p className="text-xs text-gray-500 mb-2">{variableHint}</p>
          <textarea
            value={settings.userPromptTemplate}
            onChange={(e) => setSettings({ ...settings, userPromptTemplate: e.target.value })}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm"
            style={{ minHeight: '150px' }}
            placeholder="User prompt 템플릿을 입력하세요"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => saveSettings(type)}
            disabled={saving}
            className="flex-1 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
          <button
            onClick={() => resetToDefault(type)}
            className="px-6 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600"
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
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-300">User ID</th>
                <th className="text-left py-3 px-4 text-gray-300">Email</th>
                <th className="text-left py-3 px-4 text-gray-300">가입일시</th>
                <th className="text-left py-3 px-4 text-gray-300">JSON 파일</th>
                <th className="text-left py-3 px-4 text-gray-300">다운로드</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-800">
                  <td className="py-3 px-4 text-gray-400 text-sm">{user.id}</td>
                  <td className="py-3 px-4 text-white">{user.email}</td>
                  <td className="py-3 px-4 text-gray-400">
                    {new Date(user.created_at).toLocaleString('ko-KR')}
                  </td>
                  <td className="py-3 px-4">
                    {user.has_json ? (
                      <span className="text-green-400">✓</span>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {user.has_json && (
                      <button
                        onClick={() => downloadJSON(user.id)}
                        className="text-blue-400 hover:text-blue-300"
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">에이전트 프롬프트 관리</h1>
          <Link
            href="/"
            className="px-4 py-2 text-sm bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            홈으로
          </Link>
        </div>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('agent_a')}
            className={`px-6 py-3 rounded-lg font-medium ${
              activeTab === 'agent_a'
                ? 'bg-white text-black'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            A에이전트 (구독채널 키워드)
          </button>
          <button
            onClick={() => setActiveTab('agent_b')}
            className={`px-6 py-3 rounded-lg font-medium ${
              activeTab === 'agent_b'
                ? 'bg-white text-black'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            B에이전트 (좋아요 대화)
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-lg font-medium ${
              activeTab === 'users'
                ? 'bg-white text-black'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            사용자 관리
          </button>
        </div>

        <div className="bg-gray-900 rounded-lg p-8">
          {activeTab === 'agent_a' && renderAgentTab('agent_a')}
          {activeTab === 'agent_b' && renderAgentTab('agent_b')}
          {activeTab === 'users' && renderUsersTab()}
        </div>
      </div>
    </div>
  )
}
