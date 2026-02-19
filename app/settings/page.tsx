'use client'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { BsSunFill, BsMoonStarsFill } from 'react-icons/bs'
import { FiMonitor, FiGlobe, FiInfo, FiBell } from 'react-icons/fi'
import { WiDayCloudy } from 'react-icons/wi'

export default function SettingsPage() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <h1 className="text-3xl font-bold">Settings</h1>

      {/* Appearance */}
      <section className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <FiMonitor className="text-blue-500" /> Appearance
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border-2 transition-all text-center ${
              resolvedTheme === 'light'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <BsSunFill className="text-2xl text-amber-500 mx-auto mb-2" />
            <span className="text-sm font-medium">Light</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border-2 transition-all text-center ${
              resolvedTheme === 'dark'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <BsMoonStarsFill className="text-2xl text-blue-500 mx-auto mb-2" />
            <span className="text-sm font-medium">Dark</span>
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`p-4 rounded-xl border-2 transition-all text-center border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600`}
          >
            <FiMonitor className="text-2xl text-slate-500 mx-auto mb-2" />
            <span className="text-sm font-medium">System</span>
          </button>
        </div>
      </section>

      {/* Notifications */}
      <section className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <FiBell className="text-green-500" /> Notifications
        </h2>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="font-medium">Weather Alerts</p>
            <p className="text-sm text-slate-500">Get notified about severe weather</p>
          </div>
          <div className="w-12 h-7 rounded-full bg-slate-300 dark:bg-slate-600 relative cursor-pointer">
            <div className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow" />
          </div>
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="font-medium">Daily Forecast</p>
            <p className="text-sm text-slate-500">Receive daily weather summary</p>
          </div>
          <div className="w-12 h-7 rounded-full bg-slate-300 dark:bg-slate-600 relative cursor-pointer">
            <div className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow" />
          </div>
        </div>
      </section>

      {/* Units */}
      <section className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <FiGlobe className="text-purple-500" /> Units
        </h2>
        <div className="flex items-center justify-between py-2">
          <p className="font-medium">Temperature</p>
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
            <button className="px-4 py-1.5 rounded-full text-sm font-medium bg-blue-500 text-white">°C</button>
            <button className="px-4 py-1.5 rounded-full text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">°F</button>
          </div>
        </div>
        <div className="flex items-center justify-between py-2">
          <p className="font-medium">Wind Speed</p>
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
            <button className="px-4 py-1.5 rounded-full text-sm font-medium bg-blue-500 text-white">km/h</button>
            <button className="px-4 py-1.5 rounded-full text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">mph</button>
          </div>
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
