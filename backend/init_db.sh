#!/bin/sh
# Script para inicializar la base de datos PostgreSQL

DATABASE_URL="${DATABASE_URL}"

if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL no está configurada"
    exit 1
fi

echo "📦 Inicializando base de datos PostgreSQL..."

# Crear tablas y datos usando psql
psql "$DATABASE_URL" << 'EOF'
-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    rol TEXT NOT NULL CHECK(rol IN ('superadmin', 'admin', 'verificador', 'usuario')),
    activo BOOLEAN DEFAULT true,
    verified BOOLEAN DEFAULT true,
    created TIMESTAMP DEFAULT NOW(),
    updated TIMESTAMP DEFAULT NOW()
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
    created TIMESTAMP DEFAULT NOW(),
    updated TIMESTAMP DEFAULT NOW(),
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
    'admin-' || encode(gen_random_bytes(16), 'hex'),
    'admin@dondeayudo.cl',
    '\$2a\$10\$rT8YvV9w7JqL3H8KZ9xVh.xE5J5KZ8YvV9w7JqL3H8KZ9xVh.xE5J',
    'Administrador',
    'superadmin',
    true,
    true
)
ON CONFLICT (email) DO NOTHING;

EOF

echo "✅ Base de datos inicializada correctamente"
echo "🔑 Usuario: admin@donde-ayudo.cl / Contraseña: admin123"
