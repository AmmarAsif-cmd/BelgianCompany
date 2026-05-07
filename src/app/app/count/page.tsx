'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, User } from 'lucide-react'
import { useStore } from '@/components/StoreProvider'
import { SupplierGroup } from '@/components/SupplierGroup'
import { WeekPicker } from '@/components/WeekPicker'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'
import { getActiveItemsWithSuppliers } from '@/lib/db/items'
import { getCountsForWeek, upsertCount } from '@/lib/db/counts'
import { getMondayOfWeek, toISODate } from '@/lib/utils/week'
import type { ItemWithSupplier } from '@/types/db'

const NAME_KEY = 'bwc_counted_by'

export default function CountPage() {
  const store   = useStore()
  const supabase = createClient()

  const [weekStart,  setWeekStart]  = useState(() => toISODate(getMondayOfWeek()))
  const [items,      setItems]      = useState<ItemWithSupplier[]>([])
  const [counts,     setCounts]     = useState<Record<string, number>>({})
  const [search,     setSearch]     = useState('')
  const [filterSup,  setFilterSup]  = useState('')
  const [countedBy,  setCountedBy]  = useState('')
  const [loading,    setLoading]    = useState(true)

  // Restore staff name from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(NAME_KEY)
    if (saved) setCountedBy(saved)
  }, [])

  function handleNameChange(name: string) {
    setCountedBy(name)
    localStorage.setItem(NAME_KEY, name)
  }

  // Fetch items once
  useEffect(() => {
    getActiveItemsWithSuppliers(supabase)
      .then(setItems)
      .catch(console.error)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch counts whenever week or store changes
  useEffect(() => {
    setLoading(true)
    getCountsForWeek(supabase, store.id, weekStart)
      .then((rows) => {
        const map: Record<string, number> = {}
        rows.forEach((r) => { map[r.item_id] = r.quantity })
        setCounts(map)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.id, weekStart])

  const handleSave = useCallback(
    async (itemId: string, quantity: number) => {
      // Optimistically update local state
      setCounts((prev) => ({ ...prev, [itemId]: quantity }))

      await upsertCount(supabase, {
        store_id:   store.id,
        item_id:    itemId,
        week_start: weekStart,
        quantity,
        counted_by: countedBy || null,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.id, weekStart, countedBy]
  )

  // Unique suppliers for the filter dropdown
  const suppliers = useMemo(() => {
    const seen = new Map<string, string>()
    items.forEach((i) => seen.set(i.suppliers.id, i.suppliers.name))
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [items])

  // Group filtered items by supplier, preserving display_order
  const grouped = useMemo(() => {
    const term = search.toLowerCase()
    const filtered = items.filter((i) =>
      (!filterSup || i.suppliers.id === filterSup) &&
      (!term || i.name.toLowerCase().includes(term) || i.category.toLowerCase().includes(term))
    )

    const map = new Map<string, { displayOrder: number; items: ItemWithSupplier[] }>()
    filtered.forEach((item) => {
      const sup = item.suppliers
      if (!map.has(sup.name)) {
        map.set(sup.name, { displayOrder: sup.display_order, items: [] })
      }
      map.get(sup.name)!.items.push(item)
    })

    return Array.from(map.entries())
      .sort((a, b) => a[1].displayOrder - b[1].displayOrder)
      .map(([name, { items }]) => ({ name, items }))
  }, [items, search])

  const totalCounted = Object.keys(counts).length
  const totalLow     = items.filter((i) => (counts[i.id] ?? 0) <= i.min_stock && counts[i.id] !== undefined).length

  return (
    <div className="flex flex-col gap-4">
      {/* Staff name */}
      <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 border border-[#3E2723]/10 shadow-sm">
        <User size={16} className="text-[#3E2723]/40 shrink-0" />
        <input
          type="text"
          value={countedBy}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Your name (saved locally)"
          className="flex-1 text-sm text-[#3E2723] bg-transparent focus:outline-none placeholder:text-[#3E2723]/35"
        />
      </div>

      {/* Week picker + stats bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <WeekPicker value={weekStart} onChange={setWeekStart} />
        {!loading && (
          <div className="flex gap-3 text-xs text-[#3E2723]/60">
            <span><strong className="text-[#3E2723]">{totalCounted}</strong> counted</span>
            {totalLow > 0 && (
              <span className="text-[#C8102E] font-semibold">{totalLow} low</span>
            )}
          </div>
        )}
      </div>

      {/* Filters row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3E2723]/40 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className="w-full rounded-xl border border-[#3E2723]/20 bg-white pl-9 pr-4 py-2.5 text-sm text-[#3E2723] placeholder:text-[#3E2723]/35 focus:outline-none focus:ring-2 focus:ring-[#D4A24C]"
          />
        </div>
        <select
          value={filterSup}
          onChange={(e) => setFilterSup(e.target.value)}
          className="rounded-xl border border-[#3E2723]/20 bg-white px-3 py-2.5 text-sm text-[#3E2723] focus:outline-none focus:ring-2 focus:ring-[#D4A24C] shrink-0"
        >
          <option value="">All suppliers</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Item groups */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full w-8 h-8 border-2 border-[#D4A24C] border-t-transparent" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-16 text-[#3E2723]/40 text-sm">
          No items found{search ? ` for "${search}"` : ''}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {grouped.map(({ name, items: groupItems }) => (
            <SupplierGroup
              key={name}
              supplierName={name}
              items={groupItems}
              counts={counts}
              onSave={handleSave}
            />
          ))}
        </div>
      )}
    </div>
  )
}
