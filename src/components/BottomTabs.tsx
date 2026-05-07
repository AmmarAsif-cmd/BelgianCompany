'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, ShoppingCart, BarChart2, Settings, Archive } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const tabs = [
  { href: '/app/count',     label: 'Count',   icon: ClipboardList },
  { href: '/app/orders',    label: 'Orders',  icon: ShoppingCart  },
  { href: '/app/stock',     label: 'Stock',   icon: Archive       },
  { href: '/app/dashboard', label: 'Stats',   icon: BarChart2     },
  { href: '/app/admin',     label: 'Admin',   icon: Settings      },
]

export function BottomTabs() {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-[#3E2723]/15 bg-[#FFF8E7] md:hidden">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors',
                active ? 'text-[#D4A24C] font-semibold' : 'text-[#3E2723]/50 hover:text-[#3E2723]'
              )}
            >
              <Icon size={21} strokeWidth={active ? 2.5 : 1.8} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Desktop top nav */}
      <nav className="hidden md:flex border-b border-[#3E2723]/15 bg-[#FFF8E7]">
        <div className="mx-auto flex max-w-4xl w-full px-4">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 px-5 py-3 text-sm border-b-2 transition-colors',
                  active
                    ? 'border-[#D4A24C] text-[#3E2723] font-semibold'
                    : 'border-transparent text-[#3E2723]/50 hover:text-[#3E2723] hover:border-[#3E2723]/20'
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
