# 🌊 Deployment en DigitalOcean App Platform

## 🚀 Setup Rápido (5 minutos)

### Opción 1: Detección Automática (Recomendado)

1. **Ir a DigitalOcean App Platform**: https://cloud.digitalocean.com/apps

2. **Create App → GitHub**
   - Conectar tu repositorio: `P1ngu-Dev/Donde-Ayudo-CL`
   - Branch: `main`

3. **DigitalOcean detectará automáticamente**:
   - Frontend (Node.js/Vite)
   - Backend (Go)

4. **Configurar Backend**:
   - Name: `backend`
   - Source Directory: `backend/server`
   - Build Command: `go build -o donde-ayudo-server`
   - Run Command: `./donde-ayudo-server`
   - HTTP Port: `8091`
   - Environment Variables:
     ```
     PORT=8091
     JWT_SECRET=<genera con: openssl rand -base64 64>
     ENVIRONMENT=production
     DB_PATH=/app/data/data.db
     ```

5. **Configurar Frontend**:
   - Name: `frontend`
   - Type: **Static Site**
   - Source Directory: `/` (raíz)
   - Build Command: `npm install && npm run build`
   - Output Directory: `dist`
   - Environment Variables:
     ```
     VITE_API_URL=${backend.PUBLIC_URL}
     ```
   - Catchall Document: `index.html` (para SPA)

6. **Review & Deploy**
   - Plan: Basic ($5/mes por componente)
   - Region: **New York** (más cercano a Chile) o San Francisco
   - Click **Create Resources**

### Opción 2: Usando app.yaml (Infraestructura como Código)

```bash
# 1. El archivo .do/app.yaml ya está creado
# 2. En DigitalOcean dashboard:
#    Create App → GitHub → Import from repo
# 3. DO detectará automáticamente el app.yaml
# 4. Solo configurar JWT_SECRET en dashboard
# 5. Deploy
```

### Opción 3: Dockerfile (Todo en uno)

Si prefieres usar el Dockerfile:

1. En DigitalOcean, selecciona **Dockerfile**
2. Dockerfile Path: `Dockerfile` (raíz)
3. HTTP Port: `80`
4. Variables de entorno (mismo JWT_SECRET, etc.)

**Ventaja**: Un solo componente ($5/mes total)
**Desventaja**: Menos escalable que separar frontend/backend

## ⚙️ Configuración de Variables de Entorno

### Generar JWT_SECRET Seguro

```bash
# En tu terminal local
openssl rand -base64 64
```

### En DigitalOcean Dashboard

1. Ve a tu App → **Settings**
2. **App-Level Environment Variables** → Add Variable
3. Agregar:
   - **JWT_SECRET**: (pegar valor generado) - Tipo: **Secret** ✅ Encrypt
   - **PORT**: `8091`
   - **ENVIRONMENT**: `production`
   - **DB_PATH**: `/app/data/data.db`

## 💾 Base de Datos (IMPORTANTE)

### ⚠️ Problema: SQLite en App Platform

App Platform es **stateless** por defecto. Cada deploy recrea el contenedor, perdiendo la base de datos SQLite.

### Soluciones:

#### Opción A: Volumen Persistente (SQLite)

1. En el dashboard, ir a **Components** → Backend
2. **Resources** → Add Volume
3. Configurar:
   - Mount Path: `/app/data`
   - Size: 1 GB
   - Name: `db-volume`

**Costo**: +$1/mes por 1GB

#### Opción B: Managed Database (PostgreSQL) - Recomendado

1. Crear **Managed PostgreSQL** en DO
2. Migrar de SQLite a PostgreSQL
3. Actualizar código Go para usar PostgreSQL

**Costo**: $15/mes (Basic plan)
**Ventajas**: Backups automáticos, escalabilidad, alta disponibilidad

#### Opción C: Spaces (S3-compatible) para backups

```bash
# Script de backup automático a DO Spaces
# Ver docs/DEPLOYMENT.md sección "Backup"
```

### Migración Inicial de Datos

```bash
# 1. Hacer backup local
sqlite3 backend/pb_data/data.db ".backup backup.db"

# 2. Subir a DO Spaces
doctl spaces upload backup.db donde-ayudo-backups/

# 3. En producción, descargar y restaurar
# (O usar volumen y copiar directamente)
```

## 🔐 Dominios y SSL

### Dominio Custom

