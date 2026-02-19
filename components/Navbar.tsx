'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import ThemeToggle from './ThemeToggle'
import { WiDayCloudy } from 'react-icons/wi'
import { FiMenu, FiX, FiDownload } from 'react-icons/fi'

const links = [
  { href: '/weather', label: 'Weather' },
  { href: '/news', label: 'News' },
  { href: '/settings', label: 'Settings' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<any>(null)

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = () => {
    if (installPrompt) {
      installPrompt.prompt()
      setInstallPrompt(null)
    } else {
      // Fallback: guide user to use browser's install option
      alert('To install ClimateHub, use your browser menu and select "Add to Home Screen" or "Install App".')
    }
  }

  return (
    <nav className="glass-nav sticky top-0 z-50 px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <WiDayCloudy className="text-4xl text-blue-500 group-hover:text-blue-400 transition-colors" />
          <span className="font-bold text-xl tracking-tight">ClimateHub</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                pathname === link.href || (link.href === '/weather' && pathname === '/')
                  ? 'text-blue-500 bg-blue-50 dark:bg-blue-500/10'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Install Button */}
          <button
            onClick={handleInstall}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium
                       bg-blue-500 text-white hover:bg-blue-600 transition-all duration-200
                       hover:shadow-lg hover:shadow-blue-500/25 active:scale-95"
          >
            <FiDownload className="text-sm" />
            <span className="hidden sm:inline">Install</span>
          </button>

          <ThemeToggle />

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden mt-3 pb-2 border-t border-slate-200/60 dark:border-slate-700/40 pt-3 animate-slide-down">
          <div className="flex flex-col gap-1">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  pathname === link.href || (link.href === '/weather' && pathname === '/')
                    ? 'text-blue-500 bg-blue-50 dark:bg-blue-500/10'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile Install Button */}
            <button
              onClick={() => { handleInstall(); setMenuOpen(false) }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
                         text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
            >
              <FiDownload />
              Install App
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
