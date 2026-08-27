const RAINBOW = ['#00c2c2', '#FFAE00', '#a259ff', '#3ddc84', '#EB4600', '#3b82f6', '#ff7a1a']

export default function TetrisChampionBadge({
  username,
  enabled,
  customColor,
}: {
  username: string
  enabled: boolean
  customColor?: string | null
}) {
  if (!enabled) {
    return <strong>{username}</strong>
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
      <span
        style={{
          display: 'inline-grid',
          gridTemplateColumns: 'repeat(2, 6px)',
          gridTemplateRows: 'repeat(2, 6px)',
          gap: '1px',
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              background: customColor || RAINBOW[i % RAINBOW.length],
              borderRadius: 1,
            }}
          />
        ))}
      </span>
      <strong>
        {customColor ? (
          <span style={{ color: customColor }}>{username}</span>
        ) : (
          username.split('').map((ch, i) => (
            <span key={i} style={{ color: RAINBOW[i % RAINBOW.length] }}>
              {ch}
            </span>
          ))
        )}
      </strong>
    </span>
  )
}
