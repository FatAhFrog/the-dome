"use client"

import { useState, useEffect } from 'react'
import WeatherIcon from '@/components/WeatherIcon'

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

      <div
        style={{
          background: 'linear-gradient(180deg, #5b9bd9 0%, #2f6fb0 100%)',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
          maxWidth: '320px',
        }}
      >
        <WeatherIcon code={forecast.current.weathercode} size={70} />
        <div>
          <div style={{ fontSize: '2.2rem', fontWeight: 700 }}>{forecast.current.temperature}°F</div>
          <div style={{ opacity: 0.9 }}>{weatherDescriptions[forecast.current.weathercode] || 'Unknown conditions'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
        {forecast.daily.map((day, i) => (
          <div
            key={day.date}
            style={{
              background: 'linear-gradient(180deg, #5b9bd9 0%, #2f6fb0 100%)',
              borderRadius: '10px',
              padding: '1rem 0.75rem',
              color: 'white',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              {i === 0 ? 'TODAY' : new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}
            </div>
            <WeatherIcon code={day.weathercode} size={56} />
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.02em' }}>{(weatherDescriptions[day.weathercode] || '').toUpperCase()}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{day.max}°</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>{day.min}° low</div>
          </div>
        ))}
      </div>
    </main>
  )
}