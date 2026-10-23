'use client'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { BsSunFill, BsMoonStarsFill } from 'react-icons/bs'
import { FiMonitor, FiGlobe, FiInfo } from 'react-icons/fi'
import { WiDayCloudy } from 'react-icons/wi'
import { useSettings } from '@/lib/settings'

const themeOptions = [
  { value: 'light', label: 'Light', icon: <BsSunFill className="text-2xl text-amber-500 mx-auto mb-2" /> },
  { value: 'dark', label: 'Dark', icon: <BsMoonStarsFill className="text-2xl text-blue-500 mx-auto mb-2" /> },
  { value: 'system', label: 'System', icon: <FiMonitor className="text-2xl text-slate-500 mx-auto mb-2" /> },
]

function Segmented<T extends string>({ value, options, onChange, label }: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
      {options.map(o => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            value === o.value
              ? 'bg-blue-500 text-white'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function SettingsPage() {
  // `theme` is the user's choice ('system' included); resolvedTheme is only ever light/dark
  const { theme, setTheme } = useTheme()
  const { tempUnit, setTempUnit, windUnit, setWindUnit } = useSettings()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <h1 className="text-3xl font-bold">Settings</h1>

      {/* Appearance */}
      <section className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <FiMonitor className="text-blue-500" /> Appearance
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map(o => (
            <button
              key={o.value}
              onClick={() => setTheme(o.value)}
              aria-pressed={mounted && theme === o.value}
              className={`p-4 rounded-xl border-2 transition-all text-center ${
                mounted && theme === o.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {o.icon}
              <span className="text-sm font-medium">{o.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Units */}
      <section className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <FiGlobe className="text-purple-500" /> Units
        </h2>
        <div className="flex items-center justify-between gap-4 py-2">
          <p className="font-medium">Temperature</p>
          <Segmented
            label="Temperature unit"
            value={tempUnit}
            onChange={setTempUnit}
            options={[{ value: 'C', label: '°C' }, { value: 'F', label: '°F' }]}
          />
        </div>
        <div className="flex items-center justify-between gap-4 py-2">
          <p className="font-medium">Wind Speed</p>
          <Segmented
            label="Wind speed unit"
            value={windUnit}
            onChange={setWindUnit}
            options={[{ value: 'kmh', label: 'km/h' }, { value: 'mph', label: 'mph' }]}
          />
        </div>
      </section>

      {/* About */}
      <section className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <FiInfo className="text-cyan-500" /> About
        </h2>
        <div className="flex items-center gap-3">
          <WiDayCloudy className="text-4xl text-blue-500" />
          <div>
            <p className="font-bold">ClimateHub PWA</p>
            <p className="text-sm text-slate-500">Version 1.0.0</p>
          </div>
        </div>
        <p className="text-sm text-slate-500">
          A progressive web app for real-time weather data and climate news.
          Built with Next.js, Tailwind CSS, and OpenWeatherMap API.
        </p>
      </section>
    </div>
  )
}
