'use client'
import useSWR from 'swr'
import { useState } from 'react'
import { fetcher } from '@/lib/fetcher'
import { weatherUrl, forecastUrl } from '@/lib/weather'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { FiSearch } from 'react-icons/fi'
import {
  WiDaySunny, WiNightClear, WiDayCloudy, WiNightAltCloudy,
  WiCloud, WiCloudy, WiRain, WiDayRain, WiNightAltRain,
  WiThunderstorm, WiSnow, WiFog,
  WiHumidity, WiStrongWind, WiBarometer,
  WiThermometer, WiSunrise, WiDayHaze
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

function WeatherIcon({ code, className }: { code: string; className?: string }) {
  const Icon = iconMap[code] || WiDaySunny
  return <Icon className={className} />
}

function formatTime(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
}

function formatDateTime(ts: number) {
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    weekday: 'long', hour: 'numeric', minute: '2-digit', hour12: true
  })
}

function getDayName(ts: number) {
  return new Date(ts * 1000).toLocaleDateString('en-US', { weekday: 'short' })
}

function processDailyForecast(list: any[]) {
  const days: Record<string, { temps: number[]; icons: string[]; name: string }> = {}
  list.forEach((item: any) => {
    const date = new Date(item.dt * 1000)
    const key = date.toDateString()
    if (!days[key]) {
      days[key] = { temps: [], icons: [], name: getDayName(item.dt) }
    }
    days[key].temps.push(item.main.temp)
    days[key].icons.push(item.weather[0].icon)
  })
  return Object.values(days).map(day => ({
    name: day.name,
    maxTemp: Math.round(Math.max(...day.temps)),
    minTemp: Math.round(Math.min(...day.temps)),
    icon: day.icons[Math.floor(day.icons.length / 2)]
  }))
}

