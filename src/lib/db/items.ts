import type { SupabaseClient } from '@supabase/supabase-js'
import type { ItemWithSupplier } from '@/types/db'

export async function getActiveItemsWithSuppliers(
  supabase: SupabaseClient<any>
): Promise<ItemWithSupplier[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*, suppliers(*)')
    .eq('active', true)
    .order('name')

  if (error) throw error
  return data as ItemWithSupplier[]
}
