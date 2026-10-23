'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import ThemeToggle from './ThemeToggle'
import { WiDayCloudy } from 'react-icons/wi'
import { FiDownload, FiCloud, FiFileText, FiSettings } from 'react-icons/fi'

const links = [
  { href: '/weather', label: 'Weather', icon: FiCloud },
  { href: '/news', label: 'News', icon: FiFileText },
  { href: '/settings', label: 'Settings', icon: FiSettings },
]

export default function Navbar() {
  const pathname = usePathname()
  const [installPrompt, setInstallPrompt] = useState<any>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  const isActive = (href: string) => pathname === href || (href === '/weather' && pathname === '/')

  return (
    <>
      {/* Top bar - safe-area padding keeps it below the notch in standalone mode */}
      <nav className="glass-nav sticky top-0 z-50 px-4 md:px-6 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
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
                  isActive(link.href)
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
            {/* Only shown when the browser offers installation */}
            {installPrompt && (
              <button
                onClick={handleInstall}
                aria-label="Install app"
                className="inline-flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-xl text-xs font-medium
                           bg-blue-500 text-white hover:bg-blue-600 transition-all duration-200 active:scale-95"
              >
                <FiDownload className="text-sm" />
                <span className="hidden sm:inline">Install</span>
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Primary"
        className="md:hidden fixed bottom-0 inset-x-0 z-50 glass-nav border-b-0 border-t pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-3">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-1 h-16 text-[11px] font-medium transition-colors ${
                isActive(href) ? 'text-blue-500' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <span className={`flex items-center justify-center w-12 h-7 rounded-full transition-colors ${
                isActive(href) ? 'bg-blue-50 dark:bg-blue-500/15' : ''
              }`}>
                <Icon className="text-lg" />
              </span>
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
