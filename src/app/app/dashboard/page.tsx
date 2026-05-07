'use client'

import { useEffect, useMemo, useState } from 'react'
import { ClipboardList, AlertTriangle, Clock, RefreshCw } from 'lucide-react'
import { useStore } from '@/components/StoreProvider'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { getActiveItemsWithSuppliers } from '@/lib/db/items'
import { getCountsForWeek } from '@/lib/db/counts'
import { getStores } from '@/lib/db/stores'
import { getMondayOfWeek, toISODate } from '@/lib/utils/week'
import type { ItemWithSupplier, Store } from '@/types/db'

type StoreSummary = {
  store: Store
  counted: number
  low: number
  pending: number
  bySupplier: { name: string; counted: number; low: number; total: number }[]
}

export default function DashboardPage() {
  const currentStore = useStore()
  const supabase     = createClient()
  const weekStart    = toISODate(getMondayOfWeek())

  const [items,        setItems]        = useState<ItemWithSupplier[]>([])
  const [stores,       setStores]       = useState<Store[]>([])
  const [allCounts,    setAllCounts]    = useState<Record<string, Record<string, number>>>({})
  const [viewStoreId,  setViewStoreId]  = useState(currentStore.id)
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [allItems, allStores] = await Promise.all([
          getActiveItemsWithSuppliers(supabase),
          getStores(supabase),
        ])
        setItems(allItems)
        setStores(allStores)

        // Fetch counts for all stores in parallel
        const countResults = await Promise.all(
          allStores.map((s) => getCountsForWeek(supabase, s.id, weekStart))
        )
        const countsMap: Record<string, Record<string, number>> = {}
        allStores.forEach((s, idx) => {
          const map: Record<string, number> = {}
          countResults[idx].forEach((c) => { map[c.item_id] = c.quantity })
          countsMap[s.id] = map
        })
        setAllCounts(countsMap)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart])

  const summary: StoreSummary | null = useMemo(() => {
    const store = stores.find((s) => s.id === viewStoreId)
    if (!store || !items.length) return null

    const counts = allCounts[store.id] ?? {}
    const counted = Object.keys(counts).length
    const low     = items.filter((i) => counts[i.id] !== undefined && counts[i.id] <= i.min_stock).length
    const pending = items.length - counted

    // Per-supplier breakdown
    const supMap = new Map<string, { name: string; counted: number; low: number; total: number; order: number }>()
    items.forEach((item) => {
      const sup = item.suppliers
      if (!supMap.has(sup.id)) {
        supMap.set(sup.id, { name: sup.name, counted: 0, low: 0, total: 0, order: sup.display_order })
      }
      const entry = supMap.get(sup.id)!
      entry.total++
      if (counts[item.id] !== undefined) {
        entry.counted++
        if (counts[item.id] <= item.min_stock) entry.low++
      }
    })

    const bySupplier = Array.from(supMap.values())
      .sort((a, b) => a.order - b.order)
      .map(({ name, counted, low, total }) => ({ name, counted, low, total }))

    return { store, counted, low, pending, bySupplier }
  }, [stores, items, allCounts, viewStoreId])

  const otherStore = stores.find((s) => s.id !== currentStore.id)

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full w-8 h-8 border-2 border-[#D4A24C] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-lg font-bold text-[#3E2723]">Dashboard</h1>
          <p className="text-xs text-[#3E2723]/55 mt-0.5">Week of {weekStart}</p>
        </div>

        {/* Store toggle */}
        {otherStore && (
          <div className="flex rounded-xl border border-[#3E2723]/15 overflow-hidden text-xs font-medium">
            {stores.map((s) => (
              <button
                key={s.id}
                onClick={() => setViewStoreId(s.id)}
                className={`px-3 py-2 transition-colors ${
                  viewStoreId === s.id
                    ? 'bg-[#3E2723] text-[#FFF8E7]'
                    : 'bg-white text-[#3E2723]/60 hover:bg-[#3E2723]/5'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {summary ? (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={<ClipboardList size={20} />}
              label="Counted"
              value={summary.counted}
              total={items.length}
              color="text-[#3E2723]"
              bg="bg-[#D4A24C]/15"
            />
            <StatCard
              icon={<AlertTriangle size={20} />}
              label="Low"
              value={summary.low}
              color="text-[#C8102E]"
              bg="bg-[#C8102E]/10"
              highlight={summary.low > 0}
            />
            <StatCard
              icon={<Clock size={20} />}
              label="Pending"
              value={summary.pending}
              total={items.length}
              color="text-[#3E2723]/70"
              bg="bg-[#3E2723]/8"
            />
          </div>

          {/* Per-supplier breakdown */}
          <div>
            <h2 className="text-sm font-semibold text-[#3E2723] mb-3">By Supplier</h2>
            <div className="rounded-2xl overflow-hidden border border-[#3E2723]/10 bg-white shadow-sm">
              {summary.bySupplier.map(({ name, counted, low, total }, idx) => (
                <div
                  key={name}
                  className={`flex items-center justify-between px-4 py-3 ${
                    idx !== summary.bySupplier.length - 1 ? 'border-b border-[#3E2723]/8' : ''
                  }`}
                >
                  <span className="text-sm text-[#3E2723] font-medium">{name}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-[#3E2723]/50">{counted}/{total}</span>
                    {low > 0 && (
                      <span className="text-[#C8102E] font-bold bg-[#C8102E]/10 px-2 py-0.5 rounded-full">
                        {low} low
                      </span>
                    )}
                    {counted === total && (
                      <span className="text-green-600 font-semibold">✓ Done</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {viewStoreId !== currentStore.id && (
            <div className="rounded-xl bg-[#D4A24C]/10 border border-[#D4A24C]/20 px-4 py-3 text-xs text-[#8B5A00] flex items-center gap-2">
              <RefreshCw size={14} />
              You&apos;re viewing <strong>{summary.store.name}</strong>. Switch back to edit your counts.
            </div>
          )}
        </>
      ) : (
        <p className="text-[#3E2723]/40 text-sm text-center py-12">No data yet for this week.</p>
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  total,
  color,
  bg,
  highlight = false,
}: {
  icon: React.ReactNode
  label: string
  value: number
  total?: number
  color: string
  bg: string
  highlight?: boolean
}) {
  return (
    <div className={`rounded-2xl p-4 flex flex-col gap-2 ${bg} ${highlight ? 'ring-1 ring-[#C8102E]/20' : ''}`}>
      <div className={`${color} opacity-70`}>{icon}</div>
      <div className={`text-2xl font-bold leading-none ${color}`}>{value}</div>
      {total !== undefined && (
        <div className="text-xs text-[#3E2723]/40">of {total}</div>
      )}
      <div className="text-xs font-medium text-[#3E2723]/55">{label}</div>
    </div>
  )
}
