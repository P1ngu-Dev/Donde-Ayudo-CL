# Backend Go - Donde Ayudo CL

Backend RESTful API desarrollado en Go con SQLite para el proyecto Donde Ayudo CL.

## 🚀 Características

- **Go 1.25.5**: Alto rendimiento y concurrencia nativa
- **SQLite**: Base de datos ligera y embebida (120+ puntos)
- **JWT Authentication**: Autenticación basada en tokens
- **Roles y Permisos**: Sistema de roles (superadmin, admin, verificador)
- **API RESTful**: Endpoints públicos y administrativos
- **CORS**: Configurado para desarrollo y producción

## 📁 Estructura

```
backend/server/
├── cmd/
│   └── hash_password.go      # Utilidad para generar hashes bcrypt
├── config/
│   └── config.go             # Configuración JWT y servidor
├── database/
│   ├── db.go                 # Conexión SQLite
│   ├── puntos.go             # CRUD de puntos
│   └── users.go              # CRUD de usuarios
├── handlers/
│   ├── auth.go               # Login, logout, me
│   ├── puntos.go             # API pública de puntos
│   └── admin.go              # API administrativa
├── middleware/
│   ├── auth.go               # Verificación JWT
│   ├── roles.go              # Control de acceso por rol
│   └── cors.go               # CORS middleware
├── models/
│   ├── punto.go              # Struct Punto y requests
│   └── user.go               # Struct User y requests
└── main.go                   # Entry point del servidor
```

## 🔧 Instalación

### Requisitos

- Go 1.25.5 o superior
- SQLite3 (incluido)

### Dependencias

```bash
cd backend/server
go mod download
```

Dependencias principales:
- `github.com/go-chi/chi/v5` - Router HTTP
- `github.com/go-chi/cors` - CORS middleware
- `modernc.org/sqlite` - Driver SQLite puro Go
- `github.com/golang-jwt/jwt/v5` - JWT
- `golang.org/x/crypto/bcrypt` - Hashing de contraseñas

## 🏃 Ejecución

### Desarrollo

```bash
cd backend/server
go build -o donde-ayudo-server
PORT=8091 ./donde-ayudo-server
```

El servidor iniciará en `http://localhost:8091`

### Producción

```bash
# Compilar
go build -o donde-ayudo-server -ldflags="-s -w"

# Configurar variables de entorno
export PORT=8091
export JWT_SECRET="tu-secreto-muy-seguro-aqui"
export JWT_EXPIRY=24h

# Ejecutar
./donde-ayudo-server
```

## 📡 API Endpoints

### Públicos (sin autenticación)

#### `GET /api/puntos`
Lista puntos publicados (públicos)

**Query params:**
- `categoria` - Filtrar por categoría (acopio, informacion, etc.)
- `subtipo` - Filtrar por subtipo
- `ciudad` - Filtrar por ciudad
- `page` - Número de página (default: 1)
- `limit` - Resultados por página (default: 50, max: 100)

**Response:**
```json
{
  "data": [...],
  "total": 120,
  "page": 1,
  "limit": 50
}
```

#### `GET /api/puntos/{id}`
Obtiene un punto específico por ID

### Autenticación

#### `POST /api/auth/login`
Login con email y contraseña

**Request:**
```json
{
  "email": "admin@donde-ayudo.cl",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "usr_admin",
    "email": "admin@donde-ayudo.cl",
    "name": "Admin",
    "rol": "admin",
    "organizacion": "...",
    "activo": true,
    "verified": true
  }
}
```

#### `GET /api/auth/me`
Obtiene información del usuario autenticado

**Headers:** `Authorization: Bearer {token}`

#### `POST /api/auth/logout`
Logout (placeholder, el token se elimina en cliente)

### Administrativos (requieren autenticación)

Todos los endpoints requieren header: `Authorization: Bearer {token}`

#### `GET /api/admin/puntos`
Lista todos los puntos (incluidos no publicados)

**Roles permitidos:** admin, superadmin, verificador

**Query params:** Igual que API pública + `estado`

#### `GET /api/admin/puntos/{id}`
Obtiene un punto específico (sin filtro de estado)

