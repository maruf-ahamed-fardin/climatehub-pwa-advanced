const API = process.env.NEXT_PUBLIC_WEATHER_API
export const weatherUrl = (city: string) => `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API}`
export const forecastUrl = (city: string) => `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API}`