import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getStores } from '@/lib/db/stores'
import { MapPin } from 'lucide-react'

export default async function StorePickerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Already logged in — send them straight to the app
  if (user) {
    redirect('/app/count')
  }

  const STATIC_STORES = [
    { id: '', name: 'Stockport Road', slug: 'stockport-road', brand_color: '#5D4037', pin: '', created_at: '' },
    { id: '', name: 'Sale',           slug: 'sale',           brand_color: '#8B5A3C', pin: '', created_at: '' },
  ]

  let stores: Awaited<ReturnType<typeof getStores>> = STATIC_STORES
  try {
    const fetched = await getStores(supabase)
    // RLS silently returns [] for unauthenticated requests — fall back to static list
    if (fetched.length > 0) stores = fetched
  } catch {
    // env vars not set yet — static fallback already assigned above
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#FFF8E7] px-4 py-12">
      {/* Logo / header */}
      <div className="mb-10 text-center">
        <div className="text-5xl mb-3">🧇</div>
        <h1 className="text-2xl font-bold text-[#3E2723]">The Belgian Waffle Company</h1>
        <p className="text-[#3E2723]/60 mt-1 text-sm">Weekly Stock Tracker</p>
      </div>

      <p className="text-[#3E2723]/70 mb-6 text-sm font-medium uppercase tracking-wide">
        Choose your store
      </p>

      <div className="w-full max-w-sm flex flex-col gap-4">
        {stores.map((store) => (
          <Link
            key={store.slug}
            href={`/login/${store.slug}`}
            className="group flex items-center gap-4 rounded-2xl p-5 shadow-md transition-transform active:scale-95 hover:scale-[1.02]"
            style={{ backgroundColor: store.brand_color }}
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <MapPin size={20} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-tight">{store.name}</div>
              <div className="text-white/70 text-xs mt-0.5">Tap to enter PIN</div>
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-12 text-xs text-[#3E2723]/30 text-center">
        The Belgian Waffle Company · Internal use only
      </p>
    </main>
  )
}
