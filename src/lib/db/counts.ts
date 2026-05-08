import type { SupabaseClient } from '@supabase/supabase-js'
import type { Count } from '@/types/db'
import { normalizeWeekStartISO } from '@/lib/utils/week'

export async function getCountsForWeek(
  supabase: SupabaseClient<any>,
  storeId: string,
  weekStart: string
): Promise<Count[]> {
  const { data, error } = await supabase
    .from('counts')
    .select('*')
    .eq('store_id', storeId)
    .eq('week_start', weekStart)

  if (error) throw error
  return data as Count[]
}

export async function upsertCount(
  supabase: SupabaseClient<any>,
  params: {
    store_id: string
    item_id: string
    week_start: string
    quantity: number
    counted_by?: string | null
  }
): Promise<void> {
  const weekStart = normalizeWeekStartISO(params.week_start)
  const { error } = await supabase.from('counts').upsert(
    {
      store_id:   params.store_id,
      item_id:    params.item_id,
      week_start: weekStart,
      quantity:   params.quantity,
      counted_by: params.counted_by ?? null,
      counted_at: new Date().toISOString(),
    },
    { onConflict: 'store_id,item_id,week_start' }
  )

  if (error) throw error
}

export async function getCountSummaryForWeek(
  supabase: SupabaseClient<any>,
  storeId: string,
  weekStart: string,
  totalItems: number
) {
  const counts = await getCountsForWeek(supabase, storeId, weekStart)
  const counted = counts.length
  const pending = totalItems - counted
  const low     = counts.filter((c) => c.quantity <= 0).length

  return { counted, pending, low, counts }
}