export default function WeatherPage() {
  const [city, setCity] = useState('London')
  const [searchInput, setSearchInput] = useState('')
  const [activeTab, setActiveTab] = useState<'7days' | '24hours'>('7days')

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
  const hourlyForecast = forecast ? forecast.list.slice(0, 8) : []

  const handleSearch = () => {
    if (searchInput.trim()) {
      setCity(searchInput.trim())
      setSearchInput('')
    }
  }

  const chartData = hourlyForecast.map((f: any) => ({
    time: formatTime(f.dt),
    temp: Math.round(f.main.temp)
  }))

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Hero Section */}
      <div className="grid md:grid-cols-5 gap-6">
        {/* Left - Current Weather */}
        <div className="md:col-span-3 glass-card p-8 rounded-2xl">
          {isLoading && !apiError && (
            <div className="flex items-center justify-center h-48">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {apiError && !weather && (
            <div className="flex flex-col items-center justify-center h-48 text-center space-y-3">
              <p className="text-4xl">⚠️</p>
              <p className="text-lg font-semibold text-red-400">
                {apiError.status === 401
                  ? 'Invalid API Key'
                  : apiError.status === 404
                  ? `City "${city}" not found`
                  : 'Failed to fetch weather'}
              </p>
              <p className="text-sm text-slate-400">
                {apiError.status === 401
                  ? 'Your OpenWeatherMap API key is invalid or not yet activated. New keys can take up to 30 minutes.'
                  : apiError.status === 404
                  ? 'Please check the city name and try again.'
                  : 'Please check your connection and try again.'}
              </p>
            </div>
          )}
          {weather && (
            <div className="animate-slide-up">
              <h1 className="text-3xl font-bold">{weather.name}, {weather.sys?.country}</h1>
              <div className="flex items-center gap-2 mt-4">
                <span className="text-7xl md:text-8xl font-extralight">
                  {Math.round(weather.main.temp)}°<sup className="text-2xl font-normal">C</sup>
                </span>
                <WeatherIcon code={weather.weather[0].icon} className="text-8xl md:text-9xl text-yellow-400 -ml-2" />
              </div>
              <p className="text-xl text-slate-500 dark:text-slate-400 capitalize mt-1">
                {weather.weather[0].description}
              </p>
              <p className="text-sm text-slate-400 mt-1">{formatDateTime(weather.dt)}</p>
            </div>
          )}
        </div>

        {/* Right - Search + Details */}
        <div className="md:col-span-2 space-y-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search for a city..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="input-search"
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
            >
              <FiSearch />
            </button>
          </div>

          {/* Details Panel */}
          {weather && (
            <div className="glass-card p-6 rounded-2xl space-y-4 animate-slide-up">
              <p className="text-sm text-slate-500 dark:text-slate-400">{formatDateTime(weather.dt)}</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Feels like</span>
                  <span className="font-semibold">{Math.round(weather.main.feels_like)}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Min / Max</span>
                  <span className="font-semibold">
                    {Math.round(weather.main.temp_min)}° / {Math.round(weather.main.temp_max)}°
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Humidity</span>
                  <span className="font-semibold">{weather.main.humidity}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Wind</span>
                  <span className="font-semibold">{weather.wind.speed} km/h</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('7days')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            activeTab === '7days' ? 'tab-active' : 'tab-inactive'
          }`}
        >
          7 Days
        </button>
        <button
          onClick={() => setActiveTab('24hours')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            activeTab === '24hours' ? 'tab-active' : 'tab-inactive'
          }`}
        >
          24 Hours
        </button>
      </div>

      {/* Forecast + Chart Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Forecast Cards */}
        <div className="glass-card p-6 rounded-2xl">
          {activeTab === '7days' ? (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {dailyForecast.slice(0, 5).map((day, i) => (
                <div key={i} className="forecast-card">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{day.name}</p>
                  <WeatherIcon code={day.icon} className="text-3xl text-yellow-400 mx-auto my-1" />
                  <p className="font-bold text-sm">{day.maxTemp}°</p>
                  <p className="text-xs text-slate-400">{day.minTemp}°</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {hourlyForecast.map((h: any, i: number) => (
                <div key={i} className="forecast-card flex-shrink-0 min-w-[80px]">
                  <p className="text-xs text-slate-500">{formatTime(h.dt)}</p>
                  <WeatherIcon code={h.weather[0].icon} className="text-2xl text-yellow-400 mx-auto my-1" />
                  <p className="font-bold text-sm">{Math.round(h.main.temp)}°</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Temperature Chart */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            Temperature <WiThermometer className="text-xl text-red-400" />
          </h3>
          {chartData.length > 0 && (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15,23,42,0.9)',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '13px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="temp"
                    stroke="#3b82f6"
                    fill="url(#tempGrad)"
                    strokeWidth={2.5}
                    dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#60a5fa' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Hourly Scroll Strip */}
      {hourlyForecast.length > 0 && (
        <div className="glass-card p-4 rounded-2xl">
          <div className="flex gap-4 overflow-x-auto pb-1">
            {hourlyForecast.map((h: any, i: number) => (
              <div key={i} className="flex items-center gap-3 flex-shrink-0 px-3 py-2 rounded-xl bg-slate-50/50 dark:bg-slate-700/30">
                <span className="text-sm font-medium text-slate-500">{i === 0 ? 'Now' : formatTime(h.dt)}</span>
                <WeatherIcon code={h.weather[0].icon} className="text-xl text-yellow-400" />
                <span className="font-bold">{Math.round(h.main.temp)}°</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weather Details */}
      {weather && (
        <div className="animate-slide-up">
          <h2 className="text-xl font-semibold mb-4">Weather Details</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="detail-card">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10">
                <WiHumidity className="text-3xl text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Humidity</p>
                <p className="text-xl font-bold">{weather.main.humidity}%</p>
              </div>
            </div>
            <div className="detail-card">
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-500/10">
                <WiStrongWind className="text-3xl text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Wind Speed</p>
                <p className="text-xl font-bold">{weather.wind.speed} km/h</p>
              </div>
            </div>
            <div className="detail-card">
              <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-500/10">
                <WiDayHaze className="text-3xl text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Visibility</p>
                <p className="text-xl font-bold">{(weather.visibility / 1000).toFixed(1)} km</p>
              </div>
            </div>
            <div className="detail-card">
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-500/10">
                <WiBarometer className="text-3xl text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pressure</p>
                <p className="text-xl font-bold">{weather.main.pressure} hPa</p>
              </div>
            </div>
            <div className="detail-card">
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10">
                <WiSunrise className="text-3xl text-rose-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Sunrise</p>
                <p className="text-xl font-bold">{formatTime(weather.sys.sunrise)}</p>
              </div>
            </div>
            <div className="detail-card">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10">
                <WiThermometer className="text-3xl text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Feels Like</p>
                <p className="text-xl font-bold">{Math.round(weather.main.feels_like)}°C</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
