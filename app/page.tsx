'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

function ScrollIndicator() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      const el = document.querySelector('.landing-scroll-container')
      if (el && el.scrollTop > 60) {
        setVisible(false)
      } else {
        setVisible(true)
      }
    }
    const container = document.querySelector('.landing-scroll-container')
    container?.addEventListener('scroll', handleScroll)
    return () => container?.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-opacity duration-700"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <span className="text-[11px] tracking-[0.2em] uppercase" style={{ color: 'var(--foreground-muted)' }}>
        Scroll
      </span>
      <svg
        width="16"
        height="24"
        viewBox="0 0 16 24"
        fill="none"
        className="animate-[scroll-hint_2s_ease-in-out_infinite]"
      >
        <path d="M8 4L8 18M8 18L13 13M8 18L3 13" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible')
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className={`section-animate ${className}`}>
      {children}
    </section>
  )
}

export default function LandingPage() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/admin/check-auth')
        if (response.ok) {
          const data = await response.json()
          setIsAdmin(data.isAdmin === true)
        }
      } catch {
        // not logged in
      }
    }
    checkAdmin()
  }, [])

  return (
    <div className="landing-scroll-container bg-[var(--background)] text-[var(--foreground)] snap-y snap-mandatory h-screen overflow-y-scroll">
      {/* Admin Link */}
      {isAdmin && (
        <Link
          href="/wonderwall_admin"
          className="fixed top-6 right-6 z-50 px-4 py-2 text-xs tracking-wider uppercase transition-colors duration-300"
          style={{
            color: 'var(--foreground-muted)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          Admin
        </Link>
      )}

      {/* Subtle noise texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-10 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Section 1 - Hero */}
      <section className="relative min-h-screen flex items-center justify-center snap-start px-6">
        {/* Ambient glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none animate-[glow-pulse_5s_ease-in-out_infinite]"
          style={{
            background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
          }}
        />
        <AnimatedSection className="relative z-20 flex flex-col items-center gap-4">
          <p
            className="text-[11px] tracking-[0.3em] uppercase mb-4"
            style={{ color: 'var(--foreground-muted)' }}
          >
            Wonderwall
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extralight text-center leading-tight tracking-tight text-balance">
            당신의 진정한 관심사를
            <br />
            발견하세요.
          </h1>
        </AnimatedSection>
        <ScrollIndicator />
      </section>

      {/* Section 2 */}
      <section className="min-h-screen flex items-center justify-center snap-start px-6">
        <AnimatedSection className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-extralight leading-tight tracking-tight text-balance">
            그 관심사들로
            <br />
            <span style={{ color: 'var(--foreground-secondary)' }}>
              진짜 당신의 모습을
            </span>
            <br />
            표현하세요
          </h2>
        </AnimatedSection>
      </section>

      {/* Section 3 */}
      <section className="min-h-screen flex items-center justify-center snap-start px-6">
        <AnimatedSection className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-extralight leading-tight tracking-tight text-balance">
            당신의 가장
            <br />
            <span className="font-light" style={{ color: 'var(--accent-warm)' }}>
              원더풀한
            </span>{' '}
            모습을 보여주는
            <br />
            담벼락
          </h2>
        </AnimatedSection>
      </section>

      {/* Section 4 */}
      <section className="relative min-h-screen flex items-center justify-center snap-start px-6">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] pointer-events-none opacity-50"
          style={{
            background: 'radial-gradient(ellipse, var(--accent-glow) 0%, transparent 70%)',
          }}
        />
        <AnimatedSection className="relative z-20 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-extralight leading-tight tracking-tight text-balance">
            Wonderwall!
            <br />
            <span style={{ color: 'var(--foreground-secondary)' }}>
              그 담벼락 밑에서
            </span>
          </h2>
        </AnimatedSection>
      </section>

      {/* Section 5 */}
      <section className="min-h-screen flex items-center justify-center snap-start px-6">
        <AnimatedSection className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-extralight leading-tight tracking-tight text-balance">
            당신의 진정한 모습을
            <br />
            알아봐주는
            <br />
            <span className="font-light" style={{ color: 'var(--accent-warm)' }}>
              인연
            </span>
            을 만나세요
          </h2>
        </AnimatedSection>
      </section>

      {/* Section 6: CTA */}
      <section className="relative min-h-screen flex flex-col items-center justify-center snap-start px-6">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] pointer-events-none animate-[glow-pulse_4s_ease-in-out_infinite]"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)',
          }}
        />
        <AnimatedSection className="relative z-20 flex flex-col items-center gap-8">
          <Link
            href="/login"
            className="group relative px-14 py-5 text-xl font-medium bg-[var(--foreground)] text-[var(--background)] rounded-full transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]"
          >
            <span className="relative z-10">인연찾기</span>
          </Link>
          <p
            className="text-sm"
            style={{ color: 'var(--foreground-muted)' }}
          >
            YouTube 관심사 기반 매칭
          </p>
        </AnimatedSection>
      </section>
    </div>
  )
}
