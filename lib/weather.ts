export const weatherUrl = (city: string) => `/api/weather?type=weather&q=${encodeURIComponent(city)}`
export const forecastUrl = (city: string) => `/api/weather?type=forecast&q=${encodeURIComponent(city)}`
