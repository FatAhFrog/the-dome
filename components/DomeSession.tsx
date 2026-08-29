'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { DomeSession } from '@/lib/dome-session'

const DomeSessionContext = createContext<DomeSession | null>(null)

/**
 * The only client auth source inside `(dome)`.
 * Seeded by the server layout's `getDomeSession()` — do not call `getUser()` on mount.
 */
export function DomeSessionProvider({
  session,
  children,
}: {
  session: DomeSession
  children: ReactNode
}) {
  return (
    <DomeSessionContext.Provider value={session}>
      {children}
    </DomeSessionContext.Provider>
  )
}

export function useDomeSession(): DomeSession {
  const session = useContext(DomeSessionContext)
  if (!session) {
    throw new Error('useDomeSession must be used under DomeSessionProvider')
  }
  return session
}
