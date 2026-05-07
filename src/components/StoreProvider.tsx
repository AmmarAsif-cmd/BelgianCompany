'use client'

import { createContext, useContext } from 'react'

export type StoreInfo = {
  id: string
  name: string
  slug: string
  brandColor: string
}

const StoreContext = createContext<StoreInfo | null>(null)

export function StoreProvider({
  children,
  store,
}: {
  children: React.ReactNode
  store: StoreInfo
}) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore(): StoreInfo {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
