import { NextResponse } from 'next/server'

// Server-side proxy so the OpenWeather key never ships to the browser
const API_KEY = process.env.WEATHER_API || process.env.NEXT_PUBLIC_WEATHER_API
const ENDPOINTS: Record<string, string> = {
  weather: 'https://api.openweathermap.org/data/2.5/weather',
  forecast: 'https://api.openweathermap.org/data/2.5/forecast',
  air: 'https://api.openweathermap.org/data/2.5/air_pollution',
}

const isCoord = (v: string | null, limit: number) =>
  v !== null && v.trim() !== '' && Number.isFinite(Number(v)) && Math.abs(Number(v)) <= limit

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'weather'
  const city = searchParams.get('q')?.trim()
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')
  const hasCoords = isCoord(lat, 90) && isCoord(lon, 180)

  // Air pollution only accepts coordinates; weather/forecast take either
  if (!ENDPOINTS[type] || (!hasCoords && (type === 'air' || !city))) {
    return NextResponse.json({ message: 'Missing or invalid parameters' }, { status: 400 })
  }
  if (!API_KEY) {
    return NextResponse.json({ message: 'Weather API key is not configured' }, { status: 401 })
  }

  const location = hasCoords
    ? `lat=${Number(lat)}&lon=${Number(lon)}`
    : `q=${encodeURIComponent(city!)}`
  const url = `${ENDPOINTS[type]}?${location}&units=metric&appid=${API_KEY}`
  try {
    const res = await fetch(url, { next: { revalidate: 600 } })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ message: 'Failed to reach weather service' }, { status: 502 })
  }
}
