'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function BanGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true)
  const [supabase] = useState(() => createClient())
  const router = useRouter()

  useEffect(() => {
    async function checkBan() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setChecking(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_banned')
        .eq('id', user.id)
        .single()

      if (profile?.is_banned) {
        await supabase.auth.signOut()
        router.push('/login?banned=1')
        return
      }

      setChecking(false)
    }

    checkBan()
  }, [router, supabase])

  if (checking) return null

  return children
}