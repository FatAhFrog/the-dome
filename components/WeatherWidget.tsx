'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import WeatherIcon from './WeatherIcon'
import { useDomeSession } from '@/components/DomeSession'
import { placeFromProfile, useWeatherPlace } from '@/lib/weather/location'

type WeatherData = {
  temperature: number
  weathercode: number
}

const weatherDescriptions: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Foggy',
  51: 'Light drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  95: 'Thunderstorm',
}

export default function WeatherWidget() {
  const { profile } = useDomeSession()
  const saved = placeFromProfile(profile)
  const { place } = useWeatherPlace(saved)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}&current_weather=true&temperature_unit=fahrenheit`
        )
        const data = await res.json()
        if (cancelled) return
        setWeather({
          temperature: Math.round(data.current_weather.temperature),
          weathercode: data.current_weather.weathercode,
        })
        setError(null)
      } catch {
        if (!cancelled) setError('Could not load weather')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [place.lat, place.lon])

  if (error) return <p style={{ color: '#999' }}>{error}</p>
  if (!weather) return <p style={{ color: '#999' }}>Loading...</p>

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <WeatherIcon code={weather.weathercode} size={40} />
      <div>
        <p style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>{weather.temperature}°F</p>
        <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>
          {weatherDescriptions[weather.weathercode] || 'Unknown conditions'}
        </p>
        <p style={{ fontSize: '0.75rem', color: '#999', margin: '0.2rem 0 0' }}>{place.label}</p>
        <Link href="/apps/weather" style={{ fontSize: '0.75rem', color: '#EB4600', textDecoration: 'none' }}>
          Change location
        </Link>
      </div>
    </div>
  )
}
