'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Minus, Plus, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Pill } from './ui/Pill'
import type { ItemWithSupplier } from '@/types/db'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface ItemRowProps {
  item: ItemWithSupplier
  initialCount: number
  onSave: (itemId: string, quantity: number) => Promise<void>
}

export function ItemRow({ item, initialCount, onSave }: ItemRowProps) {
  const [count,     setCount]     = useState(initialCount)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLow = count <= item.min_stock

  // Sync if parent passes a new initial value (e.g. week changes)
  useEffect(() => {
    setCount(initialCount)
  }, [initialCount])

  const triggerSave = useCallback(
    (newCount: number) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      setSaveStatus('saving')

      debounceRef.current = setTimeout(async () => {
        try {
          await onSave(item.id, newCount)
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 1500)
        } catch {
          setSaveStatus('error')
        }
      }, 300)
    },
    [item.id, onSave]
  )

  function handleDecrement() {
    const next = Math.max(0, count - 1)
    setCount(next)
    triggerSave(next)
  }

  function handleIncrement() {
    const next = count + 1
    setCount(next)
    triggerSave(next)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw  = e.target.value
    const next = parseInt(raw, 10)
    if (raw === '' || isNaN(next) || next < 0) return
    setCount(next)
    triggerSave(next)
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 border-b border-[#3E2723]/8 last:border-0 transition-colors',
        isLow && 'bg-[#C8102E]/5'
      )}
    >
      {/* Item info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-[#3E2723] truncate">{item.name}</span>
          {isLow && <Pill variant="low">LOW</Pill>}
        </div>
        <span className="text-xs text-[#3E2723]/50">
          {item.category} · min {item.min_stock}
        </span>
      </div>

      {/* Save indicator */}
      <div className="w-5 flex justify-center shrink-0">
        {saveStatus === 'saving' && (
          <Loader2 size={14} className="text-[#D4A24C] animate-spin" />
        )}
        {saveStatus === 'saved' && (
          <CheckCircle2 size={14} className="text-green-500" />
        )}
        {saveStatus === 'error' && (
          <span className="text-xs text-[#C8102E]">!</span>
        )}
      </div>

      {/* Counter controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleDecrement}
          disabled={count === 0}
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center transition-colors select-none',
            'bg-[#3E2723]/10 text-[#3E2723] hover:bg-[#3E2723]/20 active:bg-[#3E2723]/30',
            'disabled:opacity-30 disabled:cursor-not-allowed',
            isLow && 'bg-[#C8102E]/10 text-[#C8102E] hover:bg-[#C8102E]/20'
          )}
          aria-label={`Decrease ${item.name}`}
        >
          <Minus size={18} strokeWidth={2.5} />
        </button>

        <input
          type="number"
          value={count}
          onChange={handleInputChange}
          min={0}
          className={cn(
            'w-14 h-10 rounded-xl border text-center text-base font-bold',
            'focus:outline-none focus:ring-2 focus:ring-[#D4A24C]',
            isLow
              ? 'border-[#C8102E]/30 bg-[#C8102E]/5 text-[#C8102E]'
              : 'border-[#3E2723]/20 bg-white text-[#3E2723]'
          )}
        />

        <button
          onClick={handleIncrement}
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center transition-colors select-none',
            'bg-[#D4A24C] text-[#3E2723] hover:bg-[#c49040] active:bg-[#b07d30]'
          )}
          aria-label={`Increase ${item.name}`}
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
