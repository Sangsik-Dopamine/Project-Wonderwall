/**
 * YouTube Data API v3 헬퍼 함수
 * 좋아요한 동영상 목록 (최근 3개월)
 */

export interface LikedVideo {
  videoId: string
  title: string
  channelTitle: string
  likedAt: string
}

export interface LikedVideosData {
  totalVideos: number
  videos: LikedVideo[]
  retrievedAt: string
}

/**
 * 사용자의 YouTube 좋아요한 동영상 목록 가져오기 (최근 3개월)
 */
export async function getYouTubeLikedVideos(
  accessToken: string
): Promise<LikedVideosData> {
  const videos: LikedVideo[] = []
  let nextPageToken: string | undefined

  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  try {
    do {
      const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems')
      url.searchParams.set('part', 'snippet,contentDetails')
      url.searchParams.set('playlistId', 'LL')
      url.searchParams.set('maxResults', '50')
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

      let reachedOldVideos = false

      for (const item of data.items || []) {
        const likedAt = new Date(item.snippet.publishedAt)

        if (likedAt < threeMonthsAgo) {
          reachedOldVideos = true
          break
        }

        videos.push({
          videoId: item.contentDetails?.videoId || item.snippet?.resourceId?.videoId || '',
          title: item.snippet.title,
          channelTitle: item.snippet.videoOwnerChannelTitle || '',
          likedAt: item.snippet.publishedAt,
        })
      }

      if (reachedOldVideos) break

      nextPageToken = data.nextPageToken
    } while (nextPageToken)

    return {
      totalVideos: videos.length,
      videos,
      retrievedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Failed to fetch YouTube liked videos:', error)
    throw error
  }
}
