const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  // Shown when a page is requested offline and isn't in the cache
  fallbacks: {
    document: "/offline.html",
  },
})

module.exports = withPWA({
  reactStrictMode: true,
})