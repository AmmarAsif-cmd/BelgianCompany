'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { ClipboardCopy, PackageSearch, Save, CheckCircle, Trash2, Clock } from 'lucide-react'
import { useStore } from '@/components/StoreProvider'
import { ToastContainer, useToast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { getActiveItemsWithSuppliers } from '@/lib/db/items'
import { getCountsForWeek } from '@/lib/db/counts'
import { getSavedOrders, upsertSavedOrder, updateSavedOrderStatus, deleteSavedOrder } from '@/lib/db/saved_orders'
import type { SavedOrder, SavedOrderItem } from '@/lib/db/saved_orders'
import { getMondayOfWeek, toISODate, formatWeekLabel } from '@/lib/utils/week'
import type { ItemWithSupplier } from '@/types/db'

type Tab = 'current' | 'history'

type OrderItem = {
  item: ItemWithSupplier
  currentCount: number
  suggestedOrder: number
}

function formatOrderText(storeName: string, supplierName: string, weekStart: string, items: SavedOrderItem[]) {
  const lines = items.map((i) => `• ${i.item_name} — have ${i.current_stock}, order ${i.order_qty}`)
  return [`📦 Order for ${supplierName} (${storeName})`, `Week of ${weekStart}`, '', ...lines].join('\n')
}

export default function OrdersPage() {
  const store    = useStore()
  const supabase = createClient()
  const { toasts, addToast, dismissToast } = useToast()

  const weekStart = toISODate(getMondayOfWeek())
  const [tab, setTab] = useState<Tab>('current')

  // Current tab state
  const [items,   setItems]   = useState<ItemWithSupplier[]>([])
  const [counts,  setCounts]  = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  // History tab state
  const [savedOrders,    setSavedOrders]    = useState<SavedOrder[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [deleteTarget,   setDeleteTarget]   = useState<SavedOrder | null>(null)

  // Load current week data
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
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [store.id, weekStart]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load history when tab switches
  useEffect(() => {
    if (tab !== 'history') return
    setHistoryLoading(true)
    getSavedOrders(supabase, store.id)
      .then(setSavedOrders)
      .catch(console.error)
      .finally(() => setHistoryLoading(false))
  }, [tab, store.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Group low items by supplier
  const lowBySupplier = useMemo(() => {
    const low: OrderItem[] = items
      .filter((i) => counts[i.id] !== undefined && counts[i.id] <= i.min_stock)
      .map((i) => ({
        item: i,
        currentCount: counts[i.id],
        suggestedOrder: Math.max(i.min_stock * 2 - counts[i.id], 1),
      }))

    const map = new Map<string, { supplierId: string; displayOrder: number; orderItems: OrderItem[] }>()
    low.forEach((oi) => {
      const sup = oi.item.suppliers
      if (!map.has(sup.name)) map.set(sup.name, { supplierId: sup.id, displayOrder: sup.display_order, orderItems: [] })
      map.get(sup.name)!.orderItems.push(oi)
    })
    return Array.from(map.entries())
      .sort((a, b) => a[1].displayOrder - b[1].displayOrder)
      .map(([name, { supplierId, orderItems }]) => ({ name, supplierId, orderItems }))
  }, [items, counts])

  async function copyOrder(supplierName: string, orderItems: OrderItem[] | SavedOrderItem[], storeName = store.name, week = weekStart) {
    const lines = (orderItems as any[]).map((oi) =>
      'item' in oi
        ? `• ${oi.item.name} — have ${oi.currentCount}, order ${oi.suggestedOrder}`
        : `• ${oi.item_name} — have ${oi.current_stock}, order ${oi.order_qty}`
    )
    const text = [`📦 Order for ${supplierName} (${storeName})`, `Week of ${week}`, '', ...lines].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      addToast('Order copied — paste into WhatsApp', 'success')
    } catch {
      addToast('Could not copy — please screenshot', 'error')
    }
  }

  async function saveOrder(supplierName: string, supplierId: string, orderItems: OrderItem[]) {
    try {
      await upsertSavedOrder(supabase, {
        store_id:      store.id,
        supplier_id:   supplierId,
        supplier_name: supplierName,
        week_start:    weekStart,
        status:        'pending',
        notes:         null,
        items: orderItems.map((oi) => ({
          item_id:       oi.item.id,
          item_name:     oi.item.name,
          current_stock: oi.currentCount,
          order_qty:     oi.suggestedOrder,
        })),
      })
      addToast(`Order saved for ${supplierName}`)
    } catch (e: any) {
      addToast(e.message ?? 'Save failed', 'error')
    }
  }

  async function toggleStatus(order: SavedOrder) {
    const next = order.status === 'pending' ? 'sent' : 'pending'
    try {
      await updateSavedOrderStatus(supabase, order.id, next)
      setSavedOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: next } : o))
      addToast(next === 'sent' ? 'Marked as sent ✓' : 'Marked as pending')
    } catch (e: any) {
      addToast(e.message ?? 'Update failed', 'error')
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteSavedOrder(supabase, deleteTarget.id)
      setSavedOrders((prev) => prev.filter((o) => o.id !== deleteTarget.id))
      addToast('Order deleted')
      setDeleteTarget(null)
    } catch (e: any) {
      addToast(e.message ?? 'Delete failed', 'error')
    }
  }

  // Group saved orders by week for history view
  const historyByWeek = useMemo(() => {
    const map = new Map<string, SavedOrder[]>()
    savedOrders.forEach((o) => {
      if (!map.has(o.week_start)) map.set(o.week_start, [])
      map.get(o.week_start)!.push(o)
    })
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [savedOrders])

  const currentMonday = getMondayOfWeek()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#3E2723]">Orders</h1>
          <p className="text-xs text-[#3E2723]/55 mt-0.5">{store.name}</p>
        </div>
        {/* Tab switcher */}
        <div className="flex rounded-xl border border-[#3E2723]/15 overflow-hidden text-xs font-medium">
          {(['current', 'history'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 capitalize transition-colors ${tab === t ? 'bg-[#3E2723] text-[#FFF8E7]' : 'bg-white text-[#3E2723]/60 hover:bg-[#3E2723]/5'}`}
            >
              {t === 'current' ? 'Low Stock' : 'Saved Orders'}
            </button>
          ))}
        </div>
      </div>

      {/* ── CURRENT TAB ── */}
      {tab === 'current' && (
        <>
          <p className="text-xs text-[#3E2723]/45">Week of {weekStart} · items at or below minimum</p>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full w-8 h-8 border-2 border-[#D4A24C] border-t-transparent" />
            </div>
          ) : lowBySupplier.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <PackageSearch size={40} className="text-[#3E2723]/20" />
              <p className="text-[#3E2723]/50 text-sm">No items need ordering right now.</p>
              <p className="text-[#3E2723]/35 text-xs">Items appear here once counted and below minimum.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {lowBySupplier.map(({ name, supplierId, orderItems }) => (
                <div key={name} className="rounded-2xl overflow-hidden border border-[#3E2723]/10 bg-white shadow-sm">
                  <div className="flex items-center justify-between px-4 py-3 bg-[#3E2723]">
                    <div>
                      <span className="text-[#FFF8E7] font-semibold text-sm">{name}</span>
                      <span className="ml-2 text-[#FFF8E7]/55 text-xs">{orderItems.length} item{orderItems.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => copyOrder(name, orderItems)} className="text-[#D4A24C] hover:bg-white/10 gap-1 text-xs px-2">
                        <ClipboardCopy size={13} /> Copy
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => saveOrder(name, supplierId, orderItems)} className="text-green-400 hover:bg-white/10 gap-1 text-xs px-2">
                        <Save size={13} /> Save
                      </Button>
                    </div>
                  </div>
                  {orderItems.map(({ item, currentCount, suggestedOrder }) => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-3 border-b border-[#3E2723]/8 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-[#3E2723]">{item.name}</p>
                        <p className="text-xs text-[#3E2723]/50">{item.category} · min {item.min_stock}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-[#3E2723]/50">have <span className="font-bold text-[#C8102E]">{currentCount}</span></div>
                        <div className="text-xs text-[#3E2723]/50">order <span className="font-bold text-[#3E2723]">{suggestedOrder}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <>
          {historyLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full w-8 h-8 border-2 border-[#D4A24C] border-t-transparent" />
            </div>
          ) : historyByWeek.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <Clock size={40} className="text-[#3E2723]/20" />
              <p className="text-[#3E2723]/50 text-sm">No saved orders yet.</p>
              <p className="text-[#3E2723]/35 text-xs">Hit "Save" on the Low Stock tab to save an order here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {historyByWeek.map(([week, orders]) => {
                const weekDate = new Date(week + 'T00:00:00Z')
                const label = formatWeekLabel(weekDate, currentMonday)
                return (
                  <div key={week}>
                    <p className="text-xs font-bold text-[#3E2723]/40 uppercase tracking-wide mb-2">{label} · {week}</p>
                    <div className="flex flex-col gap-3">
                      {orders.map((order) => (
                        <div key={order.id} className="rounded-2xl overflow-hidden border border-[#3E2723]/10 bg-white shadow-sm">
                          {/* Header */}
                          <div className="flex items-center justify-between px-4 py-3 bg-[#3E2723]">
                            <div className="flex items-center gap-2">
                              <span className="text-[#FFF8E7] font-semibold text-sm">{order.supplier_name}</span>
                              <span className="text-[#FFF8E7]/50 text-xs">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${order.status === 'sent' ? 'bg-green-500/20 text-green-300' : 'bg-[#D4A24C]/20 text-[#D4A24C]'}`}>
                                {order.status === 'sent' ? '✓ Sent' : '● Pending'}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => copyOrder(order.supplier_name, order.items, store.name, order.week_start)} className="text-[#D4A24C] hover:bg-white/10 gap-1 text-xs px-2">
                                <ClipboardCopy size={13} />
                              </Button>
                              <Button
                                variant="ghost" size="sm"
                                onClick={() => toggleStatus(order)}
                                className="text-green-400 hover:bg-white/10 gap-1 text-xs px-2"
                                title={order.status === 'sent' ? 'Mark pending' : 'Mark sent'}
                              >
                                <CheckCircle size={13} />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(order)} className="text-[#C8102E]/70 hover:bg-white/10 px-2">
                                <Trash2 size={13} />
                              </Button>
                            </div>
                          </div>
                          {/* Items */}
                          {order.items.map((oi, i) => (
                            <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-[#3E2723]/8 last:border-0">
                              <p className="text-sm text-[#3E2723]">{oi.item_name}</p>
                              <div className="text-right text-xs text-[#3E2723]/50">
                                have <span className="font-bold text-[#C8102E]">{oi.current_stock}</span>
                                {' · '}order <span className="font-bold text-[#3E2723]">{oi.order_qty}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Saved Order"
        message={`Delete the saved order for "${deleteTarget?.supplier_name}" (week of ${deleteTarget?.week_start})?`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
