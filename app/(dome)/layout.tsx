import SidePanel from '@/components/SidePanel'

export default function DomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      <SidePanel />
      <div style={{ flex: 1, minHeight: '100vh', paddingBottom: '80px' }}>{children}</div>
    </div>
  )
}