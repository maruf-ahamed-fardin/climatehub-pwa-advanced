'use client'
import useSWR from 'swr'
import { useState, useRef } from 'react'
import { fetcher } from '@/lib/fetcher'
import { weatherUrl, forecastUrl, airUrl } from '@/lib/weather'
import { useSettings, convertTemp, convertWind, windLabel } from '@/lib/settings'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { FiSearch, FiMapPin, FiNavigation, FiChevronLeft, FiChevronRight, FiCrosshair, FiWind } from 'react-icons/fi'
import {
  WiDaySunny, WiNightClear, WiDayCloudy, WiNightAltCloudy,
  WiCloud, WiCloudy, WiRain, WiDayRain, WiNightAltRain,
  WiThunderstorm, WiSnow, WiFog,
  WiHumidity, WiStrongWind, WiBarometer,
  WiSunrise, WiDayHaze
} from 'react-icons/wi'

const iconMap: Record<string, any> = {
  '01d': WiDaySunny, '01n': WiNightClear,
  '02d': WiDayCloudy, '02n': WiNightAltCloudy,
  '03d': WiCloud, '03n': WiCloud,
  '04d': WiCloudy, '04n': WiCloudy,
  '09d': WiRain, '09n': WiRain,
  '10d': WiDayRain, '10n': WiNightAltRain,
  '11d': WiThunderstorm, '11n': WiThunderstorm,
  '13d': WiSnow, '13n': WiSnow,
  '50d': WiFog, '50n': WiFog,
}

// Dynamic CSS gradient based on weather condition - soft, light pastels
function getWeatherStyle(code?: string): { bg: string; orb1: string; orb2: string } {
  if (!code) return {
    bg: 'linear-gradient(135deg, #93c5fd 0%, #a5b4fc 50%, #67e8f9 100%)',
    orb1: '#bfdbfe', orb2: '#a5f3fc'
  }
  const id = code.slice(0, 2)
  const isNight = code.endsWith('n')
  if (isNight) return {
    bg: 'linear-gradient(135deg, #1e293b 0%, #334155 40%, #475569 100%)',
    orb1: '#818cf8', orb2: '#a78bfa'
  }
  switch (id) {
    case '01': return { // clear sky - soft warm peach
      bg: 'linear-gradient(135deg, #fdba74 0%, #fca5a5 40%, #f9a8d4 100%)',
      orb1: '#fde68a', orb2: '#fbcfe8'
    }
    case '02': return { // few clouds - soft sky blue
      bg: 'linear-gradient(135deg, #7dd3fc 0%, #93c5fd 50%, #c4b5fd 100%)',
      orb1: '#bae6fd', orb2: '#ddd6fe'
    }
    case '03': case '04': return { // cloudy - soft lavender blue
      bg: 'linear-gradient(135deg, #93c5fd 0%, #a5b4fc 50%, #c4b5fd 100%)',
      orb1: '#c7d2fe', orb2: '#ddd6fe'
    }
    case '09': case '10': return { // rain - soft teal cyan
      bg: 'linear-gradient(135deg, #5eead4 0%, #67e8f9 50%, #93c5fd 100%)',
      orb1: '#a7f3d0', orb2: '#bae6fd'
    }
    case '11': return { // thunder - soft purple
      bg: 'linear-gradient(135deg, #c4b5fd 0%, #d8b4fe 40%, #93c5fd 100%)',
      orb1: '#ddd6fe', orb2: '#bfdbfe'
    }
    case '13': return { // snow - icy light blue
      bg: 'linear-gradient(135deg, #bae6fd 0%, #c7d2fe 50%, #e0e7ff 100%)',
      orb1: '#e0f2fe', orb2: '#ede9fe'
    }
    case '50': return { // fog - soft grey lavender
      bg: 'linear-gradient(135deg, #cbd5e1 0%, #c7d2fe 40%, #d8b4fe 100%)',
      orb1: '#e2e8f0', orb2: '#ede9fe'
    }
    default: return {
      bg: 'linear-gradient(135deg, #93c5fd 0%, #a5b4fc 50%, #67e8f9 100%)',
      orb1: '#bfdbfe', orb2: '#a5f3fc'
    }
  }
}

