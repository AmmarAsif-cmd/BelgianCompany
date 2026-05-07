import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStoreBySlug } from '@/lib/db/stores'
import { StoreProvider } from '@/components/StoreProvider'
import { BrandHeader } from '@/components/BrandHeader'
import { BottomTabs } from '@/components/BottomTabs'
import { getMondayOfWeek, toISODate, formatWeekLabel } from '@/lib/utils/week'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const meta       = user.user_metadata as { store_id?: string; store_slug?: string; store_name?: string }
  const storeSlug  = meta?.store_slug

  if (!storeSlug) {
    // Metadata missing — sign out and restart
    await supabase.auth.signOut()
    redirect('/')
  }

  const store = await getStoreBySlug(supabase, storeSlug)

  if (!store) {
    await supabase.auth.signOut()
    redirect('/')
  }

  const currentMonday = getMondayOfWeek()
  const weekLabel     = formatWeekLabel(currentMonday, currentMonday)

  return (
    <StoreProvider
      store={{
        id:         store.id,
        name:       store.name,
        slug:       store.slug,
        brandColor: store.brand_color,
      }}
    >
      <div className="flex flex-col min-h-screen bg-[#FFF8E7]">
        <BrandHeader weekLabel={weekLabel} />
        <BottomTabs />

        {/* Main content — padded so it doesn't hide behind the bottom tab bar on mobile */}
        <main className="flex-1 pb-20 md:pb-6">
          <div className="mx-auto max-w-4xl w-full px-4 py-4">
            {children}
          </div>
        </main>
      </div>
    </StoreProvider>
  )
}
