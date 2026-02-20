'use client'

interface LikedVideo {
  videoId: string
  title: string
  channelTitle: string
  thumbnail: string
  likedAt: string
}

interface WelcomeScreenProps {
  likedVideos: LikedVideo[]
  onSelectVideo: (video: LikedVideo) => void
}

export default function WelcomeScreen({ likedVideos, onSelectVideo }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col justify-center px-6 py-8">
      <div className="mb-8">
        <p className="text-[#c0c0c0] text-base mb-1">
          {"안녕?"}
        </p>
        <h2 className="text-[#e8e8e8] text-2xl font-semibold leading-tight">
          {"무엇에 대해 이야기해 볼까?"}
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {likedVideos.length > 0 ? (
          likedVideos.slice(0, 6).map((video, index) => (
            <button
              key={video.videoId || index}
              onClick={() => onSelectVideo(video)}
              className="flex items-center gap-3 bg-[#1e1e1e] hover:bg-[#2a2a2a] rounded-full px-5 py-3 text-left transition-colors"
            >
              <span className="text-sm text-[#d0d0d0] line-clamp-1 leading-relaxed">
                {video.title}
              </span>
            </button>
          ))
        ) : (
          <>
            <div className="flex items-center gap-3 bg-[#1e1e1e] rounded-full px-5 py-3 animate-pulse">
              <div className="h-4 w-48 bg-[#2a2a2a] rounded" />
            </div>
            <div className="flex items-center gap-3 bg-[#1e1e1e] rounded-full px-5 py-3 animate-pulse">
              <div className="h-4 w-40 bg-[#2a2a2a] rounded" />
            </div>
            <div className="flex items-center gap-3 bg-[#1e1e1e] rounded-full px-5 py-3 animate-pulse">
              <div className="h-4 w-52 bg-[#2a2a2a] rounded" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
