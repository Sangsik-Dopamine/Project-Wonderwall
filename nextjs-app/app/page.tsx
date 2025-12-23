'use client'

import Link from 'next/link'

const DISCOVERY_WORDS = [
  '철학', 'Philosophy', '예술', 'Art', '음악', 'Music',
  '문학', 'Literature', '영화', 'Cinema', '과학', 'Science',
  '기술', 'Technology', '역사', 'History', '요리', 'Cooking',
  '여행', 'Travel', '패션', 'Fashion', '건축', 'Architecture'
]

export default function LandingPage() {
  return (
    <div className="bg-white text-black selection:bg-black selection:text-white">
      {/* Section 1: The Discovery */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-24 border-b border-gray-50">
        <div className="max-w-4xl w-full text-center mb-20">
          <p className="text-sm font-bold tracking-[0.3em] uppercase text-gray-400 mb-6">Discovery</p>
          <h2 className="text-xl md:text-2xl font-light text-gray-500 mb-2">Discover your true area of interest.</h2>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter">당신의 진정한 관심사를 발견하세요.</h1>
        </div>

        <div className="max-w-5xl w-full">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            {DISCOVERY_WORDS.map((word) => (
              <span
                key={word}
                className="text-lg md:text-xl font-medium text-gray-300 hover:text-black transition-colors cursor-default"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: The Identity */}
      <section className="min-h-[70vh] flex flex-col items-center justify-center px-6 py-24 bg-gray-50/50">
        <div className="max-w-4xl w-full text-center">
          <p className="text-sm font-bold tracking-[0.3em] uppercase text-gray-400 mb-6">Identity</p>
          <h2 className="text-xl md:text-2xl font-light text-gray-500 mb-4">And let them reveal your true identity.</h2>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            그 관심사들로 진짜 당신의 모습을 표현하세요
          </h1>
        </div>
      </section>

      {/* Section 3: The Wonder */}
      <section className="min-h-[70vh] flex flex-col items-center justify-center px-6 py-24">
        <div className="max-w-4xl w-full text-center">
          <p className="text-sm font-bold tracking-[0.3em] uppercase text-gray-400 mb-6">Wonder</p>
          <h2 className="text-xl md:text-2xl font-light text-gray-500 mb-4">A wall that reflects the most wonderful aspects of yours.</h2>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
            당신의 가장 원더풀한 모습을 보여주는 담벼락
          </h1>
        </div>
      </section>

      {/* Section 4: Brand & Action */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-24 bg-black text-white">
        <div className="text-center">
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-20 italic">Wonderwall</h1>

          <div className="space-y-8">
            <Link
              href="/login"
              className="group relative inline-flex items-center justify-center px-10 py-5 font-bold text-black transition-all duration-200 bg-white rounded-full hover:bg-gray-100 focus:outline-none"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.892 4.14-1.22 1.22-3.14 2.532-6.428 2.532-5.268 0-9.424-4.264-9.424-9.532s4.156-9.532 9.424-9.532c2.868 0 5.044 1.136 6.584 2.592l2.308-2.308C18.428 1.488 15.792 0 12.48 0 5.612 0 0 5.612 0 12.5s5.612 12.5 12.48 12.5c3.756 0 6.584-1.236 8.788-3.532 2.272-2.272 2.992-5.464 2.992-8.048 0-.78-.068-1.528-.192-2.22l-11.588.02z" />
              </svg>
              구글 계정으로 1분 만에 분석 시작
            </Link>
            <p className="text-gray-500 text-sm tracking-widest font-medium uppercase">
              YOUTUBE DATA ANALYTICS SYSTEM
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
