import type { SupabaseClient } from '@supabase/supabase-js'
import type { Store } from '@/types/db'

// Using SupabaseClient<any> — our custom Database type doesn't need to satisfy
// Supabase's internal generic constraints; the query results are cast manually.
export async function getStores(supabase: SupabaseClient<any>): Promise<Store[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('name')

  if (error) throw error
  return data as Store[]
}

export async function getStoreBySlug(
  supabase: SupabaseClient<any>,
  slug: string
): Promise<Store | null> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) return null
  return data as Store
}
