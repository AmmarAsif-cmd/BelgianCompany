'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useStore } from './StoreProvider'
import { Button } from './ui/Button'

interface BrandHeaderProps {
  weekLabel: string
}

export function BrandHeader({ weekLabel }: BrandHeaderProps) {
  const store  = useStore()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 shadow-sm"
      style={{ backgroundColor: store.brandColor }}
    >
      <div className="flex flex-col">
        <span className="text-[#FFF8E7] font-bold text-base leading-tight tracking-tight">
          🧇 Belgian Waffle Co.
        </span>
        <span className="text-[#FFF8E7]/75 text-xs leading-tight">
          {store.name} · {weekLabel}
        </span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleSignOut}
        title="Sign out"
        className="text-[#FFF8E7] hover:bg-white/20 active:bg-white/30"
      >
        <LogOut size={18} />
      </Button>
    </header>
  )
}
