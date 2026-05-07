// TODO: Admin panel — planned for a future version.
//
// Potential features:
//   - Add / edit / deactivate items
//   - Change supplier details or display order
//   - Update store PINs
//   - Export counts to CSV
//   - View historical counts across all weeks
//   - Manage multiple stores
//
// For now, all data changes must be made directly in the Supabase SQL editor.

import { Construction } from 'lucide-react'
import Link from 'next/link'

export default function AdminPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <Construction size={48} className="text-[#D4A24C]" />
      <h1 className="text-xl font-bold text-[#3E2723]">Admin Panel</h1>
      <p className="text-sm text-[#3E2723]/60 max-w-xs">
        This page is coming in a future update. For now, make changes directly in
        the Supabase SQL editor.
      </p>
      <Link
        href="/app/count"
        className="mt-4 text-sm text-[#D4A24C] font-semibold underline underline-offset-2"
      >
        Back to counting
      </Link>
    </div>
  )
}
