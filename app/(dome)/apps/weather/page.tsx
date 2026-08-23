"use client"

import { useState, useEffect } from 'react'

type Forecast = {
  current: { temperature: number; weathercode: number }
  daily: { date: string; max: number; min: number; weathercode: number }[]
}

const weatherDescriptions: Record<number, string> = {
  0: 'Clear sky', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Foggy', 51: 'Light drizzle', 61: 'Light rain',
  63: 'Rain', 65: 'Heavy rain', 71: 'Light snow', 73: 'Snow',
  75: 'Heavy snow', 80: 'Rain showers', 95: 'Thunderstorm',
}

export default function WeatherPage() {
  const [forecast, setForecast] = useState<Forecast | null>(null)

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&temperature_unit=fahrenheit&timezone=auto`
        )
        const data = await res.json()
        setForecast({
          current: {
            temperature: Math.round(data.current_weather.temperature),
            weathercode: data.current_weather.weathercode,
          },
          daily: data.daily.time.map((date: string, i: number) => ({
            date,
            max: Math.round(data.daily.temperature_2m_max[i]),
            min: Math.round(data.daily.temperature_2m_min[i]),
            weathercode: data.daily.weathercode[i],
          })),
        })
      } catch {
        setForecast(null)
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(39.8283, -98.5795)
      )
    } else {
      fetchWeather(39.8283, -98.5795)
    }
  }, [])

  if (!forecast) return <main style={{ padding: '2rem' }}>Loading...</main>

  return (
    <main style={{ padding: '2rem' }}>
      <h1 style={{ color: '#EB4600' }}>Weather</h1>

      <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '2rem', fontWeight: 700 }}>{forecast.current.temperature}°F</div>
        <div style={{ color: '#666' }}>{weatherDescriptions[forecast.current.weathercode] || 'Unknown conditions'}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
        {forecast.daily.map((day, i) => (
          <div key={day.date} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '0.75rem' }}>
            <div style={{ fontWeight: 600 }}>
              {i === 0 ? 'Today' : new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
            </div>
            <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{weatherDescriptions[day.weathercode] || ''}</div>
            <div>
              <strong>{day.max}°</strong> / {day.min}°
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}