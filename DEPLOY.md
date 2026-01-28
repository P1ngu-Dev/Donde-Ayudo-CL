# 🚀 Donde Ayudo CL - Deployment Guide

## Stack Tecnológico

- **Frontend**: Vite + Tailwind CSS + Leaflet (PWA)
- **Backend**: Go 1.23 + SQLite + JWT Auth
- **Deployment**: Docker / Railway / Render / VPS

## 🏃 Quick Start

### Desarrollo Local

```bash
# 1. Clonar repositorio
git clone https://github.com/P1ngu-Dev/Donde-Ayudo-CL.git
cd Donde-Ayudo-CL

# 2. Instalar dependencias del frontend
npm install

# 3. Iniciar backend (Terminal 1)
cd backend/server
go mod download
go run .

# 4. Iniciar frontend (Terminal 2 - desde raíz)
npm run dev

# Frontend: http://localhost:5173
# Backend: http://localhost:8091
# Admin: http://localhost:5173/admin.html
```

### Con Docker Compose

```bash
# Iniciar todo (backend + frontend)
docker-compose up

# Frontend: http://localhost:5173
# Backend: http://localhost:8091
```

## 🚀 Deployment a Producción

### Opción 1: Railway (Recomendado - Fácil)

1. **Fork el repositorio en GitHub**

2. **Crear cuenta en Railway**: https://railway.app

3. **Nuevo proyecto desde GitHub**:
   - Conectar con tu repositorio
   - Railway detectará automáticamente el Dockerfile

4. **Configurar variables de entorno**:
   ```
   JWT_SECRET=<genera-con: openssl rand -base64 64>
   PORT=8091
   ENVIRONMENT=production
   DB_PATH=/app/data/data.db
   ```

5. **Deploy automático**: Cada push a `main` despliega automáticamente

6. **Configurar dominio** (opcional):
   - Railway settings → Generate Domain
   - O conectar dominio custom

**Costo**: ~$5/mes con plan hobby

### Opción 2: Render

1. **Crear cuenta en Render**: https://render.com

2. **Nuevo Web Service**:
   - Conectar repositorio de GitHub
   - Render detecta Dockerfile automáticamente

3. **Configurar**:
   - Name: `donde-ayudo-cl`
   - Region: Oregon (más cercano)
   - Instance Type: Free o Starter ($7/mes)
   - Variables de entorno (igual que Railway)

4. **Deploy**: Automático en cada push

**Costo**: Free tier disponible (con limitaciones)

### Opción 3: VPS Propio (Ubuntu/Debian)

Instrucciones completas en [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#4-servidor-vps-ubuntudebian)

```bash
# Quick setup
sudo apt update && sudo apt install -y docker.io docker-compose git
git clone https://github.com/P1ngu-Dev/Donde-Ayudo-CL.git
cd Donde-Ayudo-CL

# Configurar variables de entorno
cp backend/server/.env.example backend/server/.env
nano backend/server/.env  # Editar JWT_SECRET

# Build y ejecutar
docker build -t donde-ayudo-cl .
docker run -d -p 80:80 \
  --env-file backend/server/.env \
  -v $(pwd)/data:/app/data \
  donde-ayudo-cl
```

## 🔐 Variables de Entorno

| Variable | Descripción | Ejemplo | Requerida |
|----------|-------------|---------|-----------|
| `JWT_SECRET` | Secreto para firmar tokens JWT | `openssl rand -base64 64` | ✅ Sí |
| `PORT` | Puerto del backend | `8091` | No (default: 8090) |
| `DB_PATH` | Ruta a base de datos SQLite | `../pb_data/data.db` | No |
| `ENVIRONMENT` | Entorno de ejecución | `production` | No (default: development) |
| `VITE_API_URL` | URL del backend (frontend) | `https://api.tu-dominio.com` | Solo si backend en dominio diferente |

### Generar JWT_SECRET seguro:

```bash
# Linux/Mac
openssl rand -base64 64

# Node.js
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# Online: https://generate-secret.vercel.app/64
```

## 📊 Base de Datos

### Inicialización

La base de datos se crea automáticamente al iniciar el backend. Para producción:

```bash
# Crear usuarios administrativos
cd backend/server
sqlite3 ../pb_data/data.db < ../create_test_users.sql
```

### Backup

```bash
# Manual
sqlite3 backend/pb_data/data.db ".backup backup_$(date +%Y%m%d).db"

# Automático (cron diario)
0 3 * * * sqlite3 /app/data/data.db ".backup /backups/data_$(date +\%Y\%m\%d).db"
```

## 🎯 Checklist Pre-Deploy

### Backend
- [ ] `JWT_SECRET` generado y configurado (aleatorio, mínimo 32 caracteres)
- [ ] Variables de entorno configuradas
- [ ] CORS permite dominio de producción
- [ ] Base de datos con usuarios admin creados
- [ ] Health check funcionando: `curl https://tu-api.com/`

### Frontend
- [ ] `npm run build` sin errores
- [ ] Service Worker generado (`dist/sw.js`)
- [ ] Manifest PWA válido (`dist/manifest.webmanifest`)
- [ ] Iconos PWA (192x192, 512x512)
- [ ] `VITE_API_URL` apunta al backend correcto

### Infraestructura
- [ ] SSL/HTTPS configurado
- [ ] Dominio configurado (DNS)
- [ ] Firewall (puerto 80, 443)
- [ ] Backup automático configurado
- [ ] Logs y monitoreo configurados

## 🧪 Testing

### Local
```bash
# Build de prueba
npm run deploy:build

# Preview de producción
npm run preview

# Testing con Docker
npm run docker:build
npm run docker:run
```

### Producción
```bash
# Health check backend
curl https://tu-api.com/

# Test login
curl -X POST https://tu-api.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@donde-ayudo.cl","password":"admin123"}'

# Lighthouse (Chrome DevTools)
# Performance > 90, PWA installable
```

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar Vite dev server
npm run backend:dev      # Iniciar backend Go (hot reload con air)
npm run docker:dev       # Docker Compose (backend + frontend)

# Build
npm run build            # Build frontend
npm run backend:build    # Compilar backend Go
npm run deploy:build     # Build completo (frontend + backend)

# Docker
npm run docker:build     # Build imagen Docker
npm run docker:run       # Ejecutar contenedor
```

## 🔧 Troubleshooting

### Error: CORS blocked
- Verificar que el dominio esté en `backend/server/middleware/cors.go`
- Agregar dominio a `AllowedOrigins`

### Error: JWT invalid
- Verificar que `JWT_SECRET` sea el mismo en backend
- Generar nuevo token: re-login

### Error: Database locked
- SQLite solo permite 1 writer
- Usar conexiones con timeout: `?_timeout=5000`
- Considerar migrar a PostgreSQL si hay >100 usuarios concurrentes

### Build falla en Railway/Render
- Verificar `Dockerfile` está en raíz
- Verificar variables de entorno configuradas
- Ver logs: Railway dashboard o `render logs`

## 📚 Documentación Adicional

- [Deployment detallado](docs/DEPLOYMENT.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [API Backend](backend/server/README.md)
- [Roles y Permisos](docs/ROLES_Y_PERMISOS.md)

## 🆘 Soporte

- Issues: https://github.com/P1ngu-Dev/Donde-Ayudo-CL/issues
- Documentación: `/docs`
- Discord: [próximamente]

---

**Última actualización**: Enero 2026
**Versión**: 1.0.0
