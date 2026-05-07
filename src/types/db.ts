// TypeScript types matching the Supabase schema exactly.

export type Store = {
  id: string
  name: string
  slug: string
  brand_color: string
  pin: string
  created_at: string
}

export type Supplier = {
  id: string
  name: string
  display_order: number
  created_at: string
}

export type Item = {
  id: string
  name: string
  category: string
  supplier_id: string
  min_stock: number
  active: boolean
  created_at: string
}

export type ItemWithSupplier = Item & {
  suppliers: Supplier
}

export type Count = {
  id: string
  store_id: string
  item_id: string
  week_start: string
  quantity: number
  counted_by: string | null
  counted_at: string
}

// Supabase Database type definition used by the typed client
export type Database = {
  public: {
    Tables: {
      stores: {
        Row: Store
        Insert: Omit<Store, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Store, 'id'>>
      }
      suppliers: {
        Row: Supplier
        Insert: Omit<Supplier, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Supplier, 'id'>>
      }
      items: {
        Row: Item
        Insert: Omit<Item, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Item, 'id'>>
      }
      counts: {
        Row: Count
        Insert: Omit<Count, 'id' | 'counted_at'> & { id?: string; counted_at?: string }
        Update: Partial<Omit<Count, 'id'>>
      }
    }
  }
}
