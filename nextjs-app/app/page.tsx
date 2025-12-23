'use client'

import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="bg-black text-white snap-y snap-mandatory h-screen overflow-y-scroll">
      {/* Section 1 */}
      <section className="min-h-screen flex items-center justify-center snap-start px-6">
        <h1 className="text-4xl md:text-6xl font-bold text-center leading-tight">
          당신의 진정한 관심사를 발견하세요.
        </h1>
      </section>

      {/* Section 2 */}
      <section className="min-h-screen flex items-center justify-center snap-start px-6">
        <h1 className="text-4xl md:text-6xl font-bold text-center leading-tight">
          그 관심사들로 진짜 당신의 모습을 표현하세요
        </h1>
      </section>

      {/* Section 3 */}
      <section className="min-h-screen flex items-center justify-center snap-start px-6">
        <h1 className="text-4xl md:text-6xl font-bold text-center leading-tight">
          당신의 가장 원더풀한 모습을 보여주는 담벼락
        </h1>
      </section>

      {/* Section 4 */}
      <section className="min-h-screen flex items-center justify-center snap-start px-6">
        <h1 className="text-4xl md:text-6xl font-bold text-center leading-tight">
          Wonderwall! 그 담벼락 밑에서
        </h1>
      </section>

      {/* Section 5 */}
      <section className="min-h-screen flex items-center justify-center snap-start px-6">
        <h1 className="text-4xl md:text-6xl font-bold text-center leading-tight">
          당신의 진정한 모습을 알아봐주는 인연을 만나세요
        </h1>
      </section>

      {/* Section 6: Action Button */}
      <section className="min-h-screen flex flex-col items-center justify-center snap-start px-6">
        <Link
          href="/login"
          className="px-12 py-6 text-2xl font-bold bg-white text-black rounded-full hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
        >
          인연찾기
        </Link>
      </section>
    </div>
  )
}
