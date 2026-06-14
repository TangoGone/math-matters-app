"use client"

import { useState } from "react"
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isToday,
} from "date-fns"

interface SessionCalendarProps {
  highlightedDates: string[] // 'yyyy-MM-dd'
  selectedDate: string | null
  onSelectDate: (date: string) => void
  accent?: "blue" | "green"
}

export function SessionCalendar({
  highlightedDates,
  selectedDate,
  onSelectDate,
  accent = "blue",
}: SessionCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const highlightedSet = new Set(highlightedDates)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const days: Date[] = []
  let day = startDate
  while (day <= endDate) {
    days.push(day)
    day = addDays(day, 1)
  }

  const accentBg = accent === "green" ? "bg-green-600" : "bg-blue-600"
  const accentBgHover = accent === "green" ? "hover:bg-green-700" : "hover:bg-blue-700"
  const dotColor = accent === "green" ? "bg-green-500" : "bg-blue-500"
  const accentRing = accent === "green" ? "ring-green-500" : "ring-blue-500"

  return (
    <div className="w-full max-w-xs mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
        >
          ‹
        </button>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {format(currentMonth, "MMMM yyyy")}
        </p>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
        >
          ›
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-center text-[11px] font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((d) => {
          const dateStr = format(d, "yyyy-MM-dd")
          const inMonth = isSameMonth(d, currentMonth)
          const hasSession = highlightedSet.has(dateStr)
          const isSelected = selectedDate === dateStr
          const today = isToday(d)

          return (
            <div key={dateStr} className="flex items-center justify-center">
              <button
                disabled={!hasSession}
                onClick={() => hasSession && onSelectDate(dateStr)}
                className={`
                  relative w-9 h-9 flex items-center justify-center rounded-full text-sm transition-colors
                  ${!inMonth ? "text-gray-300 dark:text-gray-700" : "text-gray-700 dark:text-gray-300"}
                  ${hasSession && !isSelected ? `hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer font-medium ${inMonth ? "text-gray-900 dark:text-white" : ""}` : ""}
                  ${!hasSession ? "cursor-default opacity-40" : ""}
                  ${isSelected ? `${accentBg} ${accentBgHover} text-white font-semibold` : ""}
                  ${today && !isSelected ? `ring-1 ${accentRing}` : ""}
                `}
              >
                {format(d, "d")}
                {hasSession && !isSelected && (
                  <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${dotColor}`} />
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}