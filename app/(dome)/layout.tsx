import SidePanel from '@/components/SidePanel'
import ThemeLoader from '@/components/ThemeLoader'
import BanGuard from '@/components/BanGuard'

export default function DomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <ThemeLoader />
      <BanGuard>
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
      </BanGuard>
    </div>
  )
}
