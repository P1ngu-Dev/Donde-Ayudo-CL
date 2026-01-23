import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      
      manifest: {
        name: 'Donde Ayudo CL - Mapa Solidario',
        short_name: 'Donde Ayudo',
        description: 'Mapa solidario de puntos de ayuda en Chile - Albergues, centros de acopio y puntos de hidratación en emergencias',
        theme_color: '#1E40AF',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'es-CL',
        
        icons: [
          {
            src: '/icons/icon-72x72.svg',
            sizes: '72x72',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-96x96.svg',
            sizes: '96x96',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-128x128.svg',
            sizes: '128x128',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-144x144.svg',
            sizes: '144x144',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-152x152.svg',
            sizes: '152x152',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-384x384.svg',
            sizes: '384x384',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ],
        
        categories: ['utilities', 'social', 'lifestyle'],
        screenshots: [],
        
        shortcuts: [
          {
            name: 'Ver mapa',
            short_name: 'Mapa',
            description: 'Ver todos los puntos de ayuda',
            url: '/',
            icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }]
          }
        ]
      },
      
      workbox: {
        // Estrategia de caché agresiva para funcionamiento offline
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
        
        // Runtime caching para recursos externos
        runtimeCaching: [
          {
            // Cachear tiles de OpenStreetMap
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 días
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cachear API/datos (cuando se implemente PocketBase)
            urlPattern: /^https:\/\/api\.dondeayudo\.cl\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutos
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            // Cachear otros recursos
            urlPattern: /^https?.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'others-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 // 1 día
              },
              networkTimeoutSeconds: 10
            }
          }
        ],
        
        // Configuración adicional
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        
        // Navegación offline fallback
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/]
      },
      
      devOptions: {
        enabled: true, // Habilitar PWA en desarrollo para testing
        type: 'module',
        navigateFallback: 'index.html'
      }
    })
  ],
  
  // Optimizaciones de build
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Eliminar console.log en producción
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'leaflet': ['leaflet']
        }
      }
    },
    // Tamaño de chunk warning
    chunkSizeWarningLimit: 600
  },
  
  // Optimización de servidor
  server: {
    headers: {
      'Cache-Control': 'no-store'
    }
  }
});
