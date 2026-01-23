# Plan de Implementación: Donde Ayudo CL (PWA)
## Fase 1: Cimientos y Configuración Ligera
*   Inicialización: Crear proyecto Vite con plantilla vanilla (JS puro, sin framework pesado).
*   Estilos: Instalar Tailwind CSS y configurar el content purge estrictamente para eliminar CSS no usado en producción.
*   Mapa: Instalar leaflet (es ligero, ~40KB gzipped).
*   Estructura de Directorios: Organizar por funcionalidad (/services, /components, /assets).
## Fase 2: Arquitectura de Datos (Prioridad: Flexibilidad)
*   Definición del Esquema (JSON Contract): Definiremos una estructura JSON única que la App entenderá (ej: { id, lat, lng, type, status, metadata }).
*   Servicio de Datos (Repository Pattern):
    *   Crearemos DataRepository.js.
    *   Estado Inicial: Cargará mockData.json (que crearemos ahora).
    *   Estado Futuro: Solo cambiaremos una línea en este archivo para apuntar a la URL de PocketBase.
*   Estrategia Offline: Implementar lógica que guarda este JSON en localStorage con un timestamp. Si no hay red, carga lo guardado.
## Fase 3: Visualización Eficiente (Mapa)
*   Marcadores SVG: En lugar de cargar imágenes .png para los pines (que pesan y requieren requests HTTP), usaremos L.divIcon con código SVG o CSS puro (círculos de colores con borde).
    *   Ventaja: Peso casi nulo, escalable infinito, personalizable por código (Colores: Verde=Abierto, Rojo=Lleno).
*   Renderizado: Pintar los puntos del DataRepository en el mapa.
## Fase 4: Interfaz Mobile-First (UI)
*   Controles: Botones grandes y flotantes para "Mi ubicación" y "Filtrar" (usando Tailwind).
*   Detalles: Al hacer clic en un punto, mostrar un panel inferior (Bottom Sheet) o Popup simple con la info.
## Fase 5: PWA y Build
*   Manifest: Crear manifest.json para que sea instalable.
*   Service Worker: Configurar vite-plugin-pwa para cachear el bundle (JS/CSS) y que la app cargue instantáneamente sin internet.
---
### Tareas Paso a Paso (Checklist para iniciar)
1.  Scaffold: Ejecutar comandos de inicialización (Vite + Tailwind).
2.  Mock Data: Crear el archivo src/data/mock-points.json con 5-10 puntos de prueba (mezcla de albergues y acopios).
3.  Map Component: Crear src/map.js e inicializar Leaflet.
4.  Data Integration: Conectar el Mock Data al mapa.