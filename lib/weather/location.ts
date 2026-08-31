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
  /** Where the coords came from — GPS is the browser, not Springdale or a search pick. */
  source: 'saved' | 'gps' | 'default'
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
    source: 'saved',
  }
}

export function formatCoords(lat: number, lon: number) {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(2)}°${ns}, ${Math.abs(lon).toFixed(2)}°${ew}`
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    )
    const d = await res.json()
    const label = [d.city || d.locality, d.principalSubdivision, d.countryName].filter(Boolean).join(', ')
    if (label) return label
  } catch {
    /* use coords */
  }
  return formatCoords(lat, lon)
}

export async function placeFromDeviceGps(coords: { lat: number; lon: number }): Promise<WeatherPlace> {
  const label = await reverseGeocode(coords.lat, coords.lon)
  return { lat: coords.lat, lon: coords.lon, label, persisted: false, source: 'gps' }
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
export function placeCaption(place: WeatherPlace) {
  if (place.source === 'gps') {
    return {
      headline: `Your device — ${place.label}`,
      detail: formatCoords(place.lat, place.lon),
    }
  }
  if (place.source === 'default') {
    return {
      headline: `Default — ${place.label}`,
      detail: 'Not your device. Change location or use my location.',
    }
  }
  return { headline: `Saved — ${place.label}`, detail: null as string | null }
}

export function useWeatherPlace(saved: WeatherPlace | null) {
  const [place, setPlace] = useState<WeatherPlace>(saved ?? { ...SPRINGDALE, persisted: false, source: 'default' })

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
        source: 'saved',
      })
      return
    }
    setPlace({ ...SPRINGDALE, persisted: false, source: 'default' })
    let cancelled = false
    requestBrowserLocation().then(async (gps) => {
      if (cancelled || !gps) return
      const next = await placeFromDeviceGps(gps)
      if (cancelled) return
      setPlace(next)
    })
    return () => {
      cancelled = true
    }
  }, [savedLat, savedLon, savedLabel])

  return { place, setPlace }
}
