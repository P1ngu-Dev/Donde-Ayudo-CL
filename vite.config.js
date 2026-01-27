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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        
        // NO cachear tiles de OpenStreetMap ni API externa
        navigateFallbackDenylist: [/^\/api/, /tile\.openstreetmap\.org/],
        
        // Runtime caching solo para API y recursos propios
        runtimeCaching: [
          {
            // Cachear API/datos (cuando se implemente PocketBase)
            urlPattern: /^https:\/\/api\.dondeayudo\.cl\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 10 // 10 minutos
              },
              networkTimeoutSeconds: 3
            }
          },
          {
            // Cachear otros recursos
            urlPattern: /^https?.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'others-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 1 día
              }
            }
          }
        ],
        
        // Configuración adicional
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        
        // Navegación offline fallback
        navigateFallback: '/index.html'
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
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'leaflet': ['leaflet']
        },
        // Mejor estrategia de nombres para cache
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Tamaño de chunk warning
    chunkSizeWarningLimit: 500,
    // Comprimir CSS
    cssMinify: true,
    // Reportar tamaño comprimido
    reportCompressedSize: true
  },
  
  // Optimización de servidor
  server: {
    host: true, // Exponer en red local
    allowedHosts: ['.serveousercontent.com', '.ngrok.io', '.loca.lt'], // Permitir túneles
    headers: {
      'Cache-Control': 'no-store'
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true
      },
      '/_': {
        target: 'http://127.0.0.1:8090',
        changeOrigin: true
      }
    }
  }
});
