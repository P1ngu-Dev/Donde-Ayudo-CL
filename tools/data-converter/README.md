# Data Converter - Donde Ayudo CL 🇨🇱

Conversor de datos de alta performance escrito en Go para transformar archivos CSV a JSON con geocodificación automática.

## 🚀 Características

- ✅ **Conversión CSV a JSON** con transformación de estructura
- 🌍 **Geocodificación automática** usando OpenStreetMap/Nominatim
- 💾 **Sistema de caché inteligente** para evitar geocodificaciones repetidas
- ⚡ **Procesamiento concurrente** con workers configurables
- 🚦 **Rate limiting** automático para respetar límites de APIs
- 📊 **Estadísticas detalladas** de conversión
- 🔧 **Altamente configurable** mediante flags CLI
- 🎯 **Modo verbose** para debugging

## 📋 Requisitos

- Go 1.21 o superior

## 🔨 Instalación

```bash
cd tools/data-converter
go mod download
go build -o data-converter
```

## 📖 Uso

### Uso básico

```bash
# Desde el directorio del proyecto
cd tools/data-converter

# Conversión básica (CSV en la raíz del proyecto)
./data-converter -input ../../src/data/data1.csv -output ../../src/data/data1.json

# O con ruta relativa
./data-converter -input data.csv -output output.json
```

### Opciones avanzadas

```bash
# Con todas las opciones
./data-converter \
  -input data.csv \
  -output output.json \
  -cache geocache.json \
  -workers 5 \
  -rate 1s \
  -country "Chile" \
  -verbose

# Forzar re-geocodificación (ignorar caché)
./data-converter -input data.csv -output output.json -force

# Sin caché (útil para testing)
./data-converter -input data.csv -output output.json -no-cache

# Omitir geocodificación (solo conversión de estructura)
./data-converter -input data.csv -output output.json -skip-geocode

# Modo verbose para ver detalles
./data-converter -input data.csv -output output.json -verbose
```

## ⚙️ Flags disponibles

| Flag | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `-input` | string | `data1.csv` | Archivo CSV de entrada |
| `-output` | string | `data1.json` | Archivo JSON de salida |
| `-cache` | string | `geocache.json` | Archivo de caché de geocodificación |
| `-workers` | int | `3` | Número de workers concurrentes |
| `-rate` | duration | `1100ms` | Tiempo mínimo entre peticiones de geocodificación |
| `-country` | string | `Chile` | País por defecto para geocodificación |
| `-skip-geocode` | bool | `false` | Omitir geocodificación |
| `-force` | bool | `false` | Forzar refresh (ignorar caché) |
| `-no-cache` | bool | `false` | Deshabilitar completamente el caché |
| `-verbose` | bool | `false` | Modo verbose (logs detallados) |
| `-version` | bool | `false` | Mostrar versión |

## 📊 Formato de entrada (CSV)

El CSV debe contener las siguientes columnas:

- `Espacio` - Nombre del lugar
- `TIPO` - Tipo de lugar (ej: centro de acopio)
- `COMUNA` - Comuna/ciudad
- `DIRECCIÓN` - Dirección física
- `MÁS INFO` - Información adicional (se parsea como lista)
- `Horario de Inicio` - Hora de inicio
- `Horario de fin` - Hora de término
- `Dias (ordenar columnas) (Semana del 19)` - Días de atención
- `CONTACTO` - Información de contacto

## 📦 Formato de salida (JSON)

```json
[
  {
    "id": "1",
    "name": "Nombre del lugar",
    "type": "centro de acopio",
    "lat": -33.437019,
    "lng": -70.650395,
    "city": "Santiago",
    "address": "Calle Principal 123",
    "place": "Nombre del lugar",
    "status": "active",
    "capacity_status": "",
    "supplies_needed": ["agua", "alimentos", "ropa"],
    "info": "Información adicional",
    "schedule": {
      "start": "09:00",
      "end": "18:00",
      "days": "Lunes a Viernes"
    },
    "created_at": "2026-01-26T10:30:00Z",
    "updated_at": "2026-01-26T10:30:00Z",
    "contact": "contacto@ejemplo.cl",
    "verified": false,
    "verificator": ""
  }
]
```

## 🎯 Ventajas sobre la versión Python

1. **Rendimiento**: ~10-50x más rápido que Python
2. **Concurrencia nativa**: Goroutines para procesamiento paralelo eficiente
3. **Binario único**: No requiere intérprete ni dependencias instaladas
4. **Menor uso de memoria**: Gestión eficiente de recursos
5. **Sistema de caché**: Persistente entre ejecuciones
6. **Rate limiting inteligente**: Respeta automáticamente límites de API
7. **Configuración flexible**: Múltiples opciones vía CLI

## 🔄 Comparación con el script Python original

| Característica | Python | Go |
|----------------|--------|-----|
| Velocidad | Base | 10-50x más rápido |
| Concurrencia | Secuencial | Paralelo con goroutines |
| Caché | No | Sí (persistente) |
| Configuración | Hardcoded | CLI flags |
| Distribución | Requiere Python + deps | Binario único |
| Uso de memoria | ~50-100MB | ~10-30MB |
| Rate limiting | time.sleep() | Rate limiter profesional |

## 📝 Ejemplos de uso

### Ejemplo 1: Conversión estándar
```bash
./data-converter -input datos.csv -output salida.json -verbose
```

### Ejemplo 2: Alta velocidad con múltiples workers
```bash
# Usar 10 workers para datasets grandes
./data-converter -input datos.csv -output salida.json -workers 10 -rate 500ms
```

### Ejemplo 3: Actualización incremental
```bash
# Usar caché existente para solo geocodificar nuevas direcciones
./data-converter -input datos_nuevos.csv -output salida.json -cache geocache.json
```

### Ejemplo 4: Solo transformación de estructura
```bash
# Sin geocodificación (útil si ya tienes coordenadas o para testing)
./data-converter -input datos.csv -output salida.json -skip-geocode
```

## 🐛 Debugging

Si tienes problemas, usa el flag `-verbose` para ver logs detallados:

```bash
./data-converter -input data.csv -output output.json -verbose
```

Esto mostrará:
- Configuración completa
- Estado del caché
- Cada dirección siendo geocodificada
- Errores específicos de geocodificación
- Estadísticas detalladas

## 📈 Estadísticas

Al finalizar, el programa muestra estadísticas completas:

```
============================================================
RESUMEN DE CONVERSIÓN
============================================================
Total de registros:        150
Registros procesados:      150
Geocodificación exitosa:   142
Geocodificación fallida:   8
Tasa de éxito:             94.7%
Entradas en caché:         142 (142 válidas)
Tiempo de ejecución:       2m 30s
Archivo de salida:         output.json
============================================================
```

## 🔮 Extensiones futuras

El sistema está diseñado para ser extensible. Posibles mejoras:

- [ ] Soporte para múltiples proveedores de geocodificación (Google Maps, Mapbox)
- [ ] Conversión JSON a CSV (reverso)
- [ ] Conversión a otros formatos (XML, YAML, TOML)
- [ ] API REST para conversión en línea
- [ ] Validación de datos con schemas
- [ ] Transformaciones personalizadas vía config file
- [ ] Soporte para bases de datos (PostgreSQL, MySQL, MongoDB)
- [ ] Export directo a PocketBase

## 📄 Licencia

MIT

## 👥 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Si encuentras algún bug o tienes sugerencias, por favor abre un issue en GitHub.

---

**Hecho con ❤️ para Donde Ayudo CL** 🇨🇱
