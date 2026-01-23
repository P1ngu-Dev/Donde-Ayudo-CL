# Contexto del Proyecto: Mapa Solidario Chile 2026

## Objetivo
Crear una Web App (PWA) de alto rendimiento y bajo consumo de datos para visualizar puntos de ayuda (acopios, albergues) en el contexto de los incendios en Chile. 

## Stack Tecnológico
- **Frontend:** Vite + Vanilla JavaScript + Tailwind CSS.
- **Mapa:** Leaflet.js (priorizar ligereza).
- **Backend:** PocketBase (Go-based) para API rápida y gestión de datos.
- **Estrategia Offline:** PWA con Service Workers para persistencia de datos sin internet.

## Reglas de Código
1. **Simplicidad:** No uses frameworks pesados (React/Vue/Nuxt). Prefiere manipulación directa del DOM o Alpine.js si es necesario.
2. **Eficiencia:** El archivo final debe pesar menos de 500kb (sin contar el mapa).
3. **Offline-First:** Implementar lógica para guardar los resultados de la API en `localStorage` o `IndexedDB` apenas se reciban.
4. **Mobile-First:** La interfaz debe ser usada principalmente en terreno con pulgares y pantallas pequeñas.
5. **Leaflet:** Implementar marcadores personalizados por categoría y popups informativos rápidos.

## Tareas inmediatas
- Configurar el boilerplate de Vite con Leaflet.
- Crear una función de fetch que guarde el JSON en caché local.
- Configurar el manifiesto de PWA.
