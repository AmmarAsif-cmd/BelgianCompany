'use client'

import { useEffect, useMemo, useState } from 'react'
import { Archive, Search } from 'lucide-react'
import { useStore } from '@/components/StoreProvider'
import { WeekPicker } from '@/components/WeekPicker'
import { createClient } from '@/lib/supabase/client'
import { getActiveItemsWithSuppliers } from '@/lib/db/items'
import { getCountsForWeek } from '@/lib/db/counts'
import { formatISODate, getMondayOfWeek, toISODate } from '@/lib/utils/week'
import type { ItemWithSupplier } from '@/types/db'

export default function StockPage() {
  const store    = useStore()
  const supabase = createClient()

  const [weekStart, setWeekStart] = useState(() => toISODate(getMondayOfWeek()))
  const [items,     setItems]     = useState<ItemWithSupplier[]>([])
  const [counts,    setCounts]    = useState<Record<string, number>>({})
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [filterSup, setFilterSup] = useState('')

  const normalizeSupplierName = (name: string) => name.trim().toLowerCase()

  // Fetch items once
  useEffect(() => {
    getActiveItemsWithSuppliers(supabase)
      .then(setItems)
      .catch(console.error)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch counts when week/store changes
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

  // Unique suppliers for dropdown
  const suppliers = useMemo(() => {
    const seen = new Map<string, string>()
    items.forEach((i) => {
      const normalized = normalizeSupplierName(i.suppliers.name)
      if (!seen.has(normalized)) seen.set(normalized, i.suppliers.name.trim())
    })
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [items])

  // Filtered + grouped by supplier
  const grouped = useMemo(() => {
    const term = search.toLowerCase()
    const filtered = items.filter((i) =>
      (!filterSup || normalizeSupplierName(i.suppliers.name) === filterSup) &&
      (!term || i.name.toLowerCase().includes(term) || i.category.toLowerCase().includes(term))
    )

    const map = new Map<string, { displayOrder: number; name: string; items: ItemWithSupplier[] }>()
    filtered.forEach((item) => {
      const sup = item.suppliers
      const normalized = normalizeSupplierName(sup.name)
      if (!map.has(normalized)) {
        map.set(normalized, { displayOrder: sup.display_order, name: sup.name.trim(), items: [] })
      }
      map.get(normalized)!.items.push(item)
    })

    return Array.from(map.entries())
      .sort((a, b) => a[1].displayOrder - b[1].displayOrder)
      .map(([id, { name, items }]) => ({ id, name, items }))
  }, [items, search, filterSup])

  // Stats
  const stats = useMemo(() => {
    const term = search.toLowerCase()
    const visible = items.filter((i) =>
      (!filterSup || normalizeSupplierName(i.suppliers.name) === filterSup) &&
      (!term || i.name.toLowerCase().includes(term) || i.category.toLowerCase().includes(term))
    )
    const counted  = visible.filter((i) => counts[i.id] !== undefined).length
    const low      = visible.filter((i) => counts[i.id] !== undefined && counts[i.id] <= i.min_stock).length
    const uncounted = visible.length - counted
    return { total: visible.length, counted, low, uncounted }
  }, [items, counts, filterSup, search])

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-[#3E2723]">Stock Listings</h1>
        <p className="text-xs text-[#3E2723]/55 mt-0.5">{store.name}</p>
      </div>

      {/* Week picker */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <WeekPicker value={weekStart} onChange={setWeekStart} />
        <p className="text-xs text-[#3E2723]/45">Week of {formatISODate(weekStart)}</p>
      </div>

      {/* Stats bar */}
      {!loading && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          <div className="rounded-xl bg-white border border-[#3E2723]/10 shadow-sm px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-[#3E2723]">{stats.total}</p>
            <p className="text-[10px] text-[#3E2723]/50 uppercase tracking-wide">Total</p>
          </div>
          <div className="rounded-xl bg-white border border-[#3E2723]/10 shadow-sm px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-green-600">{stats.counted}</p>
            <p className="text-[10px] text-[#3E2723]/50 uppercase tracking-wide">Counted</p>
          </div>
          <div className="rounded-xl bg-white border border-[#3E2723]/10 shadow-sm px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-[#C8102E]">{stats.low}</p>
            <p className="text-[10px] text-[#3E2723]/50 uppercase tracking-wide">Low</p>
          </div>
          <div className="rounded-xl bg-white border border-[#3E2723]/10 shadow-sm px-3 py-2.5 text-center sm:block hidden">
            <p className="text-lg font-bold text-[#3E2723]/40">{stats.uncounted}</p>
            <p className="text-[10px] text-[#3E2723]/50 uppercase tracking-wide">Uncounted</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3E2723]/40 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className="w-full rounded-xl border border-[#3E2723]/20 bg-white pl-8 pr-3 py-2.5 text-sm text-[#3E2723] placeholder:text-[#3E2723]/35 focus:outline-none focus:ring-2 focus:ring-[#D4A24C]"
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
        {(search || filterSup) && (
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setFilterSup('')
            }}
            className="rounded-xl border border-[#3E2723]/20 bg-white px-3 py-2.5 text-sm text-[#3E2723]/70 hover:bg-[#3E2723]/5"
          >
            Reset
          </button>
        )}
      </div>

      {/* Stock list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full w-8 h-8 border-2 border-[#D4A24C] border-t-transparent" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <Archive size={40} className="text-[#3E2723]/20" />
          <p className="text-[#3E2723]/50 text-sm">No items found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map(({ id, name, items: groupItems }) => {
            const groupLow = groupItems.filter((i) => counts[i.id] !== undefined && counts[i.id] <= i.min_stock).length
            return (
              <div key={id} className="rounded-2xl overflow-hidden border border-[#3E2723]/10 bg-white shadow-sm">
                {/* Supplier header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#3E2723]">
                  <span className="text-[#FFF8E7] font-semibold text-sm">{name}</span>
                  <div className="flex items-center gap-2">
                    {groupLow > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#C8102E]/25 text-[#C8102E] font-semibold">
                        {groupLow} low
                      </span>
                    )}
                    <span className="text-[#FFF8E7]/50 text-xs">{groupItems.length} item{groupItems.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Items */}
                {groupItems.map((item) => {
                  const qty       = counts[item.id]
                  const counted   = qty !== undefined
                  const isLow     = counted && qty <= item.min_stock
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-4 py-3 border-b border-[#3E2723]/8 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#3E2723] truncate">{item.name}</p>
                        <p className="text-xs text-[#3E2723]/45">{item.category} · min {item.min_stock}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        {isLow && (
                          <span className="text-[10px] font-bold text-[#C8102E] bg-[#C8102E]/10 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                            Low
                          </span>
                        )}
                        <div className="text-right">
                          {counted ? (
                            <>
                              <p className={`text-sm font-bold ${isLow ? 'text-[#C8102E]' : 'text-[#3E2723]'}`}>{qty}</p>
                              <p className="text-[10px] text-[#3E2723]/40">in stock</p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-bold text-[#3E2723]/25">—</p>
                              <p className="text-[10px] text-[#3E2723]/30">uncounted</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
