export default function HubCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        border: '1px solid #eee',
        borderRadius: '10px',
        padding: '1.25rem',
        minHeight: '140px',
      }}
    >
      <h2 style={{ fontSize: '1rem', color: '#1A1A1A', marginBottom: '0.75rem' }}>
        {title}
      </h2>
      <div style={{ color: '#666' }}>{children}</div>
    </div>
  )
}