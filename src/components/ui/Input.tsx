import { cn } from '@/lib/utils/cn'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-[#3E2723]/70 uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          'w-full rounded-xl border border-[#3E2723]/20 bg-white px-3 py-2.5 text-sm text-[#3E2723]',
          'placeholder:text-[#3E2723]/40',
          'focus:outline-none focus:ring-2 focus:ring-[#D4A24C] focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    </div>
  )
}
