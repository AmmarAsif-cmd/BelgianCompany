'use client'

import { useEffect, useMemo, useState } from 'react'
import { ClipboardCopy, PackageSearch } from 'lucide-react'
import { useStore } from '@/components/StoreProvider'
import { ToastContainer, useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { getActiveItemsWithSuppliers } from '@/lib/db/items'
import { getCountsForWeek } from '@/lib/db/counts'
import { getMondayOfWeek, toISODate } from '@/lib/utils/week'
import type { ItemWithSupplier } from '@/types/db'

type OrderItem = {
  item: ItemWithSupplier
  currentCount: number
  suggestedOrder: number
}

export default function OrdersPage() {
  const store   = useStore()
  const supabase = createClient()
  const { toasts, addToast, dismissToast } = useToast()

  const weekStart = toISODate(getMondayOfWeek())

  const [items,   setItems]   = useState<ItemWithSupplier[]>([])
  const [counts,  setCounts]  = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [allItems, allCounts] = await Promise.all([
          getActiveItemsWithSuppliers(supabase),
          getCountsForWeek(supabase, store.id, weekStart),
        ])
        setItems(allItems)
        const map: Record<string, number> = {}
        allCounts.forEach((c) => { map[c.item_id] = c.quantity })
        setCounts(map)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.id, weekStart])

  // Only items that have been counted AND are at or below min_stock
  const lowItemsBySupplier = useMemo(() => {
    const low: OrderItem[] = items
      .filter((i) => counts[i.id] !== undefined && counts[i.id] <= i.min_stock)
      .map((i) => ({
        item:           i,
        currentCount:   counts[i.id],
        suggestedOrder: Math.max(i.min_stock * 2 - counts[i.id], 1),
      }))

    // Group by supplier display_order
    const map = new Map<string, { displayOrder: number; orderItems: OrderItem[] }>()
    low.forEach((oi) => {
      const sup = oi.item.suppliers
      if (!map.has(sup.name)) map.set(sup.name, { displayOrder: sup.display_order, orderItems: [] })
      map.get(sup.name)!.orderItems.push(oi)
    })

    return Array.from(map.entries())
      .sort((a, b) => a[1].displayOrder - b[1].displayOrder)
      .map(([name, { orderItems }]) => ({ name, orderItems }))
  }, [items, counts])

  async function copyOrderForSupplier(supplierName: string, orderItems: OrderItem[]) {
    const lines = orderItems.map(
      ({ item, currentCount, suggestedOrder }) =>
        `• ${item.name} — have ${currentCount}, order ${suggestedOrder}`
    )
    const text = [
      `📦 Order for ${supplierName} (${store.name})`,
      `Week of ${weekStart}`,
      '',
      ...lines,
    ].join('\n')

    try {
      await navigator.clipboard.writeText(text)
      addToast('Order list copied — paste into WhatsApp', 'success')
    } catch {
      addToast('Could not copy — please screenshot this screen', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full w-8 h-8 border-2 border-[#D4A24C] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold text-[#3E2723]">To Order</h1>
        <p className="text-xs text-[#3E2723]/55 mt-0.5">
          Items at or below minimum stock · week of {weekStart}
        </p>
      </div>

      {lowItemsBySupplier.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <PackageSearch size={40} className="text-[#3E2723]/20" />
          <p className="text-[#3E2723]/50 text-sm">
            No items need ordering right now.
          </p>
          <p className="text-[#3E2723]/35 text-xs">
            Items show here once they&apos;re counted and below minimum.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {lowItemsBySupplier.map(({ name, orderItems }) => (
            <div key={name} className="rounded-2xl overflow-hidden border border-[#3E2723]/10 bg-white shadow-sm">
              {/* Supplier header */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#3E2723]">
                <div>
                  <span className="text-[#FFF8E7] font-semibold text-sm">{name}</span>
                  <span className="ml-2 text-[#FFF8E7]/55 text-xs">
                    {orderItems.length} item{orderItems.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyOrderForSupplier(name, orderItems)}
                  className="text-[#D4A24C] hover:bg-white/10 gap-1.5 text-xs"
                >
                  <ClipboardCopy size={14} />
                  Copy
                </Button>
              </div>

              {/* Items */}
              {orderItems.map(({ item, currentCount, suggestedOrder }) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3 border-b border-[#3E2723]/8 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-[#3E2723]">{item.name}</p>
                    <p className="text-xs text-[#3E2723]/50">{item.category} · min {item.min_stock}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#3E2723]/50">
                      have <span className="font-bold text-[#C8102E]">{currentCount}</span>
                    </div>
                    <div className="text-xs text-[#3E2723]/50">
                      order <span className="font-bold text-[#3E2723]">{suggestedOrder}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
