import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Coords } from './weather'

export type TempUnit = 'C' | 'F'
export type WindUnit = 'kmh' | 'mph'

interface SettingsState {
  tempUnit: TempUnit
  windUnit: WindUnit
  lastCity: string
  // Set when the user picked "my location"; takes precedence over lastCity
  coords: Coords | null
  hydrated: boolean
  setTempUnit: (u: TempUnit) => void
  setWindUnit: (u: WindUnit) => void
  setLastCity: (c: string) => void
  setCoords: (c: Coords) => void
}

// skipHydration keeps the first client render identical to the server render;
// SettingsHydrator rehydrates from localStorage after mount.
export const useSettings = create<SettingsState>()(
  persist(
    set => ({
      tempUnit: 'C',
      windUnit: 'kmh',
      lastCity: 'London',
      coords: null,
      hydrated: false,
      setTempUnit: tempUnit => set({ tempUnit }),
      setWindUnit: windUnit => set({ windUnit }),
      setLastCity: lastCity => set({ lastCity, coords: null }),
      setCoords: coords => set({ coords }),
    }),
    {
      name: 'climatehub-settings',
      skipHydration: true,
      partialize: ({ tempUnit, windUnit, lastCity, coords }) => ({ tempUnit, windUnit, lastCity, coords }),
      onRehydrateStorage: () => () => useSettings.setState({ hydrated: true }),
    }
  )
)

// OpenWeather metric units: temp in °C, wind in m/s
export const convertTemp = (c: number, unit: TempUnit) => Math.round(unit === 'F' ? c * 9 / 5 + 32 : c)
export const convertWind = (ms: number, unit: WindUnit) => Math.round(unit === 'mph' ? ms * 2.237 : ms * 3.6)
export const windLabel = (unit: WindUnit) => (unit === 'mph' ? 'mph' : 'km/h')
