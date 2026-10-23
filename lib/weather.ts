export type Coords = { lat: number; lon: number }

// A place is either a searched city name or the user's coordinates
const location = (city: string, coords: Coords | null) =>
  coords ? `lat=${coords.lat}&lon=${coords.lon}` : `q=${encodeURIComponent(city)}`

export const weatherUrl = (city: string, coords: Coords | null = null) => `/api/weather?type=weather&${location(city, coords)}`
export const forecastUrl = (city: string, coords: Coords | null = null) => `/api/weather?type=forecast&${location(city, coords)}`
export const airUrl = (coords: Coords) => `/api/weather?type=air&lat=${coords.lat}&lon=${coords.lon}`
