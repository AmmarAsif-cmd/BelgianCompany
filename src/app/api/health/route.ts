import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const checks: Record<string, string> = {
    supabase_url:  url  ? `✅ Set (${url})` : '❌ MISSING',
    supabase_key:  key  ? `✅ Set (ends in ...${key.slice(-6)})` : '❌ MISSING',
  }

  // Try a live DB query
  if (url && key) {
    try {
      const supabase = createClient(url, key)
      const { data, error } = await supabase.from('stores').select('name')
      if (error) {
        checks.db_query = `❌ Error: ${error.message}`
      } else {
        checks.db_query = `✅ Connected — stores found: ${data.map((s: any) => s.name).join(', ') || 'none (run seed.sql?)'}`
      }
    } catch (e: any) {
      checks.db_query = `❌ Exception: ${e.message}`
    }
  } else {
    checks.db_query = '⏭️ Skipped (env vars missing)'
  }

  return NextResponse.json(checks, { status: 200 })
}
