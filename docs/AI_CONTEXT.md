# Contexto del Proyecto: SOS Mapa Chile 2026

## Visión General
Este proyecto es una respuesta tecnológica de emergencia ante la catástrofe de incendios en Chile (2026). El objetivo es centralizar múltiples fuentes de datos dispersas (centros de acopio, albergues, zonas de peligro) en una única plataforma web minimalista, extremadamente rápida y capaz de funcionar sin internet.

## Stack Tecnológico (Restricciones Críticas)
Para garantizar el rendimiento en zonas con conectividad 2G/3G o saturación de red, se han tomado las siguientes decisiones técnicas:

- **Frontend:** Vite + Vanilla JavaScript (sin frameworks pesados como React/Vue/Nuxt).
- **Estilos:** Tailwind CSS (configurado para purgar estilos no usados).
- **Mapas:** Leaflet.js (alternativa ligera a Google Maps).
- **Backend:** PocketBase (Go-based) para gestión de API y DB rápida.
- **Despliegue:** DigitalOcean Droplet / App Platform.

## Requerimientos Funcionales Prioritarios
1. **Offline-First:** Implementación obligatoria de PWA (Progressive Web App) con Service Workers. El usuario debe poder ver el mapa y los puntos guardados en caché si pierde la conexión.
2. **Sincronización de Datos:** Capacidad de consumir JSON desde la API de PocketBase y persistir en `localStorage` o `IndexedDB`.
3. **Eficiencia Extrema:** Carga inicial mínima (< 500kb). Evitar librerías externas innecesarias.
4. **Interoperabilidad:** Los datos provienen inicialmente de Google Sheets/AppSheet, sincronizados hacia la base de datos central.

## Instrucciones para la IA (Copilot/Chat)
Al generar código o sugerencias para este proyecto, debes seguir estas reglas:
1. **Simplicidad sobre abstracción:** Prefiere código nativo de JS y CSS sobre capas adicionales.
2. **Mobile-First:** Todos los componentes (popups del mapa, botones, menús) deben ser táctiles y amigables para pulgares grandes.
3. **Optimización de Recursos:** Usa carga diferida (lazy loading) para componentes no esenciales.
4. **Contexto de Emergencia:** El diseño debe ser de alto contraste y fácil lectura bajo condiciones de estrés o luz solar intensa.

## Estructura de Datos (Propuesta)
Cada punto en el mapa debe contener:
- `id`, `lat`, `lng`, `tipo` (albergue, acopio, agua, riesgo), `descripcion`, `contacto`, `last_update`.