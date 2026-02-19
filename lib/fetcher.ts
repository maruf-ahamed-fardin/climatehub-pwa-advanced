export const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error: any = new Error('API request failed')
    try {
      error.info = await res.json()
    } catch {
      error.info = { message: res.statusText }
    }
    error.status = res.status
    throw error
  }
  return res.json()
}
