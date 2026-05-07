import { cn } from '@/lib/utils/cn'

type PillVariant = 'low' | 'ok' | 'pending' | 'neutral'

interface PillProps {
  variant?: PillVariant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<PillVariant, string> = {
  low:     'bg-[#C8102E]/10 text-[#C8102E] border border-[#C8102E]/20',
  ok:      'bg-green-100 text-green-700 border border-green-200',
  pending: 'bg-[#D4A24C]/15 text-[#8B5A00] border border-[#D4A24C]/30',
  neutral: 'bg-[#3E2723]/10 text-[#3E2723]/70 border border-[#3E2723]/15',
}

export function Pill({ variant = 'neutral', children, className }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold leading-none',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
