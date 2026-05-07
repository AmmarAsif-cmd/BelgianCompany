'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { useToast, ToastContainer } from '@/components/ui/Toast'
import type { Supplier } from '@/types/db'

type SupplierWithCount = Supplier & { item_count: number }

export default function AdminSuppliersPage() {
  const supabase = createClient()
  const { toasts, addToast, dismissToast } = useToast()

  const [suppliers, setSuppliers] = useState<SupplierWithCount[]>([])
  const [loading,   setLoading]   = useState(true)

  const [modalOpen,   setModalOpen]   = useState(false)
  const [editTarget,  setEditTarget]  = useState<Supplier | null>(null)
  const [name,        setName]        = useState('')
  const [saving,      setSaving]      = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<SupplierWithCount | null>(null)
  const [deleting,     setDeleting]     = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('suppliers')
      .select('*, items(count)')
      .order('display_order')

    const rows: SupplierWithCount[] = (data ?? []).map((s: any) => ({
      ...s,
      item_count: s.items?.[0]?.count ?? 0,
    }))
    setSuppliers(rows)
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function openAdd() {
    setEditTarget(null)
    setName('')
    setModalOpen(true)
  }

  function openEdit(s: Supplier) {
    setEditTarget(s)
    setName(s.name)
    setModalOpen(true)
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      if (editTarget) {
        const { error } = await supabase.from('suppliers').update({ name: name.trim() }).eq('id', editTarget.id)
        if (error) throw error
        addToast('Supplier updated')
      } else {
        const maxOrder = suppliers.length ? Math.max(...suppliers.map((s) => s.display_order)) : 0
        const { error } = await supabase.from('suppliers').insert({ name: name.trim(), display_order: maxOrder + 1 })
        if (error) throw error
        addToast('Supplier added')
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
    if (deleteTarget.item_count > 0) {
      addToast('Cannot delete — supplier has items. Remove or reassign them first.', 'error')
      setDeleteTarget(null)
      return
    }
    setDeleting(true)
    try {
      const { error } = await supabase.from('suppliers').delete().eq('id', deleteTarget.id)
      if (error) throw error
      addToast('Supplier deleted')
      setDeleteTarget(null)
      await load()
    } catch (e: any) {
      addToast(e.message ?? 'Delete failed', 'error')
    } finally {
      setDeleting(false)
    }
  }

  async function move(index: number, direction: 'up' | 'down') {
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= suppliers.length) return

    const a = suppliers[index]
    const b = suppliers[swapIndex]

    await Promise.all([
      supabase.from('suppliers').update({ display_order: b.display_order }).eq('id', a.id),
      supabase.from('suppliers').update({ display_order: a.display_order }).eq('id', b.id),
    ])
    await load()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link href="/app/admin" className="p-1.5 rounded-lg hover:bg-[#3E2723]/10 text-[#3E2723]/50">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-[#3E2723]">Suppliers</h1>
          <p className="text-xs text-[#3E2723]/50">{suppliers.length} total</p>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-1.5">
          <Plus size={15} /> Add
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full w-7 h-7 border-2 border-[#D4A24C] border-t-transparent" />
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-[#3E2723]/10 bg-white shadow-sm">
          {suppliers.map((sup, idx) => (
            <div
              key={sup.id}
              className={`flex items-center gap-3 px-4 py-3 ${idx !== suppliers.length - 1 ? 'border-b border-[#3E2723]/8' : ''}`}
            >
              {/* Order number */}
              <span className="text-xs font-bold text-[#3E2723]/30 w-5 text-center shrink-0">{idx + 1}</span>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#3E2723]">{sup.name}</p>
                <p className="text-xs text-[#3E2723]/40">{sup.item_count} item{sup.item_count !== 1 ? 's' : ''}</p>
              </div>

              {/* Reorder */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  onClick={() => move(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1 rounded hover:bg-[#3E2723]/10 text-[#3E2723]/40 disabled:opacity-20"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => move(idx, 'down')}
                  disabled={idx === suppliers.length - 1}
                  className="p-1 rounded hover:bg-[#3E2723]/10 text-[#3E2723]/40 disabled:opacity-20"
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              <button onClick={() => openEdit(sup)} className="p-2 rounded-lg hover:bg-[#D4A24C]/15 text-[#3E2723]/40 hover:text-[#3E2723]">
                <Pencil size={15} />
              </button>
              <button onClick={() => setDeleteTarget(sup)} className="p-2 rounded-lg hover:bg-[#C8102E]/10 text-[#3E2723]/40 hover:text-[#C8102E]">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Supplier' : 'Add Supplier'}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-[#3E2723]/60 uppercase tracking-wide">Supplier Name *</label>
            <input
              value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#3E2723]/20 bg-white px-3 py-2.5 text-sm text-[#3E2723] focus:outline-none focus:ring-2 focus:ring-[#D4A24C]"
              placeholder="e.g. Zahid Bhai"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Supplier'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Supplier"
        message={
          deleteTarget && deleteTarget.item_count > 0
            ? `Cannot delete — "${deleteTarget.name}" has ${deleteTarget.item_count} items. Reassign them first.`
            : `Delete "${deleteTarget?.name}"?`
        }
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
