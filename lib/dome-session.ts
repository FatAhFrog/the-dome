import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/** Shell profile columns owned by the (dome) layout — not Tetris/profile feature fields. */
export type DomeProfile = {
  is_banned: boolean
  active_theme: string | null
  news_enabled: boolean
  news_category: string | null
}

/** Serializable identity for the client provider. Full Auth user stays on the server. */
export type DomeUser = {
  id: string
}

export type DomeSession = {
  user: DomeUser | null
  profile: DomeProfile | null
}

/**
 * Single server auth + shell-profile read for the (dome) tree.
 * `cache()` dedupes this within one RSC request (layout + hub).
 * Middleware still calls `getUser()`; that process cannot see this result.
 * Client children must read the same snapshot via `useDomeSession()`, not `getUser()`.
 */
export const getDomeSession = cache(async (): Promise<DomeSession> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_banned, active_theme, news_enabled, news_category')
    .eq('id', user.id)
    .single()

  const domeUser = { id: user.id }
  if (!profile) return { user: domeUser, profile: null }

  return {
    user: domeUser,
    profile: {
      is_banned: profile.is_banned ?? false,
      active_theme: profile.active_theme ?? null,
      news_enabled: profile.news_enabled ?? true,
      news_category: profile.news_category ?? 'general',
    },
  }
})
