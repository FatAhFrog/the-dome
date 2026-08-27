'use client'

import { useState, useEffect } from 'react'
import WeatherIcon from './WeatherIcon'

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
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=fahrenheit`
        )
        const data = await res.json()
        setWeather({
          temperature: Math.round(data.current_weather.temperature),
          weathercode: data.current_weather.weathercode,
        })
      } catch {
        setError('Could not load weather')
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude)
        },
        () => {
          // Fallback: default to a central US location if permission denied
          fetchWeather(39.8283, -98.5795)
        }
      )
    } else {
      fetchWeather(39.8283, -98.5795)
    }
  }, [])

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
      </div>
    </div>
  )
}