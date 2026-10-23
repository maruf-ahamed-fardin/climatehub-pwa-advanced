export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 mt-12">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} ClimateHub. All rights reserved.
          </p>
          <p className="text-xs text-slate-400">
            Weather data by{' '}
            <a href="https://openweathermap.org" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors underline-offset-2 hover:underline">
              OpenWeather
            </a>
            {' · '}News via Google News &amp; BBC
          </p>
        </div>
      </div>
    </footer>
  )
}