// Hero text colors - dark text on the pastel day gradients, light text on the night gradient
const heroText = {
  day: {
    strong: 'text-slate-700', mid: 'text-slate-600', soft: 'text-slate-500', icon: 'text-slate-600',
    pill: 'bg-white/30 text-slate-600',
    input: 'bg-white/40 border-white/50 text-slate-700 placeholder:text-slate-500 focus:bg-white/60 focus:border-white/70',
    button: 'bg-white/60 text-slate-700 hover:bg-white/80',
    chip: 'bg-white/25 text-slate-600 border border-white/30 hover:bg-white/50',
    chipActive: 'bg-white/80 text-slate-800 shadow-md shadow-black/10',
    spinner: 'border-slate-400/30 border-t-slate-600',
  },
  night: {
    strong: 'text-white', mid: 'text-slate-200', soft: 'text-slate-300', icon: 'text-slate-100',
    pill: 'bg-white/15 text-slate-200',
    input: 'bg-white/10 border-white/20 text-white placeholder:text-slate-300 focus:bg-white/15 focus:border-white/40',
    button: 'bg-white/20 text-white hover:bg-white/30',
    chip: 'bg-white/10 text-slate-200 border border-white/15 hover:bg-white/20',
    chipActive: 'bg-white/90 text-slate-800 shadow-md shadow-black/20',
    spinner: 'border-white/20 border-t-white',
  },
}

function WeatherIcon({ code, className }: { code: string; className?: string }) {
  const Icon = iconMap[code] || WiDaySunny
  return <Icon className={className} />
}

// OpenWeather timestamps are UTC; `tz` is the city's offset in seconds.
// Shifting by the offset and formatting in UTC shows the city's local time,
// not the viewer's.
function cityDate(ts: number, tz: number) {
  return new Date((ts + tz) * 1000)
}

function formatTime(ts: number, tz: number, withMinutes = false) {
  return cityDate(ts, tz).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: withMinutes ? '2-digit' : undefined,
    hour12: true,
    timeZone: 'UTC',
  })
}

function dayKey(ts: number, tz: number) {
  return cityDate(ts, tz).toISOString().slice(0, 10)
}

function getDayName(ts: number, tz: number) {
  return cityDate(ts, tz).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
}

function formatHourlyLabel(ts: number, tz: number) {
  const time = formatTime(ts, tz)
  if (dayKey(ts, tz) === dayKey(Date.now() / 1000, tz)) return time
  return `${getDayName(ts, tz)} ${time}`
}

function formatDay(ts: number, tz: number) {
  const now = Date.now() / 1000
  if (dayKey(ts, tz) === dayKey(now, tz)) return 'Today'
  if (dayKey(ts, tz) === dayKey(now + 86400, tz)) return 'Tomorrow'
  return getDayName(ts, tz)
}

function processDailyForecast(list: any[], tz: number) {
  const days: Record<string, { temps: number[]; icons: string[]; dt: number }> = {}
  list.forEach((item: any) => {
    const key = dayKey(item.dt, tz)
    if (!days[key]) {
      days[key] = { temps: [], icons: [], dt: item.dt }
    }
    days[key].temps.push(item.main.temp)
    days[key].icons.push(item.weather[0].icon)
  })
  return Object.values(days).map(day => ({
    maxTemp: Math.max(...day.temps),
    minTemp: Math.min(...day.temps),
    icon: day.icons[Math.floor(day.icons.length / 2)],
    dt: day.dt
  }))
}

