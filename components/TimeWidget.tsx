'use client'

import { useState, useEffect } from 'react'

export default function TimeWidget() {
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    setTime(new Date())
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!time) return <p>Loading...</p>

  return (
    <div>
      <p style={{ fontSize: '1.5rem', fontWeight: 600 }}>
        {time.toLocaleTimeString()}
      </p>
      <p style={{ fontSize: '0.85rem', color: '#999' }}>
        {time.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>
    </div>
  )
}