#!/bin/sh
# Script para inicializar la base de datos con usuarios de prueba

DB_PATH="${DB_PATH:-/data/data.db}"

echo "📦 Inicializando base de datos en: $DB_PATH"

# Verificar si la base de datos ya existe
if [ -f "$DB_PATH" ]; then
    echo "✅ Base de datos ya existe"
    exit 0
fi

echo "🔨 Creando base de datos nueva..."

# Crear directorio si no existe
mkdir -p "$(dirname "$DB_PATH")"

# Crear base de datos y tablas
sqlite3 "$DB_PATH" << 'EOF'
-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    rol TEXT NOT NULL CHECK(rol IN ('superadmin', 'admin', 'verificador', 'usuario')),
    activo INTEGER DEFAULT 1,
    verified INTEGER DEFAULT 1,
    created TEXT DEFAULT CURRENT_TIMESTAMP,
    updated TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de puntos
CREATE TABLE IF NOT EXISTS puntos (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL,
    direccion TEXT,
    descripcion TEXT,
    latitud REAL NOT NULL,
    longitud REAL NOT NULL,
    telefono TEXT,
    email TEXT,
    horario TEXT,
    capacidad INTEGER,
    estado TEXT DEFAULT 'activo' CHECK(estado IN ('activo', 'inactivo', 'pendiente', 'cerrado')),
    categoria TEXT CHECK(categoria IN ('acopio', 'albergue', 'hidratacion', 'sos')),
    created TEXT DEFAULT CURRENT_TIMESTAMP,
    updated TEXT DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_puntos_tipo ON puntos(tipo);
CREATE INDEX IF NOT EXISTS idx_puntos_estado ON puntos(estado);
CREATE INDEX IF NOT EXISTS idx_puntos_categoria ON puntos(categoria);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Usuario superadmin por defecto (password: admin123)
INSERT INTO users (id, email, password, name, rol, activo, verified) 
VALUES (
    'admin-' || hex(randomblob(16)),
    'admin@dondeayudo.cl',
    '$2a$10$rT8YvV9w7JqL3H8KZ9xVh.xE5J5KZ8YvV9w7JqL3H8KZ9xVh.xE5J',
    'Administrador',
    'superadmin',
    1,
    1
);


EOF

echo "✅ Base de datos inicializada correctamente"
echo "🔑 Usuario: admin@donde-ayudo.cl / Contraseña: admin123"
