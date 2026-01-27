# Tools - Donde Ayudo CL 🇨🇱

Colección de herramientas y utilidades para el proyecto Donde Ayudo CL.

## Herramientas disponibles

### data-converter

Conversor de datos de alta performance escrito en Go para transformar archivos CSV a JSON con geocodificación automática.

**Características:**
- 10-50x más rápido que Python
- Geocodificación automática con OpenStreetMap
- Sistema de caché inteligente
- Procesamiento concurrente
- Altamente configurable

**Uso rápido:**
```bash
cd tools/data-converter
make build
./data-converter -input ../../src/data/data1.csv -output ../../src/data/data1.json -verbose
```

**Documentación completa:** [data-converter/README.md](./data-converter/README.md)

## Inicio rápido

### Prerrequisitos
- Go 1.21 o superior

### Instalación

```bash
# Clonar el repositorio (si aún no lo has hecho)
git clone https://github.com/P1ngu-Dev/Donde-Ayudo-CL.git
cd Donde-Ayudo-CL/tools/data-converter

# Instalar dependencias
make deps

# Compilar
make build
```

## Guías de uso

### Conversión básica de datos

1. Coloca tu archivo CSV en `src/data/`
2. Ejecuta el conversor:
```bash
cd tools/data-converter
./data-converter -input ../../src/data/tu_archivo.csv -output ../../src/data/salida.json -verbose
```

### Conversión rápida (sin geocodificación)

Para pruebas o si ya tienes coordenadas:
```bash
./data-converter -input archivo.csv -output salida.json -skip-geocode
```

### Conversión con caché

Para datasets grandes, usa el caché para acelerar ejecuciones subsecuentes:
```bash
# Primera ejecución (genera el caché)
./data-converter -input datos.csv -output salida.json -cache geocache.json

# Ejecuciones siguientes (usa el caché)
./data-converter -input datos.csv -output salida.json -cache geocache.json
```

## Herramientas futuras planeadas

- [ ] **json-to-csv**: Conversor inverso JSON → CSV
- [ ] **data-validator**: Validador de esquemas y datos
- [ ] **pocketbase-importer**: Importador directo a PocketBase
- [ ] **geo-enricher**: Enriquecimiento de datos geográficos
- [ ] **data-merger**: Fusión de múltiples fuentes de datos
- [ ] **api-exporter**: Export a diferentes APIs

## Estructura del directorio

```
tools/
├── README.md              # Este archivo
└── data-converter/        # Conversor CSV a JSON
    ├── main.go           # Programa principal
    ├── go.mod            # Dependencias
    ├── Makefile          # Comandos make
    ├── README.md         # Documentación detallada
    ├── EXAMPLES.md       # Ejemplos de uso
    ├── build.sh          # Script de compilación multiplataforma
    ├── test.sh           # Script de pruebas
    ├── models/           # Estructuras de datos
    ├── geocoding/        # Servicio de geocodificación
    └── converter/        # Lógica de conversión
```

## Contribuir

Las contribuciones son bienvenidas! Si tienes ideas para nuevas herramientas o mejoras:

1. Abre un issue describiendo la herramienta/mejora
2. Fork el proyecto
3. Crea tu feature branch
4. Commit tus cambios
5. Push y abre un Pull Request

## Licencia

MIT License - ver el archivo LICENSE en la raíz del proyecto

---

**Proyecto Donde Ayudo CL** 🇨🇱  
Ayudando a coordinar la ayuda en situaciones de emergencia
