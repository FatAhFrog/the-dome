'use client'

import { useState, useEffect } from 'react'
import WeatherIcon from '@/components/WeatherIcon'
import { useDomeSession } from '@/components/DomeSession'
import { createClient } from '@/lib/supabase/client'
import {
  placeFromProfile,
  requestBrowserLocation,
  searchPlaces,
  useWeatherPlace,
  type GeocodeHit,
  type WeatherPlace,
} from '@/lib/weather/location'

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
  const { user, profile } = useDomeSession()
  const [saved, setSaved] = useState<WeatherPlace | null>(() => placeFromProfile(profile))
  const { place, setPlace } = useWeatherPlace(saved)
  const [forecast, setForecast] = useState<Forecast | null>(null)
  const [loading, setLoading] = useState(true)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<GeocodeHit[]>([])
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [gpsBusy, setGpsBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&temperature_unit=fahrenheit&timezone=auto`
        )
        const data = await res.json()
        if (cancelled) return
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
        if (!cancelled) setForecast(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [place.lat, place.lon])

  const persist = async (next: WeatherPlace) => {
    if (!user) {
      setSaved(next)
      setPlace(next)
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ weather_lat: next.lat, weather_lon: next.lon, weather_label: next.label })
      .eq('id', user.id)
    setSaving(false)
    if (error) return
    const persisted = { ...next, persisted: true }
    setSaved(persisted)
    setPlace(persisted)
    setPickerOpen(false)
    setHits([])
    setQuery('')
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setSearching(true)
    try {
      setHits(await searchPlaces(query))
    } finally {
      setSearching(false)
    }
  }

  const handleUseMyLocation = async () => {
    setGpsBusy(true)
    const gps = await requestBrowserLocation()
    setGpsBusy(false)
    if (!gps) return
    setPlace({ lat: gps.lat, lon: gps.lon, label: 'Current location', persisted: false })
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1 style={{ color: '#EB4600' }}>Weather</h1>
      <p style={{ margin: '0 0 0.75rem', color: '#666', fontSize: '0.95rem' }}>
        Showing weather for <strong>{place.label}</strong>
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={() => setPickerOpen((o) => !o)}
          style={{ padding: '0.4rem 0.75rem', background: '#EB4600', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          {pickerOpen ? 'Close' : 'Change location'}
        </button>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={gpsBusy}
          style={{ padding: '0.4rem 0.75rem', background: 'transparent', color: '#EB4600', border: '1px solid #EB4600', borderRadius: '6px', cursor: gpsBusy ? 'wait' : 'pointer' }}
        >
          {gpsBusy ? 'Locating…' : 'Use my location'}
        </button>
        {!place.persisted && place.label === 'Current location' && (
          <button
            type="button"
            onClick={() => persist({ ...place, persisted: true })}
            disabled={saving}
            style={{ padding: '0.4rem 0.75rem', background: 'transparent', color: '#1A1A1A', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer' }}
          >
            {saving ? 'Saving…' : 'Save this location'}
          </button>
        )}
      </div>

      {pickerOpen && (
        <div style={{ marginBottom: '1.5rem', maxWidth: '420px', border: '1px solid #eee', borderRadius: '8px', padding: '0.75rem' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.4rem' }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="City or place"
              style={{ flex: 1, padding: '0.4rem 0.5rem', border: '1px solid #ccc', borderRadius: '6px' }}
            />
            <button type="submit" disabled={searching} style={{ padding: '0.4rem 0.75rem', background: '#EB4600', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              {searching ? '…' : 'Search'}
            </button>
          </form>
          {hits.length > 0 && (
            <ul style={{ listStyle: 'none', margin: '0.75rem 0 0', padding: 0 }}>
              {hits.map((hit) => (
                <li key={`${hit.lat},${hit.lon},${hit.label}`}>
                  <button
                    type="button"
                    onClick={() => persist({ ...hit, persisted: true })}
                    disabled={saving}
                    style={{ width: '100%', textAlign: 'left', padding: '0.45rem 0.25rem', background: 'transparent', border: 'none', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
                  >
                    {hit.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {forecast ? <div
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
      </div> : <div style={{ background: '#f0f0f0', borderRadius: '12px', height: '84px', maxWidth: '320px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '0.85rem' }}>
        {loading ? 'Loading conditions...' : 'Weather unavailable'}
      </div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
        {forecast ? forecast.daily.map((day, i) => (
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
        )) : Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ background: '#f5f5f5', borderRadius: '8px', padding: '0.75rem', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '0.8rem' }}>
            {loading ? '...' : 'N/A'}
          </div>
        ))}
      </div>
    </main>
  )
}
