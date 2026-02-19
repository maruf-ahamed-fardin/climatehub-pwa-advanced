import './globals.css'
import { ThemeProvider } from 'next-themes'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import InstallPrompt from '@/components/InstallPrompt'

export const metadata = {
  title: 'ClimateHub',
  description: 'Weather & Climate News PWA',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: any) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <InstallPrompt />
            <main className="flex-1 px-4 md:px-6 py-6">
              {children}
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
