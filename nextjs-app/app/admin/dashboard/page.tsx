'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('keywords')
  const [loading, setLoading] = useState(true)

  // 키워드 추출 설정
  const [keywordSettings, setKeywordSettings] = useState({
    model: 'claude-sonnet-4-5',
    apiKey: '',
    systemPrompt: '',
    userPromptTemplate: '',
  })

  // Wonderwall 설정
  const [wonderwallSettings, setWonderwallSettings] = useState({
    model: 'claude-sonnet-4-5',
    apiKey: '',
    systemPrompt: '',
    userPromptTemplate: '',
  })

  // 사용자 리스트
  const [users, setUsers] = useState([])

  useEffect(() => {
    // 인증 확인
    checkAuth()
    // 설정 로드
    loadSettings()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/check-auth')
      if (!response.ok) {
        router.push('/admin')
      }
    } catch (error) {
      router.push('/admin')
    } finally {
      setLoading(false)
    }
  }

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.keywords) setKeywordSettings(data.keywords)
        if (data.wonderwall) setWonderwallSettings(data.wonderwall)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const saveSettings = async (type: 'keywords' | 'wonderwall') => {
    try {
      const settings = type === 'keywords' ? keywordSettings : wonderwallSettings
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, settings }),
      })

      if (response.ok) {
        alert('설정이 저장되었습니다!')
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

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to load users:', error)
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
        a.click()
      } else {
        alert('다운로드 실패')
      }
    } catch (error) {
      alert('다운로드 중 오류 발생')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Wonderwall Admin</h1>
          <button
            onClick={() => {
              document.cookie = 'admin_session=; Max-Age=0; path=/;'
              router.push('/admin')
            }}
            className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700"
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <div className="flex px-6">
          <button
            onClick={() => setActiveTab('keywords')}
            className={`px-6 py-4 font-medium ${
              activeTab === 'keywords'
                ? 'border-b-2 border-white text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            키워드 추출 설정
          </button>
          <button
            onClick={() => setActiveTab('wonderwall')}
            className={`px-6 py-4 font-medium ${
              activeTab === 'wonderwall'
                ? 'border-b-2 border-white text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Wonderwall 설정
          </button>
          <button
            onClick={() => {
              setActiveTab('users')
              loadUsers()
            }}
            className={`px-6 py-4 font-medium ${
              activeTab === 'users'
                ? 'border-b-2 border-white text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            사용자 관리
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* 키워드 추출 설정 */}
        {activeTab === 'keywords' && (
          <div className="max-w-4xl space-y-6">
            <h2 className="text-xl font-bold mb-4">키워드 추출 설정</h2>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                LLM 모델
              </label>
              <select
                value={keywordSettings.model}
                onChange={(e) =>
                  setKeywordSettings({ ...keywordSettings, model: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white"
              >
                <option value="claude-sonnet-4-5">Claude Sonnet 4.5</option>
                <option value="claude-opus-4">Claude Opus 4</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gpt-4o">GPT-4o</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                API 키
              </label>
              <input
                type="password"
                value={keywordSettings.apiKey}
                onChange={(e) =>
                  setKeywordSettings({ ...keywordSettings, apiKey: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                placeholder="API 키를 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                System Prompt
              </label>
              <textarea
                value={keywordSettings.systemPrompt}
                onChange={(e) =>
                  setKeywordSettings({ ...keywordSettings, systemPrompt: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white h-32"
                placeholder="System prompt를 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                User Prompt Template
              </label>
              <textarea
                value={keywordSettings.userPromptTemplate}
                onChange={(e) =>
                  setKeywordSettings({ ...keywordSettings, userPromptTemplate: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white h-32"
                placeholder="User prompt 템플릿을 입력하세요. {channelTitles} 변수를 사용할 수 있습니다."
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => saveSettings('keywords')}
                className="px-6 py-3 bg-white text-black font-bold rounded hover:bg-gray-200"
              >
                설정 저장
              </button>
              <button
                onClick={() => testAPI('keywords')}
                className="px-6 py-3 bg-gray-800 text-white font-bold rounded hover:bg-gray-700"
              >
                API 테스트
              </button>
            </div>
          </div>
        )}

        {/* Wonderwall 설정 */}
        {activeTab === 'wonderwall' && (
          <div className="max-w-4xl space-y-6">
            <h2 className="text-xl font-bold mb-4">Wonderwall 설정</h2>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                LLM 모델
              </label>
              <select
                value={wonderwallSettings.model}
                onChange={(e) =>
                  setWonderwallSettings({ ...wonderwallSettings, model: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white"
              >
                <option value="claude-sonnet-4-5">Claude Sonnet 4.5</option>
                <option value="claude-opus-4">Claude Opus 4</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gpt-4o">GPT-4o</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                API 키
              </label>
              <input
                type="password"
                value={wonderwallSettings.apiKey}
                onChange={(e) =>
                  setWonderwallSettings({ ...wonderwallSettings, apiKey: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white"
                placeholder="API 키를 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                System Prompt
              </label>
              <textarea
                value={wonderwallSettings.systemPrompt}
                onChange={(e) =>
                  setWonderwallSettings({ ...wonderwallSettings, systemPrompt: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white h-32"
                placeholder="System prompt를 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                User Prompt Template
              </label>
              <textarea
                value={wonderwallSettings.userPromptTemplate}
                onChange={(e) =>
                  setWonderwallSettings({ ...wonderwallSettings, userPromptTemplate: e.target.value })
                }
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded text-white h-32"
                placeholder="User prompt 템플릿을 입력하세요. {keywords} 변수를 사용할 수 있습니다."
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => saveSettings('wonderwall')}
                className="px-6 py-3 bg-white text-black font-bold rounded hover:bg-gray-200"
              >
                설정 저장
              </button>
              <button
                onClick={() => testAPI('wonderwall')}
                className="px-6 py-3 bg-gray-800 text-white font-bold rounded hover:bg-gray-700"
              >
                API 테스트
              </button>
            </div>
          </div>
        )}

        {/* 사용자 관리 */}
        {activeTab === 'users' && (
          <div className="max-w-6xl">
            <h2 className="text-xl font-bold mb-4">사용자 관리</h2>

            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium">사용자 ID</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">이메일</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">가입일시</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">JSON 파일</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-400">
                        사용자가 없습니다
                      </td>
                    </tr>
                  ) : (
                    users.map((user: any) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 text-sm">{user.id}</td>
                        <td className="px-6 py-4 text-sm">{user.email}</td>
                        <td className="px-6 py-4 text-sm">
                          {new Date(user.created_at).toLocaleString('ko-KR')}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {user.has_json ? (
                            <span className="text-green-400">생성됨</span>
                          ) : (
                            <span className="text-gray-500">없음</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {user.has_json && (
                            <button
                              onClick={() => downloadJSON(user.id)}
                              className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
                            >
                              다운로드
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
