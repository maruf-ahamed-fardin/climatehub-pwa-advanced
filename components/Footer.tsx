import { FaFacebookF, FaTwitter, FaYoutube } from 'react-icons/fa'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 mt-12">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} ClimateHub. All rights reserved.
          </p>

          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/settings" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/settings" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <a href="#" className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all">
              <FaFacebookF className="text-sm" />
            </a>
            <a href="#" className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all">
              <FaTwitter className="text-sm" />
            </a>
            <a href="#" className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
              <FaYoutube className="text-sm" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
