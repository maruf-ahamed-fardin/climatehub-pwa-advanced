'use client'
import { useEffect } from 'react'
import { useSettings } from '@/lib/settings'

export default function SettingsHydrator() {
  useEffect(() => {
    useSettings.persist.rehydrate()
  }, [])
  return null
}
