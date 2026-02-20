'use client'

interface ChatHeaderProps {
  onMenuToggle: () => void
}

export default function ChatHeader({ onMenuToggle }: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 flex-shrink-0">
      <button
        onClick={onMenuToggle}
        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#2a2a2a] transition-colors"
        aria-label="메뉴 열기"
      >
        <svg
          className="w-6 h-6 text-[#e0e0e0]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      <h1 className="text-[#e0e0e0] text-lg font-medium">
        Wonderwall
      </h1>

      {/* Spacer to balance the layout */}
      <div className="w-10 h-10" />
    </header>
  )
}
