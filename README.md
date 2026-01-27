# Donde Ayudo CL - Mapa Solidario 🇨🇱

Plataforma web progresiva (PWA) para centralizar información de ayuda en emergencias en Chile - Albergues, centros de acopio, puntos de hidratación y más.

## Características

- **Offline-First:** Funciona sin conexión a internet gracias a Service Workers
- **Ultra Rápido:** Sin frameworks pesados, optimizado para redes 2G/3G
- **Mobile-First:** Diseño táctil y amigable para uso en terreno
- **Mapa Interactivo:** Leaflet.js con marcadores SVG ligeros
- **Caché Inteligente:** Los datos persisten localmente con LocalStorage
- **Accesible:** Alto contraste, soporte para lectores de pantalla

## Inicio Rápido

### Prerrequisitos
- Node.js 18+ 
- npm o yarn

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/P1ngu-Dev/Donde-Ayudo-CL.git
cd Donde-Ayudo-CL

# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## Stack Tecnológico

- **Frontend:** Vite + Vanilla JavaScript (sin React/Vue)
- **Estilos:** Tailwind CSS v4
- **Mapas:** Leaflet.js (~40KB)
- **PWA:** vite-plugin-pwa + Workbox
- **Backend:** Go + SQLite (API REST)

## Estructura del Proyecto

```
Donde-Ayudo-CL/
├── src/
│   ├── main.js              # Punto de entrada
│   ├── map.js               # Manager del mapa Leaflet
│   ├── icons.js             # Sistema de iconos SVG
│   ├── services/
│   │   └── DataRepository.js # Gestión de datos offline-first
│   ├── data/
│   │   └── mock-points.json # Datos de prueba
│   └── styles/
│       └── main.css         # Estilos globales
├── public/
│   └── icons/               # Iconos PWA
├── docs/                    # Documentación del proyecto
├── vite.config.js           # Configuración de Vite + PWA
└── package.json
```

## Desarrollo

### PWA en Desarrollo

La PWA está habilitada en desarrollo para facilitar pruebas. Puedes:

1. Abrir DevTools → Application → Service Workers
2. Verificar el caché en Cache Storage
3. Simular modo offline en Network tab

### Generar Iconos

```bash
node generate-icons.js
```

### Build de Producción

```bash
npm run build
```

Esto genera:
- Bundle optimizado y minificado
- Service Worker con estrategias de caché
- Manifest.json para instalación
- Assets con hash para cache busting

## Instalación como App

### Android
1. Abre el sitio en Chrome
2. Toca el menú (⋮) → "Instalar app"
3. Confirma en el popup

### iOS
1. Abre el sitio en Safari
2. Toca el botón Compartir
3. "Añadir a pantalla de inicio"

## Herramientas de Desarrollo 

### Conversor de Datos (Go)

Herramienta de alta performance para convertir CSV a JSON con geocodificación:

```bash
cd tools/data-converter
make build
./data-converter -input ../../src/data/data1.csv -output ../../src/data/data1.json -verbose
```

**Características:**
- 10-50x más rápido que Python
- Geocodificación automática (OpenStreetMap)
- Sistema de caché inteligente
- Procesamiento concurrente

Ver documentación completa: [tools/data-converter/README.md](./tools/data-converter/README.md)

## Uso

1. **Ver Mapa:** Al cargar, se muestran todos los puntos disponibles
2. **Filtrar:** Toca el botón de filtro para ver solo albergues, acopio, etc.
3. **Ubicación:** Toca el pin para centrar el mapa en tu ubicación
4. **Detalles:** Haz clic en cualquier marcador para ver información completa
5. **Offline:** Los datos se guardan automáticamente para uso sin conexión

## Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

ISC License

## Soporte

Para reportar bugs o solicitar features, usa [GitHub Issues](https://github.com/P1ngu-Dev/Donde-Ayudo-CL/issues)

## Autores

- P1ngu - [GitHub](https://github.com/P1ngu-Dev)

---

**Hecho con ❤️ para ayudar a Chile en momentos de emergencia**