function StatCard({ label, icon, tint, children }: {
  label: string
  icon: React.ReactNode
  tint: string
  children: React.ReactNode
}) {
  return (
    <div className={`${tint} dark:bg-slate-800/60 backdrop-blur-xl border dark:border-slate-700/50 shadow-sm rounded-2xl p-3.5 md:p-5 space-y-2 md:space-y-3 hover:scale-[1.02] transition-transform duration-200`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      {children}
    </div>
  )
}

const statValue = 'text-2xl md:text-3xl font-bold text-slate-700 dark:text-slate-100'
const statUnit = 'text-sm md:text-lg text-slate-400'
const statNote = 'text-[11px] md:text-xs text-slate-400'

// OpenWeather Air Pollution API: aqi is 1 (good) to 5 (very poor)
const aqiLevels = [
  { label: 'Good', note: 'Air quality is satisfactory', color: 'bg-emerald-400' },
  { label: 'Fair', note: 'Acceptable for most people', color: 'bg-lime-400' },
  { label: 'Moderate', note: 'Sensitive groups should take care', color: 'bg-amber-400' },
  { label: 'Poor', note: 'Limit long outdoor activity', color: 'bg-orange-500' },
  { label: 'Very Poor', note: 'Avoid outdoor activity', color: 'bg-red-500' },
]

const popularCities = ['London', 'New York', 'Tokyo', 'Paris', 'Dubai', 'Sydney']

const retryOnTransientErrors = {
  onErrorRetry: (error: any, _key: string, _config: any, revalidate: any, { retryCount }: { retryCount: number }) => {
    if (error.status === 401 || error.status === 404) return
    if (retryCount >= 3) return
    setTimeout(() => revalidate({ retryCount }), 3000)
  }
}

export default function WeatherPage() {
  const { lastCity: city, setLastCity: setCity, coords, setCoords, tempUnit, windUnit, hydrated } = useSettings()
  const [searchInput, setSearchInput] = useState('')
  const [locating, setLocating] = useState(false)
  const [geoError, setGeoError] = useState('')
  const hourlyRef = useRef<HTMLDivElement>(null)

  const scrollHourly = (direction: 'left' | 'right') => {
    if (hourlyRef.current) {
      const amount = 240
      hourlyRef.current.scrollBy({ left: direction === 'right' ? amount : -amount, behavior: 'smooth' })
    }
  }

  // Wait for the saved city to load so we don't fetch the default city first
  const { data: rawWeather, isLoading, error: weatherError } = useSWR(hydrated ? weatherUrl(city, coords) : null, fetcher, retryOnTransientErrors)
  const { data: rawForecast, error: forecastError } = useSWR(hydrated ? forecastUrl(city, coords) : null, fetcher, retryOnTransientErrors)

  const weather = rawWeather?.main ? rawWeather : null
  // Air quality needs coordinates, which the weather response provides for any city
  const { data: rawAir } = useSWR(weather?.coord ? airUrl(weather.coord) : null, fetcher)
  const air = rawAir?.list?.[0]
  const aqi = air ? aqiLevels[air.main.aqi - 1] : null
  const forecast = rawForecast?.list ? rawForecast : null
  const apiError = weatherError || forecastError
  const tz: number = weather?.timezone ?? forecast?.city?.timezone ?? 0

  const dailyForecast = forecast ? processDailyForecast(forecast.list, tz).slice(0, 5) : []
  const hourlyForecast = forecast ? forecast.list : []

  // Shared scale so the range bars are comparable across days
  const weekMin = Math.min(...dailyForecast.map(d => d.minTemp))
  const weekSpan = Math.max(1, Math.max(...dailyForecast.map(d => d.maxTemp)) - weekMin)

  const t = (c: number) => convertTemp(c, tempUnit)
  const wind = (ms: number) => convertWind(ms, windUnit)

  const handleSearch = () => {
    if (searchInput.trim()) {
      setCity(searchInput.trim())
      setSearchInput('')
      setGeoError('')
    }
  }

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setGeoError('Location is not supported on this device')
      return
    }
    setLocating(true)
    setGeoError('')
    navigator.geolocation.getCurrentPosition(
      pos => {
        // ~100m precision is plenty for weather and keeps cache keys stable
        setCoords({ lat: +pos.coords.latitude.toFixed(3), lon: +pos.coords.longitude.toFixed(3) })
        setLocating(false)
      },
      err => {
        setGeoError(err.code === err.PERMISSION_DENIED
          ? 'Location permission denied. Allow it in your browser settings.'
          : 'Could not get your location. Try searching instead.')
        setLocating(false)
      },
      { timeout: 10000, maximumAge: 10 * 60 * 1000 }
    )
  }

  const chartData = hourlyForecast.slice(0, 8).map((f: any) => ({
    time: formatTime(f.dt, tz),
    temp: t(f.main.temp)
  }))

  const weatherCode = weather?.weather?.[0]?.icon
  const weatherStyle = getWeatherStyle(weatherCode)
  const hero = weatherCode?.endsWith('n') ? heroText.night : heroText.day

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 animate-fade-in">

      {/* ==================== HERO SECTION ==================== */}
      <div
        className="relative rounded-3xl overflow-hidden px-4 py-5 md:p-8 transition-all duration-700"
        style={{ background: weatherStyle.bg }}
      >
        {/* Animated orbs */}
        <div
          className="absolute -top-16 -right-16 w-52 md:w-72 h-52 md:h-72 rounded-full blur-3xl opacity-40 animate-float"
          style={{ background: weatherStyle.orb1 }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-44 md:w-64 h-44 md:h-64 rounded-full blur-3xl opacity-30"
          style={{ background: weatherStyle.orb2, animation: 'float 5s ease-in-out infinite reverse' }}
        />

        {/* Search Bar - 16px text on mobile so iOS doesn't zoom on focus */}
        <div className="relative z-10 mb-3 md:mb-5">
          <div className="relative max-w-md">
            <FiSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${hero.soft}`} />
            <input
              placeholder="Search city..."
              aria-label="Search city"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className={`w-full pl-9 pr-24 py-2.5 rounded-xl backdrop-blur-md border text-base md:text-sm outline-none transition-all ${hero.input}`}
            />
            <button
              onClick={handleSearch}
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95 ${hero.button}`}
            >
              Search
            </button>
          </div>
        </div>

        {/* Quick Cities */}
        <div className="relative z-10 flex gap-1.5 md:gap-2 mb-4 md:mb-8 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={handleLocate}
            disabled={locating}
            className={`flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 disabled:opacity-60 ${
              coords ? hero.chipActive : hero.chip
            }`}
          >
            <FiCrosshair className={`text-xs ${locating ? 'animate-spin' : ''}`} />
            {locating ? 'Locating...' : 'My location'}
          </button>
          {popularCities.map(c => (
            <button
              key={c}
              onClick={() => { setCity(c); setGeoError('') }}
              className={`flex items-center gap-1 h-9 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                city === c && !coords ? hero.chipActive : hero.chip
              }`}
            >
              <FiMapPin className="text-[10px]" />
              {c}
            </button>
          ))}
        </div>

        {geoError && (
          <p role="alert" className={`relative z-10 -mt-2 mb-4 text-xs font-medium ${hero.mid}`}>{geoError}</p>
        )}

        {/* Loading */}
        {(!hydrated || isLoading) && !apiError && (
          <div className="flex items-center justify-center py-12 md:py-16">
            <div className={`w-10 h-10 md:w-12 md:h-12 border-4 rounded-full animate-spin ${hero.spinner}`} />
          </div>
        )}

        {/* Error */}
        {apiError && !weather && (
          <div className="text-center py-8 md:py-12 space-y-2 relative z-10">
            <div className="w-12 h-12 md:w-16 md:h-16 mx-auto rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center">
              <span className={`text-xl md:text-2xl ${hero.mid}`}>!</span>
            </div>
            <p className={`text-base md:text-lg font-semibold ${hero.strong}`}>
              {apiError.status === 401
                ? 'Invalid API Key'
                : apiError.status === 404
                ? (coords ? 'No weather for your location' : `City "${city}" not found`)
                : 'Failed to fetch weather'}
            </p>
            <p className={`text-xs md:text-sm px-4 ${hero.soft}`}>
              {apiError.status === 401
                ? 'Your API key may not be activated yet. New keys take up to 30 minutes.'
                : apiError.status === 404
                ? 'Please check the city name and try again.'
                : 'Please check your connection.'}
            </p>
          </div>
        )}

        {/* Main Weather Display */}
        {weather && (
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2">
              {/* Left - Temp & Info */}
              <div className="space-y-1 md:space-y-2 min-w-0">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-sm text-xs font-semibold ${hero.pill}`}>
                  <FiMapPin className="text-[10px] flex-shrink-0" />
                  <span className="truncate">{weather.name}, {weather.sys?.country}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-7xl md:text-[120px] font-thin leading-none tracking-tighter ${hero.strong}`}>
                    {t(weather.main.temp)}
                  </span>
                  <span className={`text-3xl md:text-6xl font-thin ${hero.soft}`}>°{tempUnit}</span>
                </div>
                <p className={`text-base md:text-xl capitalize font-medium ${hero.mid}`}>
                  {weather.weather[0].description}
                </p>
                <div className={`flex items-center gap-3 text-xs md:text-sm ${hero.soft}`}>
                  <span>Feels {t(weather.main.feels_like)}°</span>
                  <span className="w-1 h-1 rounded-full bg-current opacity-60" />
                  <span>H:{t(weather.main.temp_max)}°</span>
                  <span>L:{t(weather.main.temp_min)}°</span>
                </div>
              </div>

              {/* Right - Weather Icon */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 blur-3xl opacity-25 scale-110">
                  <WeatherIcon code={weatherCode} className={`text-[80px] md:text-[180px] ${hero.soft}`} />
                </div>
                <WeatherIcon
                  code={weatherCode}
                  className={`text-[80px] md:text-[150px] drop-shadow-lg relative z-10 animate-float ${hero.icon}`}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================== HOURLY FORECAST SLIDER ==================== */}
      {hourlyForecast.length > 0 && (
        <div className="bg-blue-50/70 dark:bg-slate-800/60 backdrop-blur-xl border border-blue-100/60 dark:border-slate-700/50 shadow-sm rounded-2xl p-3.5 md:p-5 space-y-3 md:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs md:text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hourly Forecast</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 font-medium">
                {hourlyForecast.length * 3}h
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => scrollHourly('left')}
                aria-label="Scroll hourly forecast left"
                className="w-10 h-10 flex items-center justify-center rounded-xl
                           bg-white/60 dark:bg-slate-700/60 text-slate-500
                           hover:bg-blue-100 dark:hover:bg-blue-500/20 hover:text-blue-500
                           active:scale-90 transition-all duration-200"
              >
                <FiChevronLeft className="text-base" />
              </button>
              <button
                onClick={() => scrollHourly('right')}
                aria-label="Scroll hourly forecast right"
                className="w-10 h-10 flex items-center justify-center rounded-xl
                           bg-white/60 dark:bg-slate-700/60 text-slate-500
                           hover:bg-blue-100 dark:hover:bg-blue-500/20 hover:text-blue-500
                           active:scale-90 transition-all duration-200"
              >
                <FiChevronRight className="text-base" />
              </button>
            </div>
          </div>

          <div ref={hourlyRef} className="flex gap-2 overflow-x-auto scrollbar-hide pb-1" style={{ scrollBehavior: 'smooth' }}>
            {hourlyForecast.map((h: any, i: number) => (
              <div
                key={h.dt}
                className={`flex-shrink-0 flex flex-col items-center gap-1 md:gap-1.5 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl w-[76px] md:w-[85px] transition-all duration-200 cursor-default
                  ${i === 0
                    ? 'bg-gradient-to-b from-blue-400 to-blue-500 text-white shadow-lg shadow-blue-400/25 scale-105'
                    : 'bg-white/70 dark:bg-slate-700/40 hover:bg-white dark:hover:bg-slate-600/50'
                  }`}
              >
                <span className={`text-[11px] font-semibold tracking-wide ${i === 0 ? 'text-blue-100' : 'text-slate-400'}`}>
                  {i === 0 ? 'NOW' : formatHourlyLabel(h.dt, tz)}
                </span>
                <WeatherIcon
                  code={h.weather[0].icon}
                  className={`text-2xl md:text-3xl ${i === 0 ? 'text-white drop-shadow-lg' : 'text-amber-400'}`}
                />
                <span className={`text-sm md:text-base font-bold ${i === 0 ? '' : 'text-slate-700 dark:text-slate-200'}`}>
                  {t(h.main.temp)}°
                </span>
                <div className={`flex items-center gap-0.5 ${i === 0 ? 'text-blue-100' : 'text-slate-400'}`}>
                  <WiStrongWind className="text-xs" />
                  <span className="text-[10px] font-medium">{wind(h.wind?.speed || 0)} {windLabel(windUnit)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== FORECAST + CHART ==================== */}
      {forecast && (
        <div className="grid md:grid-cols-5 gap-3 md:gap-5">
          {/* 5-Day Forecast */}
          <div className="md:col-span-2 bg-indigo-50/60 dark:bg-slate-800/60 backdrop-blur-xl border border-indigo-100/50 dark:border-slate-700/50 shadow-sm rounded-2xl p-3.5 md:p-5 space-y-1">
            <h3 className="text-xs md:text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 md:mb-3">5-Day Forecast</h3>
            {dailyForecast.map(day => (
              <div
                key={day.dt}
                className="flex items-center gap-2 py-2.5 px-2 rounded-xl hover:bg-white/60 dark:hover:bg-slate-700/40 transition-colors"
              >
                <span className="text-sm font-medium w-[4.5rem] flex-shrink-0 text-slate-500 dark:text-slate-400">
                  {formatDay(day.dt, tz)}
                </span>
                <WeatherIcon code={day.icon} className="text-2xl text-amber-400 flex-shrink-0" />
                <div className="flex flex-1 min-w-0 items-center justify-end gap-2">
                  <span className="text-sm text-slate-400 w-8 text-right">{t(day.minTemp)}°</span>
                  {/* Temp range bar on a shared 5-day scale */}
                  <div className="relative flex-1 max-w-[6rem] h-1.5 rounded-full bg-blue-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="absolute h-full rounded-full bg-gradient-to-r from-blue-300 to-orange-300"
                      style={{
                        left: `${((day.minTemp - weekMin) / weekSpan) * 100}%`,
                        width: `${Math.max(8, ((day.maxTemp - day.minTemp) / weekSpan) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold w-8 text-right text-slate-700 dark:text-slate-200">{t(day.maxTemp)}°</span>
                </div>
              </div>
            ))}
          </div>

          {/* Temperature Chart */}
          <div className="md:col-span-3 bg-violet-50/50 dark:bg-slate-800/60 backdrop-blur-xl border border-violet-100/50 dark:border-slate-700/50 shadow-sm rounded-2xl p-3.5 md:p-5">
            <h3 className="text-xs md:text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 md:mb-4">Temperature Trend</h3>
            {chartData.length > 0 && (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(15,23,42,0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '13px',
                        padding: '8px 14px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                      }}
                      formatter={(value: number) => [`${value}°${tempUnit}`, 'Temp']}
                      labelStyle={{ color: '#94a3b8', fontSize: '11px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="temp"
                      stroke="#3b82f6"
                      fill="url(#tempGrad)"
                      strokeWidth={2.5}
                      dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, fill: '#60a5fa', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== WEATHER DETAILS BENTO GRID ==================== */}
      {weather && (
        <div className="space-y-2 md:space-y-3">
          <h3 className="text-xs md:text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">

            <StatCard label="Humidity" tint="bg-sky-50/70 border-sky-100/60" icon={<WiHumidity className="text-xl md:text-2xl text-blue-400" />}>
              <p className={statValue}>{weather.main.humidity}<span className={statUnit}>%</span></p>
              <div className="w-full h-1.5 rounded-full bg-blue-100 dark:bg-slate-700 overflow-hidden">
                <div className="h-full rounded-full bg-blue-300 dark:bg-blue-400 transition-all duration-700" style={{ width: `${weather.main.humidity}%` }} />
              </div>
            </StatCard>

            <StatCard
              label="Wind"
              tint="bg-emerald-50/60 border-emerald-100/50"
              icon={
                <FiNavigation
                  className="text-base md:text-lg text-emerald-400 transition-transform duration-300"
                  style={{ transform: `rotate(${weather.wind.deg || 0}deg)` }}
                />
              }
            >
              <p className={statValue}>{wind(weather.wind.speed)}<span className={statUnit}> {windLabel(windUnit)}</span></p>
              <p className={statNote}>
                Gusts: {weather.wind.gust ? `${wind(weather.wind.gust)} ${windLabel(windUnit)}` : 'N/A'}
              </p>
            </StatCard>

            <StatCard label="Pressure" tint="bg-purple-50/60 border-purple-100/50" icon={<WiBarometer className="text-xl md:text-2xl text-purple-400" />}>
              <p className={statValue}>{weather.main.pressure}<span className={statUnit}> hPa</span></p>
              <p className={statNote}>
                {weather.main.pressure > 1013 ? 'Above normal' : weather.main.pressure < 1013 ? 'Below normal' : 'Normal'}
              </p>
            </StatCard>

            <StatCard label="Visibility" tint="bg-amber-50/60 border-amber-100/50" icon={<WiDayHaze className="text-xl md:text-2xl text-amber-400" />}>
              <p className={statValue}>{(weather.visibility / 1000).toFixed(1)}<span className={statUnit}> km</span></p>
              <p className={statNote}>
                {weather.visibility >= 10000 ? 'Excellent' : weather.visibility >= 5000 ? 'Good' : 'Poor'}
              </p>
            </StatCard>

            <StatCard label="Sunrise" tint="bg-orange-50/60 border-orange-100/50" icon={<WiSunrise className="text-xl md:text-2xl text-orange-400" />}>
              <p className={statValue}>{formatTime(weather.sys.sunrise, tz, true)}</p>
              <p className={statNote}>
                Sunset at {formatTime(weather.sys.sunset, tz, true)}
              </p>
            </StatCard>

            <StatCard label="Air Quality" tint="bg-rose-50/60 border-rose-100/50" icon={<FiWind className="text-base md:text-lg text-rose-400" />}>
              {aqi ? (
                <>
                  <p className={`${statValue} flex items-center gap-2`}>
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${aqi.color}`} />
                    <span className="truncate">{aqi.label}</span>
                  </p>
                  <p className={statNote}>
                    PM2.5 {Math.round(air.components.pm2_5)} µg/m³ · {aqi.note}
                  </p>
                </>
              ) : (
                <p className={`${statValue} text-slate-400`}>--</p>
              )}
            </StatCard>

          </div>
        </div>
      )}
    </div>
  )
}
