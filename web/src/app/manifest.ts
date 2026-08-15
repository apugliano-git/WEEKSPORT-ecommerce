import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WEEKSPORT — Indumentaria Deportiva',
    short_name: 'WEEKSPORT',
    description: 'Catálogo de indumentaria deportiva y gestión de stock.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F0F12',
    theme_color: '#0F0F12',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
