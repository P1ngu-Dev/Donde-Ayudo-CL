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
    must_change_password BOOLEAN DEFAULT FALSE,  -- Para contraseñas temporales
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
    categorias_ayuda JSONB,  -- NULLABLE - Array de categorías ["salud", "agua", "herramientas"]
    
    -- Urgencia
    nivel_urgencia TEXT,  -- NULLABLE: critico, alto, medio, bajo
    
    -- Contacto
    contacto_principal TEXT,  -- NULLABLE
    contacto_nombre TEXT,  -- NULLABLE
    horario TEXT,  -- NULLABLE
    
    -- Estado y verificación
    estado TEXT DEFAULT 'activo' CHECK(estado IN ('activo', 'inactivo', 'pendiente', 'cerrado', 'eliminado')),
    entidad_verificadora TEXT,  -- NULLABLE
    fecha_verificacion TIMESTAMP,  -- NULLABLE
    
    -- Información adicional (PRIVADO)
    notas_internas TEXT,  -- NULLABLE - Solo admins
    capacidad_estado TEXT,  -- NULLABLE
    
    -- Necesidades
    necesidades_raw TEXT,  -- NULLABLE
    necesidades_tags JSONB,  -- NULLABLE - Estructura compleja con categorías de necesidades
    
    -- Detalles de zona afectada
    nombre_zona TEXT,  -- NULLABLE
    habitado_actualmente BOOLEAN DEFAULT FALSE,
    cantidad_ninos INTEGER DEFAULT 0,
    cantidad_adolescentes INTEGER DEFAULT 0,  -- NUEVO
    cantidad_adultos INTEGER DEFAULT 0,
    cantidad_ancianos INTEGER DEFAULT 0,
    animales_detalle TEXT,  -- NULLABLE
    
    -- Riesgos y logística
    riesgo_asbesto TEXT,  -- NULLABLE: "si", "no", "no_se" (antes era BOOLEAN)
    foto_asbesto TEXT,  -- NULLABLE - URL de foto específica de asbesto
    logistica_llegada TEXT,  -- NULLABLE
    tipos_acceso JSONB,  -- NULLABLE - Array de tipos ["auto", "4x4", "pie", "camion"]
    requiere_voluntarios BOOLEAN DEFAULT FALSE,
    
    -- Evidencia
    evidencia_fotos JSONB,  -- NULLABLE - Array de URLs
    
    -- Infraestructura disponible
    tiene_banos BOOLEAN DEFAULT FALSE,
    tiene_electricidad BOOLEAN DEFAULT FALSE,
    tiene_senal BOOLEAN DEFAULT FALSE,
    
    -- Datos sensibles (PRIVADO - solo autoridades)
    fallecidos_reportados BOOLEAN DEFAULT FALSE,  -- PRIVADO
    
    -- Archivos adicionales
    archivo_kml TEXT,  -- NULLABLE - URL del archivo KML para rutas complejas
    
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
CREATE INDEX IF NOT EXISTS idx_puntos_nivel_urgencia ON puntos(nivel_urgencia);
CREATE INDEX IF NOT EXISTS idx_puntos_habitado ON puntos(habitado_actualmente);

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
    '$2a$10$Xy.a4sLzH4J4521F.2/XWevzOiLtJaeVtrEAaE8gWsI7wxKZDUdIq',
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
