import SidePanel from '@/components/SidePanel'

export default function DomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <SidePanel />
      <div
        style={{
          flex: 1,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  )
}
