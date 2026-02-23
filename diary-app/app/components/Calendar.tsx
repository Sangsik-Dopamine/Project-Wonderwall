'use client'

import { useState } from 'react'

interface CalendarProps {
  selectedDate: string
  onDateSelect: (date: string) => void
  entryDates: Set<string>
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12월',
]

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function Calendar({ selectedDate, onDateSelect, entryDates }: CalendarProps) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1)
      setViewMonth(11)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1)
      setViewMonth(0)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d)
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center rounded transition-colors cursor-pointer"
          style={{ color: 'var(--text-secondary)' }}
        >
          &lt;
        </button>
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {viewYear}년 {MONTHS[viewMonth]}
        </span>
        <button
          onClick={nextMonth}
          className="w-7 h-7 flex items-center justify-center rounded transition-colors cursor-pointer"
          style={{ color: 'var(--text-secondary)' }}
        >
          &gt;
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-[11px] py-1"
            style={{ color: 'var(--text-muted)' }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="h-8" />
          }

          const dateStr = formatDate(viewYear, viewMonth, day)
          const isSelected = dateStr === selectedDate
          const hasEntry = entryDates.has(dateStr)
          const isToday =
            day === today.getDate() &&
            viewMonth === today.getMonth() &&
            viewYear === today.getFullYear()

          return (
            <button
              key={dateStr}
              onClick={() => onDateSelect(dateStr)}
              className={`
                calendar-day h-8 flex items-center justify-center text-xs rounded relative cursor-pointer
                ${isSelected ? 'selected' : ''}
                ${hasEntry ? 'has-entry' : ''}
              `}
              style={{
                color: isSelected
                  ? 'var(--bg-primary)'
                  : isToday
                    ? 'var(--accent)'
                    : 'var(--text-primary)',
                fontWeight: isToday || isSelected ? 600 : 400,
              }}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
