import { redirect } from 'next/navigation'
import SidePanel from '@/components/SidePanel'
import ThemeLoader from '@/components/ThemeLoader'
import { DomeSessionProvider } from '@/components/DomeSession'
import { getDomeSession } from '@/lib/dome-session'
import { createClient } from '@/lib/supabase/server'
import { themeCssText } from '@/lib/themes'

export default async function DomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getDomeSession()

  if (session.profile?.is_banned) {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login?banned=1')
  }

  return (
    <DomeSessionProvider session={session}>
      <style dangerouslySetInnerHTML={{ __html: themeCssText(session.profile?.active_theme) }} />
      <div style={{ display: 'flex', height: '100vh' }}>
        <ThemeLoader />
        <SidePanel />
        <div
          style={{
            flex: 1,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {children}
        </div>
      </div>
    </DomeSessionProvider>
  )
}