1. **Settings** → **Domains**
2. Add Domain → `dondeayudo.cl`
3. Seguir instrucciones DNS:
   ```
   CNAME www dondeayudo-cl.ondigitalocean.app
   A     @   <IP proporcionada>
   ```

### SSL Automático

- DigitalOcean provisiona **Let's Encrypt** automáticamente
- Se renueva automáticamente cada 90 días
- HTTPS forzado por defecto

## 📊 Monitoreo

### Logs en Tiempo Real

```bash
# Instalar doctl CLI
brew install doctl  # Mac
# O snap install doctl  # Linux

# Autenticarse
doctl auth init

# Ver logs
doctl apps logs <APP-ID> --follow
doctl apps logs <APP-ID> --component backend --follow
```

### Métricas en Dashboard

- CPU Usage
- Memory Usage
- Request Count
- Response Time
- Error Rate

## 🔄 CI/CD Automático

App Platform hace deploy automático en cada push a `main`.

### Desactivar Auto-Deploy (opcional)

**Settings** → GitHub → Uncheck "Autodeploy"

### Deploy Manual

```bash
# Usando doctl CLI
doctl apps create-deployment <APP-ID>

# O en dashboard: click "Deploy"
```

## 💰 Costos Estimados

### Setup Separado (Frontend + Backend)
- Frontend (Static Site): $5/mes
- Backend (Basic): $5/mes
- **Total**: $10/mes

### Setup con Dockerfile (Todo en uno)
- App (Basic): $5/mes
- **Total**: $5/mes

### Con Base de Datos Persistente
- App: $5-10/mes
- Volumen (1GB): +$1/mes
- O PostgreSQL Managed: +$15/mes

### Extras Opcionales
- CDN: Incluido gratis
- Spaces (backups): $5/mes (250GB)
- Alerta/Monitoring: Incluido gratis

## ✅ Checklist de Deploy

### Pre-Deploy
- [x] Código pusheado a GitHub
- [ ] JWT_SECRET generado (openssl rand -base64 64)
- [ ] Decidir: ¿Volumen para SQLite o migrar a PostgreSQL?
- [ ] Configurar dominio (opcional)

### Durante Deploy
- [ ] App creada en DO App Platform
- [ ] Variables de entorno configuradas
- [ ] Backend: HTTP Port = 8091
- [ ] Frontend: Output Directory = dist
- [ ] Frontend: Catchall Document = index.html

### Post-Deploy
- [ ] Verificar health check: https://backend-url/
- [ ] Crear usuarios admin en base de datos
- [ ] Probar login: https://frontend-url/admin.html
- [ ] Test CRUD de puntos
- [ ] Configurar backups
- [ ] Test PWA en móvil

## 🧪 Testing

### Health Check Backend
```bash
curl https://tu-backend.ondigitalocean.app/
# Debe retornar: {"message":"Donde Ayudo CL API v1.0","status":"running"}
```

### Test Login
```bash
curl -X POST https://tu-backend.ondigitalocean.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@donde-ayudo.cl","password":"admin123"}'
```

### Test Frontend
1. Abrir: https://tu-frontend.ondigitalocean.app/
2. Ver mapa con puntos
3. Test offline (DevTools → Network → Offline)
4. Instalar PWA (mobile)

## 🔧 Troubleshooting

### Error: "Build Failed"

**Frontend:**
```bash
# Ver logs en DO dashboard
# Común: npm ci falla → verificar package-lock.json en repo
```

**Backend:**
```bash
# Error: go.mod no encontrado
# Solución: Verificar Source Directory = backend/server
```

### Error: "Application Error" en runtime

```bash
# Ver logs:
doctl apps logs <APP-ID> --component backend

# Común: JWT_SECRET no configurado
# Común: DB_PATH incorrecto
```

### Error: CORS

```bash
# Agregar dominio de DO a backend/server/middleware/cors.go
# Ya está: "https://*.ondigitalocean.app"
```

### Base de datos vacía después de deploy

- SQLite sin volumen = se borra cada deploy
- Solución: Configurar volumen persistente (ver arriba)
- O migrar a PostgreSQL

## 📚 Recursos

- [DO App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [doctl CLI](https://docs.digitalocean.com/reference/doctl/)
- [Pricing Calculator](https://www.digitalocean.com/pricing/app-platform)

---

**Tiempo estimado total**: 10-15 minutos desde crear cuenta hasta app funcionando 🚀
