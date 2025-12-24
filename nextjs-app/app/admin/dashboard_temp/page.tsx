'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Settings = {
  model: string
  apiKey: string
  systemPrompt: string
  userPromptTemplate: string
}

type User = {
  id: string
  email: string
  created_at: string
  has_json: boolean
}

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'keywords' | 'wonderwall' | 'users'>('keywords')
  const [loading, setLoading] = useState(true)

  const [keywordSettings, setKeywordSettings] = useState<Settings>({
    model: 'claude-sonnet-4-5',
    apiKey: '',
    systemPrompt: '',
    userPromptTemplate: '',
  })

  const [wonderwallSettings, setWonderwallSettings] = useState<Settings>({
    model: 'claude-sonnet-4-5',
    apiKey: '',
    systemPrompt: '',
    userPromptTemplate: '',
  })

  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    checkAuth()
    loadSettings()
    loadUsers()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/check-auth')
      if (!response.ok) {
        router.push('/admin')
      }
    } catch (error) {
      router.push('/admin')
    }
  }

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.keywords) {
          setKeywordSettings(data.keywords)
        }
        if (data.wonderwall) {
          setWonderwallSettings(data.wonderwall)
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

  const saveSettings = async (type: 'keywords' | 'wonderwall') => {
    const settings = type === 'keywords' ? keywordSettings : wonderwallSettings

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
    } catch (error) {
      alert('저장 중 오류 발생')
    }
  }

  const testAPI = async (type: 'keywords' | 'wonderwall') => {
    try {
      const response = await fetch('/api/admin/test-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`API 테스트 성공!\n\n응답: ${data.result}`)
      } else {
        alert(`API 테스트 실패: ${data.error}`)
      }
    } catch (error) {
      alert('API 테스트 중 오류 발생')
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
    } catch (error) {
      alert('다운로드 중 오류 발생')
    }
  }

  const renderSettingsTab = (type: 'keywords' | 'wonderwall') => {
    const settings = type === 'keywords' ? keywordSettings : wonderwallSettings
    const setSettings = type === 'keywords' ? setKeywordSettings : setWonderwallSettings

    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            LLM 모델
          </label>
          <select
            value={settings.model}
            onChange={(e) => setSettings({ ...settings, model: e.target.value })}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
          >
            <option value="claude-sonnet-4-5">Claude Sonnet 4.5</option>
            <option value="claude-opus-4">Claude Opus 4</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gpt-4o">GPT-4o</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            API 키
          </label>
          <input
            type="password"
            value={settings.apiKey}
            onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            placeholder="API 키를 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            System Prompt
          </label>
          <textarea
            value={settings.systemPrompt}
            onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white h-32"
            placeholder="System prompt를 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            User Prompt Template
          </label>
          <textarea
            value={settings.userPromptTemplate}
            onChange={(e) => setSettings({ ...settings, userPromptTemplate: e.target.value })}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white h-32"
            placeholder={
              type === 'keywords'
                ? 'User prompt 템플릿 ({channelTitles} 변수 사용 가능)'
                : 'User prompt 템플릿 ({keywords} 변수 사용 가능)'
            }
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => saveSettings(type)}
            className="flex-1 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200"
          >
            저장
          </button>
          <button
            onClick={() => testAPI(type)}
            className="flex-1 py-2 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600"
          >
            API 테스트
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Wonderwall Admin Dashboard</h1>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('keywords')}
            className={`px-6 py-3 rounded-lg font-medium ${
              activeTab === 'keywords'
                ? 'bg-white text-black'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            키워드 추출 설정
          </button>
          <button
            onClick={() => setActiveTab('wonderwall')}
            className={`px-6 py-3 rounded-lg font-medium ${
              activeTab === 'wonderwall'
                ? 'bg-white text-black'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            Wonderwall 설정
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
          {activeTab === 'keywords' && renderSettingsTab('keywords')}
          {activeTab === 'wonderwall' && renderSettingsTab('wonderwall')}
          {activeTab === 'users' && renderUsersTab()}
        </div>
      </div>
    </div>
  )
}
