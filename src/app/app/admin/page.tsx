import Link from 'next/link'
import { Package, Truck } from 'lucide-react'

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold text-[#3E2723]">Admin</h1>
        <p className="text-xs text-[#3E2723]/55 mt-0.5">Manage items, suppliers and settings</p>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/app/admin/items"
          className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 border border-[#3E2723]/10 shadow-sm hover:bg-[#3E2723]/5 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-[#D4A24C]/15 flex items-center justify-center shrink-0">
            <Package size={20} className="text-[#D4A24C]" />
          </div>
          <div>
            <p className="font-semibold text-[#3E2723] text-sm">Items</p>
            <p className="text-xs text-[#3E2723]/50">Add, edit or remove stock items</p>
          </div>
        </Link>

        <Link
          href="/app/admin/suppliers"
          className="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 border border-[#3E2723]/10 shadow-sm hover:bg-[#3E2723]/5 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-[#3E2723]/10 flex items-center justify-center shrink-0">
            <Truck size={20} className="text-[#3E2723]" />
          </div>
          <div>
            <p className="font-semibold text-[#3E2723] text-sm">Suppliers</p>
            <p className="text-xs text-[#3E2723]/50">Manage supplier names and order</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
