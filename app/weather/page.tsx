'use client'
import useSWR from 'swr'
import { useState, useRef } from 'react'
import { fetcher } from '@/lib/fetcher'
import { weatherUrl, forecastUrl } from '@/lib/weather'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { FiSearch, FiMapPin, FiNavigation, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import {
  WiDaySunny, WiNightClear, WiDayCloudy, WiNightAltCloudy,
  WiCloud, WiCloudy, WiRain, WiDayRain, WiNightAltRain,
  WiThunderstorm, WiSnow, WiFog,
  WiHumidity, WiStrongWind, WiBarometer,
  WiThermometer, WiSunrise, WiSunset, WiDayHaze
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

function WeatherIcon({ code, className }: { code: string; className?: string }) {
  const Icon = iconMap[code] || WiDaySunny
  return <Icon className={className} />
}

function formatTime(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
}

function formatHourlyLabel(ts: number) {
  const d = new Date(ts * 1000)
  const today = new Date()
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
  if (d.toDateString() === today.toDateString()) return time
  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
  return `${dayName} ${time}`
}

function formatDay(ts: number) {
  const d = new Date(ts * 1000)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

function getDayName(ts: number) {
  return new Date(ts * 1000).toLocaleDateString('en-US', { weekday: 'short' })
}

function processDailyForecast(list: any[]) {
  const days: Record<string, { temps: number[]; icons: string[]; name: string; dt: number }> = {}
  list.forEach((item: any) => {
    const date = new Date(item.dt * 1000)
    const key = date.toDateString()
    if (!days[key]) {
      days[key] = { temps: [], icons: [], name: getDayName(item.dt), dt: item.dt }
    }
    days[key].temps.push(item.main.temp)
    days[key].icons.push(item.weather[0].icon)
  })
  return Object.values(days).map(day => ({
    name: day.name,
    maxTemp: Math.round(Math.max(...day.temps)),
    minTemp: Math.round(Math.min(...day.temps)),
    icon: day.icons[Math.floor(day.icons.length / 2)],
    dt: day.dt
  }))
}

const popularCities = ['London', 'New York', 'Tokyo', 'Paris', 'Dubai', 'Sydney']

export default function WeatherPage() {
  const [city, setCity] = useState('London')
  const [searchInput, setSearchInput] = useState('')
  const [activeTab, setActiveTab] = useState<'forecast' | 'hourly'>('forecast')
  const hourlyRef = useRef<HTMLDivElement>(null)

  const scrollHourly = (direction: 'left' | 'right') => {
    if (hourlyRef.current) {
      const amount = 240
      hourlyRef.current.scrollBy({ left: direction === 'right' ? amount : -amount, behavior: 'smooth' })
    }
  }

  const { data: rawWeather, isLoading, error: weatherError } = useSWR(weatherUrl(city), fetcher, {
    onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
      if (error.status === 401 || error.status === 404) return
      if (retryCount >= 3) return
      setTimeout(() => revalidate({ retryCount }), 3000)
    }
  })
  const { data: rawForecast, error: forecastError } = useSWR(forecastUrl(city), fetcher, {
    onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
      if (error.status === 401 || error.status === 404) return
      if (retryCount >= 3) return
      setTimeout(() => revalidate({ retryCount }), 3000)
    }
  })

  const weather = rawWeather?.main ? rawWeather : null
  const forecast = rawForecast?.list ? rawForecast : null
  const apiError = weatherError || forecastError

  const dailyForecast = forecast ? processDailyForecast(forecast.list) : []
  const hourlyForecast = forecast ? forecast.list : []

  const handleSearch = () => {
    if (searchInput.trim()) {
      setCity(searchInput.trim())
      setSearchInput('')
    }
  }

  const chartData = hourlyForecast.slice(0, 8).map((f: any) => ({
    time: formatTime(f.dt),
    temp: Math.round(f.main.temp)
  }))

  const weatherCode = weather?.weather?.[0]?.icon
  const weatherStyle = getWeatherStyle(weatherCode)

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 animate-fade-in">

      {/* ==================== HERO SECTION ==================== */}
      <div
        className="relative rounded-3xl overflow-hidden px-4 py-5 md:p-8 text-slate-800 transition-all duration-700"
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

        {/* Search Bar - compact on mobile */}
        <div className="relative z-10 mb-3 md:mb-5">
          <div className="relative max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              placeholder="Search city..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-20 py-2.5 rounded-xl bg-white/40 backdrop-blur-md border border-white/50
                         text-slate-700 placeholder:text-slate-400 text-sm outline-none
                         focus:bg-white/60 focus:border-white/70 transition-all"
            />
            <button
              onClick={handleSearch}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg bg-white/60
                         text-slate-700 text-xs font-semibold hover:bg-white/80 transition-all active:scale-95"
            >
              Search
            </button>
          </div>
        </div>

        {/* Quick Cities */}
        <div className="relative z-10 flex gap-1.5 md:gap-2 mb-4 md:mb-8 overflow-x-auto scrollbar-hide pb-1">
          {popularCities.map(c => (
            <button
              key={c}
              onClick={() => setCity(c)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] md:text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                city === c
                  ? 'bg-white/80 text-slate-800 shadow-md shadow-black/10'
                  : 'bg-white/25 text-slate-600 border border-white/30 hover:bg-white/50'
              }`}
            >
              <FiMapPin className="text-[9px]" />
              {c}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && !apiError && (
          <div className="flex items-center justify-center py-12 md:py-16">
            <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-slate-400/30 border-t-slate-600 rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {apiError && !weather && (
          <div className="text-center py-8 md:py-12 space-y-2 relative z-10">
            <div className="w-12 h-12 md:w-16 md:h-16 mx-auto rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center">
              <span className="text-xl md:text-2xl text-slate-600">!</span>
            </div>
            <p className="text-base md:text-lg font-semibold text-slate-700">
              {apiError.status === 401
                ? 'Invalid API Key'
                : apiError.status === 404
                ? `City "${city}" not found`
                : 'Failed to fetch weather'}
            </p>
            <p className="text-xs md:text-sm text-slate-500 px-4">
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
            {/* Mobile: side-by-side temp + icon | Desktop: same but bigger */}
            <div className="flex items-center justify-between gap-2">
              {/* Left - Temp & Info */}
              <div className="space-y-1 md:space-y-2 min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/30 backdrop-blur-sm text-[11px] md:text-xs font-semibold text-slate-600">
                  <FiMapPin className="text-[9px] flex-shrink-0" />
                  <span className="truncate">{weather.name}, {weather.sys?.country}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-7xl md:text-[120px] font-thin leading-none tracking-tighter text-slate-700">
                    {Math.round(weather.main.temp)}
                  </span>
                  <span className="text-3xl md:text-6xl font-thin text-slate-500">°C</span>
                </div>
                <p className="text-base md:text-xl capitalize font-medium text-slate-600">
                  {weather.weather[0].description}
                </p>
                <div className="flex items-center gap-3 text-xs md:text-sm text-slate-500">
                  <span>Feels {Math.round(weather.main.feels_like)}°</span>
                  <span className="w-1 h-1 rounded-full bg-slate-400" />
                  <span>H:{Math.round(weather.main.temp_max)}°</span>
                  <span>L:{Math.round(weather.main.temp_min)}°</span>
                </div>
              </div>

              {/* Right - Weather Icon */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 blur-3xl opacity-25 scale-110">
                  <WeatherIcon code={weatherCode} className="text-[80px] md:text-[180px] text-slate-500" />
                </div>
                <WeatherIcon
                  code={weatherCode}
                  className="text-[80px] md:text-[150px] drop-shadow-lg relative z-10 animate-float text-slate-600"
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
              <span className="text-[9px] md:text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400 font-medium">
                {hourlyForecast.length * 3}h
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => scrollHourly('left')}
                className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl
                           bg-white/60 dark:bg-slate-700/60 text-slate-500
                           hover:bg-blue-100 dark:hover:bg-blue-500/20 hover:text-blue-500
                           active:scale-90 transition-all duration-200"
              >
                <FiChevronLeft className="text-sm md:text-base" />
              </button>
              <button
                onClick={() => scrollHourly('right')}
                className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl
                           bg-white/60 dark:bg-slate-700/60 text-slate-500
                           hover:bg-blue-100 dark:hover:bg-blue-500/20 hover:text-blue-500
                           active:scale-90 transition-all duration-200"
              >
                <FiChevronRight className="text-sm md:text-base" />
              </button>
            </div>
          </div>

          <div ref={hourlyRef} className="flex gap-2 overflow-x-auto scrollbar-hide pb-1" style={{ scrollBehavior: 'smooth' }}>
            {hourlyForecast.map((h: any, i: number) => (
              <div
                key={i}
                className={`flex-shrink-0 flex flex-col items-center gap-1 md:gap-1.5 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl w-[70px] md:w-[85px] transition-all duration-200 cursor-default
                  ${i === 0
                    ? 'bg-gradient-to-b from-blue-400 to-blue-500 text-white shadow-lg shadow-blue-400/25 scale-105'
                    : 'bg-white/70 dark:bg-slate-700/40 hover:bg-white dark:hover:bg-slate-600/50'
                  }`}
              >
                <span className={`text-[9px] md:text-[10px] font-semibold tracking-wide ${i === 0 ? 'text-blue-100' : 'text-slate-400'}`}>
                  {i === 0 ? 'NOW' : formatHourlyLabel(h.dt)}
                </span>
                <div className="relative">
                  <WeatherIcon
                    code={h.weather[0].icon}
                    className={`text-2xl md:text-3xl ${i === 0 ? 'text-white drop-shadow-lg' : 'text-amber-400'}`}
                  />
                </div>
                <span className={`text-sm md:text-base font-bold ${i === 0 ? '' : 'text-slate-700 dark:text-slate-200'}`}>
                  {Math.round(h.main.temp)}°
                </span>
                <div className={`flex items-center gap-0.5 ${i === 0 ? 'text-blue-200' : 'text-slate-400'}`}>
                  <WiStrongWind className="text-[10px] md:text-xs" />
                  <span className="text-[8px] md:text-[9px] font-medium">{Math.round(h.wind?.speed || 0)}</span>
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
            {dailyForecast.slice(0, 5).map((day, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-white/60 dark:hover:bg-slate-700/40 transition-colors"
              >
                <span className="text-sm font-medium w-16 text-slate-500 dark:text-slate-400">
                  {formatDay(day.dt)}
                </span>
                <WeatherIcon code={day.icon} className="text-2xl text-amber-400" />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold w-8 text-right text-slate-700 dark:text-slate-200">{day.maxTemp}°</span>
                  {/* Temp range bar */}
                  <div className="w-16 h-1.5 rounded-full bg-blue-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-300 to-orange-300"
                      style={{
                        width: `${Math.max(20, ((day.maxTemp - day.minTemp) / 20) * 100)}%`,
                        marginLeft: `${Math.max(0, ((day.minTemp - (dailyForecast[0]?.minTemp || 0)) / 20) * 100)}%`
                      }}
                    />
                  </div>
                  <span className="text-sm text-slate-400 w-8 text-right">{day.minTemp}°</span>
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
                      formatter={(value: number) => [`${value}°C`, 'Temp']}
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

            {/* Humidity */}
            <div className="bg-sky-50/70 dark:bg-slate-800/60 backdrop-blur-xl border border-sky-100/60 dark:border-slate-700/50 shadow-sm rounded-2xl p-3.5 md:p-5 space-y-2 md:space-y-3 group hover:scale-[1.02] transition-transform duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Humidity</span>
                <WiHumidity className="text-xl md:text-2xl text-blue-400" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-slate-700 dark:text-slate-100">{weather.main.humidity}<span className="text-sm md:text-lg text-slate-400">%</span></p>
              <div className="w-full h-1.5 rounded-full bg-blue-100 dark:bg-slate-700 overflow-hidden">
                <div className="h-full rounded-full bg-blue-300 dark:bg-blue-400 transition-all duration-700" style={{ width: `${weather.main.humidity}%` }} />
              </div>
            </div>

            {/* Wind */}
            <div className="bg-emerald-50/60 dark:bg-slate-800/60 backdrop-blur-xl border border-emerald-100/50 dark:border-slate-700/50 shadow-sm rounded-2xl p-3.5 md:p-5 space-y-2 md:space-y-3 group hover:scale-[1.02] transition-transform duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Wind</span>
                <FiNavigation
                  className="text-base md:text-lg text-emerald-400 transition-transform duration-300"
                  style={{ transform: `rotate(${weather.wind.deg || 0}deg)` }}
                />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-slate-700 dark:text-slate-100">{weather.wind.speed}<span className="text-sm md:text-lg text-slate-400"> km/h</span></p>
              <p className="text-[10px] md:text-xs text-slate-400">
                Gusts: {weather.wind.gust ? `${weather.wind.gust} km/h` : 'N/A'}
              </p>
            </div>

            {/* Pressure */}
            <div className="bg-purple-50/60 dark:bg-slate-800/60 backdrop-blur-xl border border-purple-100/50 dark:border-slate-700/50 shadow-sm rounded-2xl p-3.5 md:p-5 space-y-2 md:space-y-3 group hover:scale-[1.02] transition-transform duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pressure</span>
                <WiBarometer className="text-xl md:text-2xl text-purple-400" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-slate-700 dark:text-slate-100">{weather.main.pressure}<span className="text-sm md:text-lg text-slate-400"> hPa</span></p>
              <p className="text-[10px] md:text-xs text-slate-400">
                {weather.main.pressure > 1013 ? 'Above normal' : weather.main.pressure < 1013 ? 'Below normal' : 'Normal'}
              </p>
            </div>

            {/* Visibility */}
            <div className="bg-amber-50/60 dark:bg-slate-800/60 backdrop-blur-xl border border-amber-100/50 dark:border-slate-700/50 shadow-sm rounded-2xl p-3.5 md:p-5 space-y-2 md:space-y-3 group hover:scale-[1.02] transition-transform duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Visibility</span>
                <WiDayHaze className="text-xl md:text-2xl text-amber-400" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-slate-700 dark:text-slate-100">{(weather.visibility / 1000).toFixed(1)}<span className="text-sm md:text-lg text-slate-400"> km</span></p>
              <p className="text-[10px] md:text-xs text-slate-400">
                {weather.visibility >= 10000 ? 'Excellent' : weather.visibility >= 5000 ? 'Good' : 'Poor'}
              </p>
            </div>

            {/* Sunrise */}
            <div className="bg-orange-50/60 dark:bg-slate-800/60 backdrop-blur-xl border border-orange-100/50 dark:border-slate-700/50 shadow-sm rounded-2xl p-3.5 md:p-5 space-y-2 md:space-y-3 group hover:scale-[1.02] transition-transform duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sunrise</span>
                <WiSunrise className="text-xl md:text-2xl text-orange-400" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-slate-700 dark:text-slate-100">{formatTime(weather.sys.sunrise)}</p>
              <p className="text-[10px] md:text-xs text-slate-400">
                Sunset at {formatTime(weather.sys.sunset)}
              </p>
            </div>

            {/* Feels Like */}
            <div className="bg-rose-50/60 dark:bg-slate-800/60 backdrop-blur-xl border border-rose-100/50 dark:border-slate-700/50 shadow-sm rounded-2xl p-3.5 md:p-5 space-y-2 md:space-y-3 group hover:scale-[1.02] transition-transform duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Feels Like</span>
                <WiThermometer className="text-xl md:text-2xl text-rose-400" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-slate-700 dark:text-slate-100">{Math.round(weather.main.feels_like)}<span className="text-sm md:text-lg text-slate-400">°C</span></p>
              <p className="text-[10px] md:text-xs text-slate-400">
                {Math.round(weather.main.feels_like) > Math.round(weather.main.temp) ? 'Warmer than actual' :
                 Math.round(weather.main.feels_like) < Math.round(weather.main.temp) ? 'Cooler than actual' : 'Same as actual'}
              </p>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