#### `POST /api/admin/puntos`
Crea un nuevo punto

**Roles permitidos:** admin, superadmin

**Request body:** Ver modelo `PuntoCreateRequest`

#### `PATCH /api/admin/puntos/{id}`
Actualiza un punto

**Roles permitidos:** admin, superadmin

**Request body:** Ver modelo `PuntoUpdateRequest`

#### `PATCH /api/admin/puntos/{id}/estado`
Cambia el estado de un punto

**Roles permitidos:** admin, superadmin, verificador

**Request:**
```json
{
  "estado": "publicado"
}
```

#### `DELETE /api/admin/puntos/{id}`
Elimina un punto (soft delete: estado = 'oculto')

**Roles permitidos:** admin, superadmin

#### `GET /api/admin/users`
Lista usuarios (solo superadmin)

#### `POST /api/admin/users`
Crea un nuevo usuario (solo superadmin)

## 👥 Sistema de Roles

### Roles disponibles:

1. **superadmin** - Acceso total
   - Gestionar usuarios
   - Crear/editar/eliminar puntos
   - Cambiar estados
   - Ver estadísticas completas

2. **admin** - Administrador de contenido
   - Crear/editar/eliminar puntos
   - Cambiar estados
   - Ver todos los puntos

3. **verificador** - Verificador de campo
   - Ver todos los puntos
   - Cambiar estados (verificar/rechazar)

## 🔑 Usuarios de Prueba

Todos con contraseña: `admin123`

```
Email: super@donde-ayudo.cl
Rol: superadmin
Org: Donde Ayudo CL

Email: admin@donde-ayudo.cl
Rol: admin
Org: Municipalidad Test

Email: verificador@donde-ayudo.cl
Rol: verificador
Org: Cruz Roja
```

## 🛠️ Utilidades

### Generar hash de contraseña

```bash
cd backend/server
go run cmd/hash_password.go "tu-contraseña"
```

### Inspeccionar base de datos

```bash
cd backend
sqlite3 pb_data/data.db "SELECT id, email, name, rol FROM users;"
```

## 🧪 Testing

Script de integración disponible:

```bash
cd /home/pingu/Proyectos/Donde-Ayudo-CL
./test-integration.sh
```

Prueba:
- Conectividad backend
- API pública
- Login y autenticación
- Endpoints administrativos
- Verificación de roles

## 📊 Base de Datos

### Tabla: puntos
Campos principales:
- `id`, `nombre`, `latitud`, `longitud`, `direccion`, `ciudad`
- `categoria`, `subtipo`, `estado`
- `contacto_principal`, `contacto_nombre`
- `horario`, `necesidades_raw`, `necesidades_tags`
- `entidad_verificadora`, `fecha_verificacion`
- Campos específicos de solicitudes de ayuda
- `created`, `updated`

### Tabla: users
Campos:
- `id`, `email`, `password` (bcrypt), `name`
- `rol`, `organizacion`, `activo`, `verified`
- `tokenKey` (para invalidación de tokens futura)
- `avatar`, `emailVisibility`
- `created`, `updated`

## 🔐 Seguridad

- Contraseñas hasheadas con bcrypt (cost 10)
- JWT con expiración de 24h
- Middleware de autenticación en todas las rutas admin
- Control de roles granular
- CORS configurado para frontend

## 📝 Variables de Entorno

```bash
PORT=8091                    # Puerto del servidor (default: 8090)
JWT_SECRET=secret            # Secreto para firmar JWT (cambiar en producción)
JWT_EXPIRY=24h              # Tiempo de expiración del token
DB_PATH=../pb_data/data.db  # Ruta a la base de datos SQLite
```

## 🚧 Pendientes

Funcionalidades marcadas para implementación futura:
- `POST /api/puntos` público (reportes SOS sin auth)
- `POST /api/solicitudes` (solicitudes externas)
- `PUT /api/admin/users/{id}` (actualizar usuarios)
- Paginación en lista de usuarios
- Búsqueda de texto en puntos
- Estadísticas agregadas endpoint

## 📄 Licencia

ISC - Ver LICENSE.md en el repositorio principal
