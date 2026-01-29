# Schema de Base de Datos - Donde Ayudo CL

## Resumen Ejecutivo

Este documento especifica el schema **exacto** que debe existir en Supabase para que la aplicación funcione correctamente.

---

## Tabla: `users`

### Columnas

| Columna | Tipo | Nullable | Default | Constraint | Descripción |
|---------|------|----------|---------|------------|-------------|
| `id` | TEXT | NO | - | PRIMARY KEY | Identificador único (formato: `usr_xxxxx`) |
| `email` | TEXT | NO | - | UNIQUE | Email del usuario |
| `password` | TEXT | NO | - | - | Hash bcrypt de la contraseña |
| `name` | TEXT | NO | - | - | Nombre completo |
| `rol` | TEXT | NO | - | CHECK | Rol: 'superadmin', 'admin', 'verificador', 'usuario' |
| `organizacion` | TEXT | **SÍ** | NULL | - | Nombre de la organización (opcional) |
| `avatar` | TEXT | **SÍ** | NULL | - | URL del avatar (opcional) |
| `emailVisibility` | BOOLEAN | NO | FALSE | - | Si el email es visible públicamente |
| `verified` | BOOLEAN | NO | TRUE | - | Si el usuario está verificado |
| `activo` | BOOLEAN | NO | TRUE | - | Si el usuario está activo |
| `tokenKey` | TEXT | **SÍ** | NULL | - | Token para validación (opcional) |
| `created` | TIMESTAMP | NO | NOW() | - | Fecha de creación |
| `updated` | TIMESTAMP | NO | NOW() | - | Fecha de última actualización |

### Índices

```sql
idx_users_email ON users(email)
idx_users_rol ON users(rol)
idx_users_activo ON users(activo)
```

### Constraint CHECK

```sql
rol IN ('superadmin', 'admin', 'verificador', 'usuario')
```

---

## Tabla: `puntos`

### Columnas

| Columna | Tipo | Nullable | Default | Constraint | Descripción |
|---------|------|----------|---------|------------|-------------|
| `id` | TEXT | NO | - | PRIMARY KEY | Identificador único (formato: `pnt_xxxxx`) |
| `nombre` | TEXT | NO | - | - | Nombre del punto |
| `latitud` | REAL | NO | - | - | Coordenada latitud |
| `longitud` | REAL | NO | - | - | Coordenada longitud |
| `direccion` | TEXT | **SÍ** | NULL | - | Dirección física |
| `ciudad` | TEXT | **SÍ** | NULL | - | Ciudad |
| `categoria` | TEXT | **SÍ** | NULL | - | Tipo: 'acopio', 'albergue', 'hidratacion', 'sos' |
| `subtipo` | TEXT | **SÍ** | NULL | - | Subtipo específico |
| `contacto_principal` | TEXT | **SÍ** | NULL | - | Teléfono/email de contacto |
| `contacto_nombre` | TEXT | **SÍ** | NULL | - | Nombre de contacto |
| `horario` | TEXT | **SÍ** | NULL | - | Horario de atención |
| `estado` | TEXT | NO | 'activo' | CHECK | Estado: 'activo', 'inactivo', 'pendiente', 'cerrado' |
| `entidad_verificadora` | TEXT | **SÍ** | NULL | - | Organización que verificó |
| `fecha_verificacion` | TIMESTAMP | **SÍ** | NULL | - | Fecha de verificación |
| `notas_internas` | TEXT | **SÍ** | NULL | - | Notas privadas para admin |
| `capacidad_estado` | TEXT | **SÍ** | NULL | - | Estado de capacidad (lleno/disponible) |
| `necesidades_raw` | TEXT | **SÍ** | NULL | - | Texto libre de necesidades |
| `necesidades_tags` | JSONB | **SÍ** | NULL | - | Array JSON de strings |
| `nombre_zona` | TEXT | **SÍ** | NULL | - | Nombre de la zona afectada |
| `habitado_actualmente` | BOOLEAN | NO | FALSE | - | Si hay personas viviendo |
| `cantidad_ninos` | INTEGER | NO | 0 | - | Cantidad de niños |
| `cantidad_adultos` | INTEGER | NO | 0 | - | Cantidad de adultos |
| `cantidad_ancianos` | INTEGER | NO | 0 | - | Cantidad de ancianos |
| `animales_detalle` | TEXT | **SÍ** | NULL | - | Descripción de animales |
| `riesgo_asbesto` | BOOLEAN | NO | FALSE | - | Si hay riesgo de asbesto |
| `logistica_llegada` | TEXT | **SÍ** | NULL | - | Cómo llegar al punto |
| `requiere_voluntarios` | BOOLEAN | NO | FALSE | - | Si necesita voluntarios |
| `urgencia` | TEXT | **SÍ** | NULL | - | Nivel de urgencia |
| `evidencia_fotos` | JSONB | **SÍ** | NULL | - | Array JSON de URLs de fotos |
| `created` | TIMESTAMP | NO | NOW() | - | Fecha de creación |
| `updated` | TIMESTAMP | NO | NOW() | - | Fecha de última actualización |
| `created_by` | TEXT | **SÍ** | NULL | - | ID del usuario creador |

