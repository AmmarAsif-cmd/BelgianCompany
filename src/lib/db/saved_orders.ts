import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeWeekStartISO } from '@/lib/utils/week'

export type SavedOrderItem = {
  item_id: string
  item_name: string
  current_stock: number
  order_qty: number
}

export type SavedOrder = {
  id: string
  store_id: string
  supplier_id: string | null
  supplier_name: string
  week_start: string
  items: SavedOrderItem[]
  status: 'pending' | 'sent'
  notes: string | null
  created_at: string
  updated_at: string
}

export async function getSavedOrders(
  supabase: SupabaseClient<any>,
  storeId: string
): Promise<SavedOrder[]> {
  const { data, error } = await supabase
    .from('saved_orders')
    .select('*')
    .eq('store_id', storeId)
    .order('week_start', { ascending: false })
    .order('supplier_name')
  if (error) throw error
  return data as SavedOrder[]
}

export async function upsertSavedOrder(
  supabase: SupabaseClient<any>,
  params: Omit<SavedOrder, 'id' | 'created_at' | 'updated_at'>
): Promise<void> {
  const weekStart = normalizeWeekStartISO(params.week_start)
  const { error } = await supabase
    .from('saved_orders')
    .upsert(
      { ...params, week_start: weekStart, updated_at: new Date().toISOString() },
      { onConflict: 'store_id,supplier_id,week_start' }
    )
  if (error) throw error
}

export async function updateSavedOrderStatus(
  supabase: SupabaseClient<any>,
  orderId: string,
  status: 'pending' | 'sent'
): Promise<void> {
  const { error } = await supabase
    .from('saved_orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
  if (error) throw error
}

export async function deleteSavedOrder(
  supabase: SupabaseClient<any>,
  orderId: string
): Promise<void> {
  const { error } = await supabase
    .from('saved_orders')
    .delete()
    .eq('id', orderId)
  if (error) throw error
}
