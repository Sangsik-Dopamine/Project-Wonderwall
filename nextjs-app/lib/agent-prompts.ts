import { createClient } from '@supabase/supabase-js'

// 기본 프롬프트 - A에이전트 (구독채널 기반 키워드 확장)
export const DEFAULT_AGENT_A_SYSTEM = `너는 유튜브 구독 채널 데이터를 분석해서 사용자의 관심사를 파악하는 전문가야. 채널 제목을 보고 각 채널의 핵심 주제를 키워드로 추출해줘. 단, 총 키워드 개수는 반드시 300개 이하로 제한해줘.`

export const DEFAULT_AGENT_A_USER = `다음은 유튜브 채널 제목 리스트이다. 각 채널의 특징을 분석해서 핵심 키워드를 추출해줘. 다른 설명은 생략하고 오직 추출된 키워드들만 콤마(,)로 구분된 형식으로 나열해줘. 총 키워드 개수는 300개를 넘지 않도록 해줘.

채널 리스트:
{channelTitles}`

// 기본 프롬프트 - B에이전트 (좋아요 동영상 기반 대화)
export const DEFAULT_AGENT_B_SYSTEM = `너는 사용자의 관심사에 관하여 대화를 나누어주는 친구같은 AI 에이전트야.

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

export const DEFAULT_AGENT_B_USER = `안녕하세요, 대화를 시작해주세요.`

export interface AgentPrompts {
  systemPrompt: string
  userPromptTemplate: string
}

interface AdminSettingsData {
  system_prompt?: string
  user_prompt_template?: string
}

// Supabase에서 에이전트 프롬프트 가져오기
export async function getAgentPrompts(agentType: 'agent_a' | 'agent_b'): Promise<AgentPrompts> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('Supabase credentials not found, using default prompts')
      return getDefaultPrompts(agentType)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase
      .rpc('get_admin_settings', { p_setting_type: agentType })
      .single() as { data: AdminSettingsData | null; error: any }

    if (error || !data) {
      console.log(`No saved prompts found for ${agentType}, using defaults`)
      return getDefaultPrompts(agentType)
    }

    return {
      systemPrompt: data.system_prompt || getDefaultPrompts(agentType).systemPrompt,
      userPromptTemplate: data.user_prompt_template || getDefaultPrompts(agentType).userPromptTemplate,
    }
  } catch (error) {
    console.error('Error fetching agent prompts:', error)
    return getDefaultPrompts(agentType)
  }
}

function getDefaultPrompts(agentType: 'agent_a' | 'agent_b'): AgentPrompts {
  if (agentType === 'agent_a') {
    return {
      systemPrompt: DEFAULT_AGENT_A_SYSTEM,
      userPromptTemplate: DEFAULT_AGENT_A_USER,
    }
  } else {
    return {
      systemPrompt: DEFAULT_AGENT_B_SYSTEM,
      userPromptTemplate: DEFAULT_AGENT_B_USER,
    }
  }
}
