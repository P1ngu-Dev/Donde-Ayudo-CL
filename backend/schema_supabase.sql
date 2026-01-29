-- ============================================================================
-- SCHEMA DEFINITIVO PARA SUPABASE - Donde Ayudo CL
-- ============================================================================
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- IMPORTANTE: Ejecutar TODO este script para crear las tablas correctamente
-- ============================================================================

-- Eliminar tablas existentes si hay conflictos (CUIDADO: borra datos)
-- DROP TABLE IF EXISTS puntos CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- TABLA: users
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    -- Identificación
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    
    -- Información personal
    name TEXT NOT NULL,
    rol TEXT NOT NULL CHECK(rol IN ('superadmin', 'admin', 'verificador', 'usuario')),
    organizacion TEXT,  -- NULLABLE
    avatar TEXT,  -- NULLABLE
    
    -- Configuración y estado
    emailVisibility BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT TRUE,
    activo BOOLEAN DEFAULT TRUE,
    tokenKey TEXT,  -- NULLABLE
    
    -- Timestamps
    created TIMESTAMP DEFAULT NOW(),
    updated TIMESTAMP DEFAULT NOW()
);

-- Índices para users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_rol ON users(rol);
CREATE INDEX IF NOT EXISTS idx_users_activo ON users(activo);

-- ============================================================================
-- TABLA: puntos
-- ============================================================================
CREATE TABLE IF NOT EXISTS puntos (
    -- Identificación
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    
    -- Ubicación
    latitud REAL NOT NULL,
    longitud REAL NOT NULL,
    direccion TEXT,  -- NULLABLE
    ciudad TEXT,  -- NULLABLE
    
    -- Clasificación
    categoria TEXT,  -- NULLABLE: acopio, albergue, hidratacion, sos
    subtipo TEXT,  -- NULLABLE
    
    -- Contacto
    contacto_principal TEXT,  -- NULLABLE
    contacto_nombre TEXT,  -- NULLABLE
    horario TEXT,  -- NULLABLE
    
    -- Estado y verificación
    estado TEXT DEFAULT 'activo' CHECK(estado IN ('activo', 'inactivo', 'pendiente', 'cerrado')),
    entidad_verificadora TEXT,  -- NULLABLE
    fecha_verificacion TIMESTAMP,  -- NULLABLE
    
    -- Información adicional
    notas_internas TEXT,  -- NULLABLE
    capacidad_estado TEXT,  -- NULLABLE
    
    -- Necesidades
    necesidades_raw TEXT,  -- NULLABLE
    necesidades_tags JSONB,  -- NULLABLE - Array de strings
    
    -- Detalles de zona afectada
    nombre_zona TEXT,  -- NULLABLE
    habitado_actualmente BOOLEAN DEFAULT FALSE,
    cantidad_ninos INTEGER DEFAULT 0,
    cantidad_adultos INTEGER DEFAULT 0,
    cantidad_ancianos INTEGER DEFAULT 0,
    animales_detalle TEXT,  -- NULLABLE
    
    -- Riesgos y logística
    riesgo_asbesto BOOLEAN DEFAULT FALSE,
    logistica_llegada TEXT,  -- NULLABLE
    requiere_voluntarios BOOLEAN DEFAULT FALSE,
    urgencia TEXT,  -- NULLABLE
    
    -- Evidencia
    evidencia_fotos JSONB,  -- NULLABLE - Array de URLs
    
    -- Timestamps
    created TIMESTAMP DEFAULT NOW(),
    updated TIMESTAMP DEFAULT NOW(),
    created_by TEXT  -- NULLABLE - Referencia al user.id que lo creó
);

-- Índices para puntos
CREATE INDEX IF NOT EXISTS idx_puntos_tipo ON puntos(categoria);
CREATE INDEX IF NOT EXISTS idx_puntos_estado ON puntos(estado);
CREATE INDEX IF NOT EXISTS idx_puntos_categoria ON puntos(categoria);
CREATE INDEX IF NOT EXISTS idx_puntos_ciudad ON puntos(ciudad);
CREATE INDEX IF NOT EXISTS idx_puntos_subtipo ON puntos(subtipo);
CREATE INDEX IF NOT EXISTS idx_puntos_created ON puntos(created);

-- ============================================================================
-- DATOS INICIALES
-- ============================================================================

-- Usuario superadmin por defecto
-- Email: admin@dondeayudo.cl
-- Password: admin123
INSERT INTO users (id, email, password, name, rol, activo, verified, emailVisibility) 
VALUES (
    'admin-' || encode(gen_random_bytes(16), 'hex'),
    'admin@dondeayudo.cl',
    '$2a$10$rT8YvV9w7JqL3H8KZ9xVh.xE5J5KZ8YvV9w7JqL3H8KZ9xVh.xE5J',
    'Administrador',
    'superadmin',
    true,
    true,
    false
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

-- Confirmar estructura
SELECT 
    'users' as tabla,
    COUNT(*) as total_registros
FROM users
UNION ALL
SELECT 
    'puntos' as tabla,
    COUNT(*) as total_registros
FROM puntos;

-- Mostrar columnas de users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Mostrar columnas de puntos
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'puntos'
ORDER BY ordinal_position;
