-- ============================================================================
-- MIGRACIÓN: Añadir campo must_change_password a users
-- ============================================================================
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================================

-- Añadir columna para control de contraseña temporal
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;

-- Comentario explicativo
COMMENT ON COLUMN users.must_change_password IS 
  'Indica si el usuario debe cambiar su contraseña en el próximo login (contraseña temporal)';
