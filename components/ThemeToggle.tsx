'use client'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { BsSunFill, BsMoonStarsFill } from 'react-icons/bs'

export default function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  // Same footprint as the rendered toggle so the navbar doesn't shift on mount
  if (!mounted) return <div className="w-16 sm:w-[130px] h-9" />

  const isDark = resolvedTheme === 'dark'

  return (
    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
      {/* Label hidden on small phones so the navbar fits at 320px */}
      <BsMoonStarsFill className="hidden sm:block text-sm text-slate-400 ml-2" />
      <span className="hidden sm:inline text-xs font-medium text-slate-500 dark:text-slate-400 select-none">
        {isDark ? 'Dark' : 'Light'}
      </span>
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="relative w-14 h-7 rounded-full transition-colors duration-300 bg-slate-300 dark:bg-blue-600"
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        <div
          className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center ${
            isDark ? 'left-[30px]' : 'left-0.5'
          }`}
        >
          {isDark
            ? <BsMoonStarsFill className="text-[10px] text-blue-600" />
            : <BsSunFill className="text-[10px] text-amber-500" />
          }
        </div>
      </button>
    </div>
  )
}
