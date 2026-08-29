'use client'

import { useEffect } from 'react'
import { useDomeSession } from '@/components/DomeSession'
import { applyThemeVars } from '@/lib/themes'

/** Applies the layout-owned theme. Does not fetch auth — `useDomeSession` is the source. */
export default function ThemeLoader() {
  const { profile } = useDomeSession()

  useEffect(() => {
    applyThemeVars(profile?.active_theme)
  }, [profile?.active_theme])

  return null
}
