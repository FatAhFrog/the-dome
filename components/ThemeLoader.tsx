'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { applyThemeVars } from '@/lib/themes'

export default function ThemeLoader() {
  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const { data: profile } = await supabase.from('profiles').select('active_theme').eq('id', user.id).single()
      if (!cancelled) applyThemeVars(profile?.active_theme)
    }

    load()
    return () => { cancelled = true }
  }, [])

  return null
}
