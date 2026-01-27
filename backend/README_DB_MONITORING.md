# 🔍 Herramientas de Monitoreo de Base de Datos

Este directorio contiene herramientas para inspeccionar y gestionar la base de datos SQLite de PocketBase.

## 📊 inspect-db.js - Inspector de Base de Datos

Script Node.js para ver y analizar el contenido de la base de datos sin necesidad de herramientas externas.

### Uso

```bash
# Ver todas las tablas disponibles
node backend/inspect-db.js

# Ver estadísticas generales (conteos, categorías, estados)
node backend/inspect-db.js --stats

# Ver registros de una tabla (por defecto 10)
node backend/inspect-db.js puntos

# Ver más registros
node backend/inspect-db.js puntos 20

# Ver schema de una tabla
node backend/inspect-db.js --schema puntos

# Ver solicitudes externas
node backend/inspect-db.js solicitudes_externas
```

### Ejemplos de Salida

**Estadísticas:**
```bash
$ node backend/inspect-db.js --stats

📈 ESTADÍSTICAS DE LA BASE DE DATOS
┌─────────┬────────────────────────┬───────────┐
│ tabla   │ registros              │           │
├─────────┼────────────────────────┼───────────┤
│ puntos  │ 120                    │           │
└─────────┴────────────────────────┴───────────┘

📍 Puntos por Categoría:
┌─────────┬───────────────┬──────────┐
│ categoria │ cantidad      │          │
├─────────┼───────────────┼──────────┤
│ acopio  │ 49            │          │
│ informacion │ 71         │          │
└─────────┴───────────────┴──────────┘
```

---

## 🛠️ Otras Opciones de Monitoreo

### 1. **SQLite Browser (GUI)** - Recomendado para exploración visual
Aplicación gráfica para SQLite, ideal para desarrollo.

**Instalar en Ubuntu/Debian:**
```bash
sudo apt install sqlitebrowser
```

**Uso:**
```bash
sqlitebrowser backend/pb_data/data.db
```

**Ventajas:**
- ✅ Interfaz visual intuitiva
- ✅ Edición de datos (cuidado en producción)
- ✅ Exportar a CSV/SQL
- ✅ Ver índices y estructura

---

### 2. **SQLite CLI** - Para usuarios avanzados
Línea de comandos nativa de SQLite.

**Uso rápido:**
```bash
# Abrir base de datos
sqlite3 backend/pb_data/data.db

# Comandos útiles dentro de SQLite:
.tables                              # Listar tablas
.schema puntos                       # Ver estructura
SELECT COUNT(*) FROM puntos;         # Contar registros
.mode column                         # Formato legible
.headers on                          # Mostrar nombres de columnas
SELECT * FROM puntos LIMIT 5;        # Ver registros
.quit                                # Salir
```

**Comando directo (sin entrar a SQLite):**
```bash
sqlite3 backend/pb_data/data.db "SELECT COUNT(*) as total FROM puntos"
```

---

### 3. **VS Code Extension** - Para trabajar desde el editor
Extensión: **SQLite Viewer** o **SQLite**

**Instalar:**
1. Buscar "SQLite" en VS Code Extensions
2. Instalar "SQLite" de alexcvzz
3. Hacer clic derecho en `backend/pb_data/data.db` > "Open Database"

**Ventajas:**
- ✅ Sin salir del editor
- ✅ Ver tablas en panel lateral
- ✅ Ejecutar queries desde VS Code

---

### 4. **PocketBase Admin UI** - Para gestión completa
La interfaz de administración web de PocketBase.

**Acceso:**
```bash
# Iniciar PocketBase
cd backend && ./pocketbase serve

# Abrir en navegador:
http://127.0.0.1:8090/_/
```

**Ventajas:**
- ✅ Interfaz oficial de PocketBase
- ✅ Gestión de usuarios y permisos
- ✅ Ver logs en tiempo real
- ✅ Backup/Restore
- ✅ API Rules testing

**Limitación:**
- ⚠️ Requiere que PocketBase esté corriendo

---

## 🎯 Cuándo usar cada herramienta

| Herramienta | Mejor para | Ventaja Principal |
|------------|-----------|-------------------|
| `inspect-db.js` | Quick checks en desarrollo | No requiere GUI, scripteable |
| SQLite Browser | Exploración profunda | Visual, potente, fácil de usar |
| SQLite CLI | Automatización/Scripts | Terminal, disponible siempre |
| VS Code Extension | Desarrollo activo | Integrado en el flujo de trabajo |
| PocketBase Admin | Gestión de producción | Interfaz oficial, completa |

---

## 📝 Comandos Útiles de Consulta

### Conteo por categoría y estado
```sql
SELECT categoria, estado, COUNT(*) as total 
FROM puntos 
GROUP BY categoria, estado;
```

### Puntos sin verificar
```sql
SELECT nombre, ciudad, estado, fecha_verificacion 
FROM puntos 
WHERE estado != 'publicado';
```

### Puntos con necesidades específicas
```sql
SELECT nombre, ciudad, necesidades_raw 
FROM puntos 
WHERE necesidades_raw LIKE '%agua%';
```

### Puntos recientes
```sql
SELECT nombre, ciudad, created, estado 
FROM puntos 
ORDER BY created DESC 
LIMIT 10;
```

---

## 🔒 Seguridad

**⚠️ IMPORTANTE:**
- `data.db` contiene datos sensibles (usuarios, contactos)
- Nunca subir a Git (ya está en `.gitignore`)
- En producción, usar backups automáticos de PocketBase
- No exponer puertos de SQLite directamente

---

## 🚀 Backups

### Backup manual
```bash
# Copiar base de datos (con PocketBase apagado)
cp backend/pb_data/data.db backend/pb_data/backup_$(date +%Y%m%d).db

# O usar PocketBase (recomendado)
cd backend && ./pocketbase admin backup
```

### Automatizar backups
Agregar a cron o usar PocketBase Cloud para backups automáticos.

