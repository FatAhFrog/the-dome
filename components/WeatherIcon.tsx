export default function WeatherIcon({ code, size = 60 }: { code: number; size?: number }) {
  const isClear = code === 0
  const isMostlyClear = code === 1
  const isPartly = code === 2
  const showSun = isClear || isMostlyClear || isPartly
  const isRain = [51, 61, 63, 65, 80].includes(code)
  const isSnow = [71, 73, 75].includes(code)
  const isStorm = code === 95

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {showSun && (
        <g>
          <circle cx={isClear ? 50 : 65} cy={isClear ? 45 : 35} r={isClear ? 26 : 18} fill="#FFE55C" />
          {!isClear && Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * Math.PI) / 4
            const x1 = 65 + Math.cos(angle) * 22
            const y1 = 35 + Math.sin(angle) * 22
            const x2 = 65 + Math.cos(angle) * 28
            const y2 = 35 + Math.sin(angle) * 28
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFE55C" strokeWidth="3" strokeLinecap="round" />
          })}
        </g>
      )}
      {!isClear && (
        <g>
          <ellipse cx="45" cy="62" rx="30" ry="20" fill="white" stroke="#cfd8e3" strokeWidth="2" />
          <ellipse cx="65" cy="68" rx="18" ry="13" fill="white" stroke="#cfd8e3" strokeWidth="2" />
        </g>
      )}
      {isRain && (
        <g stroke="#7ec8ff" strokeWidth="3" strokeLinecap="round">
          <line x1="35" y1="88" x2="30" y2="96" />
          <line x1="50" y1="88" x2="45" y2="96" />
          <line x1="65" y1="88" x2="60" y2="96" />
        </g>
      )}
      {isSnow && (
        <g fill="white" stroke="#cfd8e3" strokeWidth="1">
          <circle cx="35" cy="90" r="3" />
          <circle cx="50" cy="94" r="3" />
          <circle cx="65" cy="90" r="3" />
        </g>
      )}
      {isStorm && <polygon points="52,82 40,100 48,100 42,116 60,94 51,94" fill="#FFE55C" />}
    </svg>
  )
}
