# Guía de Desarrollo - Donde Ayudo CL

## Requisitos Previos

- Node.js v16 o superior
- npm v8 o superior

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/P1ngu-Dev/Donde-Ayudo-CL.git
cd Donde-Ayudo-CL
```

2. Instalar dependencias:
```bash
npm install
```

## Comandos de Desarrollo

### Levantar el servidor de desarrollo

```bash
npm run dev
```

Este comando iniciará el servidor de desarrollo de Vite. Por defecto se ejecuta en `http://localhost:5173`.

La aplicación se recargará automáticamente cuando hagas cambios en el código.

### Construir para producción

```bash
npm run build
```

Genera los archivos optimizados para producción en la carpeta `dist/`.

### Vista previa de la build de producción

```bash
npm run preview
```

Ejecuta un servidor local para previsualizar la build de producción antes de desplegarla.

## Estructura del Proyecto

```
Donde-Ayudo-CL/
├── src/
│   ├── data/           # Datos mock y configuración
│   ├── services/       # Lógica de negocio (DataRepository)
│   ├── styles/         # Estilos CSS (Tailwind)
│   └── main.js         # Punto de entrada
├── index.html          # HTML principal
├── package.json        # Dependencias y scripts
└── tailwind.config.js  # Configuración de Tailwind CSS
```

## Tecnologías Utilizadas

- **Vite**: Build tool rápido y ligero
- **Tailwind CSS**: Framework de estilos utility-first
- **Leaflet.js**: Biblioteca de mapas interactivos
- **Vanilla JavaScript**: Sin frameworks pesados para mantener el bundle pequeño

## Notas de Desarrollo

- El proyecto está configurado como **PWA** con estrategia offline-first.
- El límite de peso del bundle es **< 500KB** (sin contar el mapa).
- Diseñado para ser **Mobile-First** y funcionar en zonas con conectividad limitada.

## Troubleshooting

### El servidor no inicia

Verifica que no tengas otro proceso usando el puerto 5173:

```bash
lsof -i :5173
kill -9 <PID>
```

### Error de dependencias

Elimina `node_modules` y reinstala:

```bash
rm -rf node_modules package-lock.json
npm install
```
