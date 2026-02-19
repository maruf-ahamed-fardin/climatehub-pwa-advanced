export const newsUrl = (query: string, page: number = 1) =>
  `/api/news?q=${encodeURIComponent(query)}&page=${page}`
