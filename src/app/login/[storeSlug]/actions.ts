'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStoreBySlug } from '@/lib/db/stores'

export async function verifyPin(
  storeSlug: string,
  formData: FormData
): Promise<{ error: string } | void> {
  const pin = (formData.get('pin') as string | null)?.trim() ?? ''

  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    return { error: 'Please enter a valid 4-digit PIN.' }
  }

  const supabase = await createClient()

  // Look up the store (anon select — store data is readable pre-auth for this check)
  const store = await getStoreBySlug(supabase, storeSlug)

  if (!store) {
    return { error: 'Store not found.' }
  }

  if (store.pin !== pin) {
    return { error: 'Incorrect PIN. Please try again.' }
  }

  // PIN correct — sign in anonymously with store metadata attached
  const { error: signInError } = await supabase.auth.signInAnonymously({
    options: {
      data: {
        store_id:   store.id,
        store_slug: store.slug,
        store_name: store.name,
      },
    },
  })

  if (signInError) {
    console.error('Anonymous sign-in error:', signInError)
    return { error: 'Sign-in failed. Please try again.' }
  }

  redirect('/app/count')
}
