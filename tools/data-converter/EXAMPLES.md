# Ejemplo de uso del conversor

## Instalación de Go (si no lo tienes)
# Ubuntu/Debian:
# sudo apt update && sudo apt install golang-go

# macOS:
# brew install go

# Windows:
# Descargar desde https://golang.org/dl/

## Compilar el proyecto
```bash
cd tools/data-converter
make deps    # Instalar dependencias
make build   # Compilar
```

## Ejemplos de uso

### 1. Conversión básica
```bash
./data-converter \
  -input ../../src/data/data1.csv \
  -output ../../src/data/data1.json
```

### 2. Modo verbose (recomendado para la primera vez)
```bash
./data-converter \
  -input ../../src/data/data1.csv \
  -output ../../src/data/data1.json \
  -verbose
```

### 3. Alta velocidad con múltiples workers
```bash
# Usar 5 workers y reducir rate limit (cuidado con límites de API)
./data-converter \
  -input ../../src/data/data1.csv \
  -output ../../src/data/data1.json \
  -workers 5 \
  -rate 800ms
```

### 4. Forzar re-geocodificación completa
```bash
# Ignorar caché y volver a geocodificar todo
./data-converter \
  -input ../../src/data/data1.csv \
  -output ../../src/data/data1.json \
  -force
```

### 5. Solo transformación (sin geocodificación)
```bash
# Útil para testing rápido o si ya tienes coordenadas
./data-converter \
  -input ../../src/data/data1.csv \
  -output ../../src/data/data1.json \
  -skip-geocode
```

### 6. Sin caché
```bash
# No usar ni guardar caché (útil para testing)
./data-converter \
  -input ../../src/data/data1.csv \
  -output ../../src/data/data1.json \
  -no-cache
```

## Usando Makefile

```bash
# Ver ayuda
make help

# Instalar dependencias
make deps

# Compilar
make build

# Ejecutar en modo desarrollo
make dev

# Compilar para todas las plataformas
make build-all

# Limpiar todo
make clean
```

## Tips y recomendaciones

### Rate Limiting
- **Nominatim (OpenStreetMap)** requiere máximo 1 request por segundo
- El default es 1100ms (1.1 segundos) para estar seguros
- Si tienes tu propia instancia de Nominatim, puedes reducir el rate limit

### Caché
- El caché se guarda en `geocache.json` por defecto
- Reutiliza el caché entre ejecuciones para ahorrar tiempo
- Usa `-force` solo cuando necesites actualizar coordenadas

### Workers
- Default: 3 workers
- Más workers = más rápido, pero respeta el rate limit global
- Para datasets grandes (>500 registros), usa 5-10 workers

### Performance esperada
- Sin caché: ~1.1 segundos por registro
- Con caché: Prácticamente instantáneo para registros ya geocodificados
- 100 registros nuevos: ~2 minutos
- 100 registros (todos en caché): ~1 segundo

## Estructura del proyecto

```
tools/data-converter/
├── main.go                 # Punto de entrada
├── go.mod                  # Dependencias
├── Makefile               # Comandos útiles
├── build.sh               # Script de compilación multiplataforma
├── README.md              # Documentación principal
├── EXAMPLES.md            # Este archivo
├── models/
│   └── models.go          # Estructuras de datos
├── geocoding/
│   └── geocoding.go       # Servicio de geocodificación
└── converter/
    └── csv_to_json.go     # Lógica de conversión
```

## Troubleshooting

### Error: "cannot find package"
```bash
make deps
```

### Error: "geocoding timeout"
Aumenta el timeout o reduce los workers:
```bash
./data-converter -workers 1 -rate 2s
```

### Error: "too many requests"
Estás excediendo el rate limit. Aumenta el delay:
```bash
./data-converter -rate 2s
```

### Geocodificación fallida
- Verifica que la dirección sea válida
- Usa `-verbose` para ver detalles
- Algunas direcciones pueden no tener coordenadas disponibles

### Performance lenta
- Usa el caché: no uses `-no-cache`
- Verifica que no estés usando `-force` innecesariamente
- Aumenta workers si tienes muchos registros

## Workflow recomendado

1. **Primera ejecución**: Usa verbose para ver el progreso
```bash
./data-converter -input data.csv -output data.json -verbose
```

2. **Actualizaciones incrementales**: Usa el caché
```bash
./data-converter -input data_new.csv -output data.json
```

3. **Testing**: Omite geocodificación
```bash
./data-converter -input data.csv -output data.json -skip-geocode
```

4. **Producción**: Configuración optimizada
```bash
./data-converter \
  -input data.csv \
  -output data.json \
  -workers 5 \
  -cache geocache.json \
  -country "Chile"
```
