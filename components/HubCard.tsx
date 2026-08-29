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
        border: '1px solid var(--color-border)',
        background: 'var(--color-panel-background)',
        borderRadius: '10px',
        padding: '1.25rem',
        minHeight: '140px',
        color: 'var(--color-panel-text)',
      }}
    >
      <h2 style={{ fontSize: '1rem', color: 'var(--color-panel-text)', marginBottom: '0.75rem' }}>
        {title}
      </h2>
      <div style={{ color: 'var(--color-muted)' }}>{children}</div>
    </div>
  )
}