### Índices

```sql
idx_puntos_tipo ON puntos(categoria)
idx_puntos_estado ON puntos(estado)
idx_puntos_categoria ON puntos(categoria)
idx_puntos_ciudad ON puntos(ciudad)
idx_puntos_subtipo ON puntos(subtipo)
idx_puntos_created ON puntos(created)
```

### Constraint CHECK

```sql
estado IN ('activo', 'inactivo', 'pendiente', 'cerrado')
```

---

## Datos Iniciales

### Usuario Admin por Defecto

```sql
Email: admin@dondeayudo.cl
Password: admin123
Rol: superadmin
```

**Hash de password (bcrypt):**
```
$2a$10$rT8YvV9w7JqL3H8KZ9xVh.xE5J5KZ8YvV9w7JqL3H8KZ9xVh.xE5J
```

---

## Tipos de Datos Importantes

### JSONB en PostgreSQL

- `necesidades_tags`: Array de strings
  ```json
  ["agua", "alimentos", "medicinas"]
  ```

- `evidencia_fotos`: Array de URLs
  ```json
  ["https://ejemplo.com/foto1.jpg", "https://ejemplo.com/foto2.jpg"]
  ```

### BOOLEAN vs INTEGER

⚠️ **IMPORTANTE**: PostgreSQL usa `BOOLEAN` (true/false), NO integers (0/1)

- ✅ Correcto: `activo BOOLEAN DEFAULT TRUE`
- ❌ Incorrecto: `activo INTEGER DEFAULT 1`

### TIMESTAMP vs TEXT

⚠️ **IMPORTANTE**: Usar `TIMESTAMP` con `NOW()`, NO `TEXT` con `CURRENT_TIMESTAMP`

- ✅ Correcto: `created TIMESTAMP DEFAULT NOW()`
- ❌ Incorrecto: `created TEXT DEFAULT CURRENT_TIMESTAMP`

---

## Verificación

Ejecuta estas queries en Supabase para verificar que todo esté correcto:

```sql
-- Ver estructura de users
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- Ver estructura de puntos
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'puntos'
ORDER BY ordinal_position;

-- Verificar datos
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_puntos FROM puntos;
```

---

## Pasos para Aplicar

1. **Backup** (si tienes datos):
   ```sql
   -- En Supabase SQL Editor
   SELECT * FROM users;
   SELECT * FROM puntos;
   ```

2. **Eliminar tablas existentes** (si hay conflictos):
   ```sql
   DROP TABLE IF EXISTS puntos CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   ```

3. **Ejecutar schema completo**:
   - Copia TODO el contenido de `backend/schema_supabase.sql`
   - Pégalo en Supabase SQL Editor
   - Click "Run"

4. **Verificar**:
   - Deberías ver 1 usuario en `users`
   - Deberías ver 0 puntos en `puntos`
   - Todos los índices creados

---

## Notas Técnicas

### Campos Nullable vs NOT NULL

**NULLABLE** (pueden ser NULL):
- `organizacion`, `avatar`, `tokenKey` en `users`
- Casi todos los campos de `puntos` excepto: `id`, `nombre`, `latitud`, `longitud`, `estado`, booleans, integers, timestamps

**NOT NULL** (obligatorios):
- IDs, emails, passwords, names
- Coordenadas (latitud, longitud)
- Estados con defaults
- Timestamps con NOW()

### Snake_case vs camelCase

⚠️ **PostgreSQL usa snake_case** en nombres de columnas, pero Go usa camelCase en structs.

El mapeo se hace automáticamente en las queries SQL.

Ejemplo:
- DB: `contacto_principal` → Go: `ContactoPrincipal`
- DB: `emailVisibility` → Go: `EmailVisibility` (excepción, mantiene camelCase)
