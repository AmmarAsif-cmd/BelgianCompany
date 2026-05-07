import { cn } from '@/lib/utils/cn'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-[#D4A24C] text-[#3E2723] font-semibold hover:bg-[#c49040] active:bg-[#b07d30]',
  secondary: 'bg-[#3E2723] text-[#FFF8E7] font-semibold hover:bg-[#5D4037] active:bg-[#4a3428]',
  ghost:     'bg-transparent text-[#3E2723] hover:bg-[#3E2723]/10 active:bg-[#3E2723]/20',
  danger:    'bg-[#C8102E] text-white font-semibold hover:bg-[#a00d25] active:bg-[#800a1d]',
}

const sizeClasses: Record<Size, string> = {
  sm:   'px-3 py-1.5 text-sm rounded-lg',
  md:   'px-4 py-2   text-sm rounded-xl',
  lg:   'px-6 py-3   text-base rounded-xl',
  icon: 'p-2 rounded-xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A24C] disabled:opacity-50 disabled:cursor-not-allowed select-none',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
