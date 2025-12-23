/**
 * YouTube Data API v3 헬퍼 함수들
 */

export interface YouTubeChannel {
  channelId: string
  title: string
  description: string
  subscribedAt: string
  thumbnailUrl?: string
}

export interface SubscriptionData {
  totalSubscriptions: number
  channels: YouTubeChannel[]
  retrievedAt: string
}

/**
 * 사용자의 YouTube 구독 채널 목록 가져오기
 */
export async function getYouTubeSubscriptions(
  accessToken: string
): Promise<SubscriptionData> {
  const channels: YouTubeChannel[] = []
  let nextPageToken: string | undefined

  try {
    // YouTube Data API를 사용하여 구독 목록 가져오기
    do {
      const url = new URL('https://www.googleapis.com/youtube/v3/subscriptions')
      url.searchParams.set('part', 'snippet')
      url.searchParams.set('mine', 'true')
      url.searchParams.set('maxResults', '50') // 한 번에 최대 50개
      if (nextPageToken) {
        url.searchParams.set('pageToken', nextPageToken)
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(
          `YouTube API error: ${error.error?.message || response.statusText}`
        )
      }

      const data = await response.json()

      // 구독 채널 정보 추출
      for (const item of data.items || []) {
        channels.push({
          channelId: item.snippet.resourceId.channelId,
          title: item.snippet.title,
          description: item.snippet.description || '',
          subscribedAt: item.snippet.publishedAt,
          thumbnailUrl: item.snippet.thumbnails?.default?.url,
        })
      }

      nextPageToken = data.nextPageToken
    } while (nextPageToken)

    return {
      totalSubscriptions: channels.length,
      channels,
      retrievedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Failed to fetch YouTube subscriptions:', error)
    throw error
  }
}

/**
 * 구독 데이터를 JSON 파일명으로 변환
 */
export function generateSubscriptionFilename(userId: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  return `subscriptions_${userId.slice(0, 8)}_${timestamp}.json`
}
