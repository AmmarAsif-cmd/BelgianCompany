'use client'

import { getWeekOptions, toISODate } from '@/lib/utils/week'

interface WeekPickerProps {
  value: string  // ISO date string (YYYY-MM-DD) of the selected Monday
  onChange: (iso: string) => void
}

export function WeekPicker({ value, onChange }: WeekPickerProps) {
  const options = getWeekOptions()

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-[#3E2723]/20 bg-white px-3 py-2 text-sm text-[#3E2723] focus:outline-none focus:ring-2 focus:ring-[#D4A24C] cursor-pointer"
    >
      {options.map(({ date, label }) => {
        const iso = toISODate(date)
        return (
          <option key={iso} value={iso}>
            {label}
          </option>
        )
      })}
    </select>
  )
}
