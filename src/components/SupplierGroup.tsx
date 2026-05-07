'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { ItemRow } from './ItemRow'
import type { ItemWithSupplier } from '@/types/db'

interface SupplierGroupProps {
  supplierName: string
  items: ItemWithSupplier[]
  counts: Record<string, number>
  onSave: (itemId: string, quantity: number) => Promise<void>
}

export function SupplierGroup({ supplierName, items, counts, onSave }: SupplierGroupProps) {
  const [open, setOpen] = useState(true)

  const lowCount = items.filter((i) => (counts[i.id] ?? 0) <= i.min_stock).length

  return (
    <div className="rounded-2xl overflow-hidden border border-[#3E2723]/10 bg-white shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#3E2723] text-[#FFF8E7] hover:bg-[#5D4037] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm">{supplierName}</span>
          <span className="text-[#FFF8E7]/60 text-xs">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
          {lowCount > 0 && (
            <span className="bg-[#C8102E] text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {lowCount} low
            </span>
          )}
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div>
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              initialCount={counts[item.id] ?? 0}
              onSave={onSave}
            />
          ))}
        </div>
      )}
    </div>
  )
}
