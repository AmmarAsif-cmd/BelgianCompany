'use client'

import { useEffect, useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Search, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { useToast, ToastContainer } from '@/components/ui/Toast'
import type { Item, Supplier } from '@/types/db'

type ItemRow = Item & { suppliers: Supplier }

const CATEGORIES = ['Food', 'Chocolate', 'Biscuits', 'Drinks', 'Sweets', 'Cleaning', 'Other']

const EMPTY_FORM = { name: '', category: 'Food', supplier_id: '', min_stock: 2, active: true }

export default function AdminItemsPage() {
  const supabase = createClient()
  const { toasts, addToast, dismissToast } = useToast()

  const [items,     setItems]     = useState<ItemRow[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [filterSup, setFilterSup] = useState('')

  // Modal state
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editItem,   setEditItem]   = useState<Item | null>(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [saving,     setSaving]     = useState(false)

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null)
  const [deleting,     setDeleting]     = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [{ data: itemData, error: itemError }, { data: supData, error: supError }] = await Promise.all([
      supabase.from('items').select('*, suppliers(*)').order('name'),
      supabase.from('suppliers').select('*').order('display_order'),
      ])
      if (itemError) throw itemError
      if (supError) throw supError
      setItems((itemData ?? []) as ItemRow[])
      setSuppliers((supData ?? []) as Supplier[])
    } catch (e: any) {
      addToast(e.message ?? 'Could not load admin items', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function openAdd() {
    setEditItem(null)
    setForm({ ...EMPTY_FORM, supplier_id: suppliers[0]?.id ?? '' })
    setModalOpen(true)
  }

  function openEdit(item: ItemRow) {
    setEditItem(item)
    setForm({
      name: item.name,
      category: item.category,
      supplier_id: item.supplier_id,
      min_stock: item.min_stock,
      active: item.active,
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.supplier_id) return
    setSaving(true)
    try {
      if (editItem) {
        const { error } = await supabase
          .from('items')
          .update({ name: form.name.trim(), category: form.category, supplier_id: form.supplier_id, min_stock: form.min_stock, active: form.active })
          .eq('id', editItem.id)
        if (error) throw error
        addToast('Item updated')
      } else {
        const { error } = await supabase
          .from('items')
          .insert({ name: form.name.trim(), category: form.category, supplier_id: form.supplier_id, min_stock: form.min_stock, active: form.active })
        if (error) throw error
        addToast('Item added')
      }
      setModalOpen(false)
      await load()
    } catch (e: any) {
      addToast(e.message ?? 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('items').delete().eq('id', deleteTarget.id)
      if (error) throw error
      addToast('Item deleted')
      setDeleteTarget(null)
      await load()
    } catch (e: any) {
      addToast(e.message ?? 'Delete failed', 'error')
    } finally {
      setDeleting(false)
    }
  }

  async function toggleActive(item: ItemRow) {
    try {
      const { error } = await supabase.from('items').update({ active: !item.active }).eq('id', item.id)
      if (error) throw error
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, active: !i.active } : i))
    } catch (e: any) {
      addToast(e.message ?? 'Could not update item status', 'error')
    }
  }

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return items.filter((i) =>
      (!filterSup || i.supplier_id === filterSup) &&
      (!term || i.name.toLowerCase().includes(term) || i.category.toLowerCase().includes(term))
    )
  }, [items, search, filterSup])

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/app/admin" className="p-1.5 rounded-lg hover:bg-[#3E2723]/10 text-[#3E2723]/50">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[#3E2723]">Items</h1>
          <p className="text-xs text-[#3E2723]/50">{items.length} total</p>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-1.5">
          <Plus size={15} /> Add Item
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3E2723]/40 pointer-events-none" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className="w-full rounded-xl border border-[#3E2723]/20 bg-white pl-8 pr-3 py-2 text-sm text-[#3E2723] placeholder:text-[#3E2723]/35 focus:outline-none focus:ring-2 focus:ring-[#D4A24C]"
          />
        </div>
        <select
          value={filterSup} onChange={(e) => setFilterSup(e.target.value)}
          className="rounded-xl border border-[#3E2723]/20 bg-white px-3 py-2 text-sm text-[#3E2723] focus:outline-none focus:ring-2 focus:ring-[#D4A24C]"
        >
          <option value="">All suppliers</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full w-7 h-7 border-2 border-[#D4A24C] border-t-transparent" />
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-[#3E2723]/10 bg-white shadow-sm">
          {filtered.length === 0 ? (
            <p className="text-center py-10 text-sm text-[#3E2723]/40">No items found</p>
          ) : filtered.map((item, idx) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-4 py-3 ${idx !== filtered.length - 1 ? 'border-b border-[#3E2723]/8' : ''} ${!item.active ? 'opacity-50' : ''}`}
            >
              {/* Active toggle dot */}
              <button
                onClick={() => toggleActive(item)}
                title={item.active ? 'Active — tap to deactivate' : 'Inactive — tap to activate'}
                className={`w-3 h-3 rounded-full shrink-0 border-2 transition-colors ${item.active ? 'bg-green-500 border-green-500' : 'bg-transparent border-[#3E2723]/30'}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#3E2723] truncate">{item.name}</p>
                <p className="text-xs text-[#3E2723]/50">{item.category} · {item.suppliers?.name} · min {item.min_stock}</p>
              </div>
              <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-[#D4A24C]/15 text-[#3E2723]/40 hover:text-[#3E2723]">
                <Pencil size={15} />
              </button>
              <button onClick={() => setDeleteTarget(item)} className="p-2 rounded-lg hover:bg-[#C8102E]/10 text-[#3E2723]/40 hover:text-[#C8102E]">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Item' : 'Add Item'}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-[#3E2723]/60 uppercase tracking-wide">Name *</label>
            <input
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-xl border border-[#3E2723]/20 bg-white px-3 py-2.5 text-sm text-[#3E2723] focus:outline-none focus:ring-2 focus:ring-[#D4A24C]"
              placeholder="e.g. Nutella"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#3E2723]/60 uppercase tracking-wide">Category *</label>
            <select
              value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 w-full rounded-xl border border-[#3E2723]/20 bg-white px-3 py-2.5 text-sm text-[#3E2723] focus:outline-none focus:ring-2 focus:ring-[#D4A24C]"
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-[#3E2723]/60 uppercase tracking-wide">Supplier *</label>
            <select
              value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
              className="mt-1 w-full rounded-xl border border-[#3E2723]/20 bg-white px-3 py-2.5 text-sm text-[#3E2723] focus:outline-none focus:ring-2 focus:ring-[#D4A24C]"
            >
              <option value="">Select supplier…</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-[#3E2723]/60 uppercase tracking-wide">Minimum Stock *</label>
            <input
              type="number" min={0}
              value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: parseInt(e.target.value) || 0 })}
              className="mt-1 w-full rounded-xl border border-[#3E2723]/20 bg-white px-3 py-2.5 text-sm text-[#3E2723] focus:outline-none focus:ring-2 focus:ring-[#D4A24C]"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => setForm({ ...form, active: !form.active })}
              className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${form.active ? 'bg-green-500' : 'bg-[#3E2723]/20'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm text-[#3E2723]">{form.active ? 'Active' : 'Inactive'}</span>
          </label>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={saving || !form.name.trim() || !form.supplier_id}
            >
              {saving ? 'Saving…' : editItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Item"
        message={`Delete "${deleteTarget?.name}"? This will also remove all stock counts for this item.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
