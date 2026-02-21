'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface UserInfo {
  authenticated: boolean
  handle?: string
}

export default function NavBar() {
  const pathname = usePathname()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  // admin 및 test 페이지에서는 숨김
  const hiddenPaths = ['/wonderwall_admin', '/test-db']
  const shouldHide = hiddenPaths.some(p => pathname.startsWith(p))

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/me')
        const data = await res.json()
        setUser(data)
      } catch {
        setUser({ authenticated: false })
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  if (shouldHide) return null

  const navItems = [
    { href: '/', label: '홈', icon: 'home' },
    ...(user?.authenticated && user?.handle
      ? [{ href: `/@${user.handle}`, label: '마이페이지', icon: 'user' }]
      : []),
    { href: '/wonderwall', label: 'Wonderwall', icon: 'wall' },
    { href: '/chat', label: 'Chat', icon: 'chat' },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Desktop nav */}
      <nav className="fixed top-0 left-0 right-0 z-[100] hidden md:block">
        <div className="bg-black/70 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="text-white font-bold text-lg tracking-tight">
              Wonderwall
            </Link>

            {/* Nav links */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'text-white bg-white/15'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {/* Login button if not authenticated */}
              {user && !user.authenticated && (
                <Link
                  href="/login"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/login')
                      ? 'text-white bg-white/15'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  로그인
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile nav - bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden">
        <div className="bg-black/80 backdrop-blur-xl border-t border-white/10">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <NavIcon name={item.icon} active={isActive(item.href)} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            ))}
            {user && !user.authenticated && (
              <Link
                href="/login"
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                  isActive('/login')
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <NavIcon name="login" active={isActive('/login')} />
                <span className="text-[10px] font-medium">로그인</span>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const strokeWidth = active ? 2 : 1.5
  const className = "w-5 h-5"

  switch (name) {
    case 'home':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      )
    case 'user':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      )
    case 'wall':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
        </svg>
      )
    case 'chat':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      )
    case 'login':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
        </svg>
      )
    default:
      return null
  }
}
