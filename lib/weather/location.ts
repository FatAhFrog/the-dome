'use client'

import { useEffect, useState } from 'react'

export const SPRINGDALE = { lat: 36.1867, lon: -94.1288, label: 'Springdale, AR' } as const

export const GPS_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 3000,
  maximumAge: 600_000,
}

export type WeatherPlace = {
  lat: number
  lon: number
  label: string
  persisted: boolean
}

export function placeFromProfile(profile: {
  weather_lat: number | null
  weather_lon: number | null
  weather_label: string | null
} | null | undefined): WeatherPlace | null {
  if (profile?.weather_lat == null || profile?.weather_lon == null) return null
  return {
    lat: profile.weather_lat,
    lon: profile.weather_lon,
    label: profile.weather_label?.trim() || 'Saved location',
    persisted: true,
  }
}

/** GPS with a hard 3s timeout. Never hangs Firefox. Null on deny/timeout/unsupported. */
export function requestBrowserLocation(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      GPS_OPTIONS
    )
  })
}

export type GeocodeHit = {
  lat: number
  lon: number
  label: string
}

export async function searchPlaces(query: string): Promise<GeocodeHit[]> {
  const name = query.trim()
  if (!name) return []
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=5&language=en&format=json`
  )
  const data = await res.json()
  const results = (data.results || []) as {
    name: string
    admin1?: string
    country?: string
    latitude: number
    longitude: number
  }[]
  return results.map((r) => ({
    lat: r.latitude,
    lon: r.longitude,
    label: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
  }))
}

/**
 * Saved profile place wins. Otherwise Springdale immediately, then GPS may
 * upgrade the unsaved view to "Current location" within 3s.
 */
export function useWeatherPlace(saved: WeatherPlace | null) {
  const [place, setPlace] = useState<WeatherPlace>(saved ?? { ...SPRINGDALE, persisted: false })

  const savedLat = saved?.lat
  const savedLon = saved?.lon
  const savedLabel = saved?.label

  useEffect(() => {
    if (savedLat != null && savedLon != null) {
      setPlace({
        lat: savedLat,
        lon: savedLon,
        label: savedLabel || 'Saved location',
        persisted: true,
      })
      return
    }
    setPlace({ ...SPRINGDALE, persisted: false })
    let cancelled = false
    requestBrowserLocation().then((gps) => {
      if (cancelled || !gps) return
      setPlace({ lat: gps.lat, lon: gps.lon, label: 'Current location', persisted: false })
    })
    return () => {
      cancelled = true
    }
  }, [savedLat, savedLon, savedLabel])

  return { place, setPlace }
}
