# Notas de Migración: Python → Go

## Resumen de cambios

### Archivos anteriores
- `src/data/convert_csv_to_json.py` - Script original Python (mantener como referencia)

### Nuevos archivos
- `tools/data-converter/` - Sistema completo en Go

## Migración completa

### 1. Mantener el script Python (opcional)

El script Python original puede mantenerse para:
- Referencia
- Desarrollo rápido de prototipos
- Comparación de resultados

**Recomendación:** Mover a archivo legacy:
```bash
mv src/data/convert_csv_to_json.py src/data/convert_csv_to_json.py.legacy
```

O agregar comentario al inicio:
```python
# DEPRECATED: Este script ha sido reemplazado por tools/data-converter (Go)
# Ver: tools/data-converter/README.md
# Mantener solo como referencia
```

### 2. Nuevo workflow recomendado

#### Antes (Python):
```bash
cd src/data
python convert_csv_to_json.py
# Esperar ~2 minutos
# Resultado: data1.json
```

#### Ahora (Go):
```bash
cd tools/data-converter
./data-converter \
  -input ../../src/data/data1.csv \
  -output ../../src/data/data1.json \
  -verbose
# Resultado: data1.json + geocache.json
```

#### Con caché (ejecuciones subsecuentes):
```bash
# Segunda vez y siguientes - mucho más rápido
./data-converter \
  -input ../../src/data/data1.csv \
  -output ../../src/data/data1.json
# Usa geocache.json automáticamente
```

## Casos de migración

### Caso 1: Primera conversión
```bash
cd tools/data-converter

# Si no existe el binario, compilar primero
make build

# Ejecutar conversión completa
./data-converter \
  -input ../../src/data/data1.csv \
  -output ../../src/data/data1.json \
  -verbose \
  -cache geocache.json
```

**Resultado:**
- data1.json generado
- geocache.json creado
- Tiempo: ~igual que Python (limitado por API)
- Estadísticas detalladas

### Caso 2: Actualización de datos (algunos registros nuevos)
```bash
# Editar data1.csv (agregar/modificar registros)
# Ejecutar con caché existente
./data-converter \
  -input ../../src/data/data1.csv \
  -output ../../src/data/data1.json \
  -cache geocache.json
```

**Resultado:**
- Solo geocodifica direcciones nuevas
- Reutiliza coordenadas del caché
- Tiempo: mucho más rápido (~80% más rápido)

### Caso 3: Forzar re-geocodificación completa
```bash
# Si sospechas que algunas coordenadas están mal
./data-converter \
  -input ../../src/data/data1.csv \
  -output ../../src/data/data1.json \
  -force
```

**Resultado:**
- Ignora caché
- Re-geocodifica todo
- Actualiza caché con nuevos valores

### Caso 4: Solo transformación (testing)
```bash
# Para probar cambios en el formato sin geocodificar
./data-converter \
  -input ../../src/data/data1.csv \
  -output ../../src/data/data1_test.json \
  -skip-geocode
```

**Resultado:**
- Conversión instantánea
- Sin peticiones a API
- Ideal para desarrollo

## Integración en CI/CD
### GitHub Actions ejemplo:

```yaml
name: Generate Data

on:
  push:
    paths:
      - 'src/data/data1.csv'

jobs:
  convert:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'
      
      - name: Build converter
        run: |
          cd tools/data-converter
          go build -o data-converter .
      
      - name: Restore cache
        uses: actions/cache@v3
        with:
          path: tools/data-converter/geocache.json
          key: geocache-${{ hashFiles('src/data/data1.csv') }}
      
      - name: Convert data
        run: |
          cd tools/data-converter
          ./data-converter \
            -input ../../src/data/data1.csv \
            -output ../../src/data/data1.json \
            -cache geocache.json
      
      - name: Save cache
        uses: actions/cache/save@v3
        with:
          path: tools/data-converter/geocache.json
          key: geocache-${{ hashFiles('src/data/data1.csv') }}
      
      - name: Commit changes
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add src/data/data1.json
          git commit -m "Update data1.json" || echo "No changes"
          git push
```

## Checklist de migración

- [x] Compilar data-converter
- [x] Verificar que funciona con data1.csv
- [ ] Ejecutar primera conversión completa
- [ ] Verificar que el JSON generado es correcto
- [ ] Comparar con output de Python (deben ser idénticos salvo timestamps)
- [ ] Documentar el nuevo proceso al equipo
- [ ] Actualizar scripts de deployment si existen
- [ ] (Opcional) Deprecar script Python

## Troubleshooting

### Problema: "El JSON generado es diferente al de Python"

**Verificar:**
1. Formato de números (redondeo de decimales)
2. Order de campos JSON (no importa)
3. Timestamps (serán diferentes, es normal)
4. Arrays vacíos: Python `[]` vs Go `[]` (idénticos)

**Solución:** Usar un diff JSON-aware:
```bash
# Instalar jq si no lo tienes
sudo apt install jq

# Comparar ignorando timestamps
jq 'del(.[].created_at, .[].updated_at)' python_output.json > py_clean.json
jq 'del(.[].created_at, .[].updated_at)' go_output.json > go_clean.json
diff py_clean.json go_clean.json
```

### Problema: "Muy lento"

**Verificar:**
1. ¿Estás usando caché? (debe existir geocache.json)
2. ¿Usaste `-force` sin querer?
3. ¿El rate limit es muy alto?

**Solución:**
```bash
# Asegurar que usas caché
ls -la geocache.json  # Debe existir

# Ver cuántas entradas hay en caché
jq 'length' geocache.json

# Reducir rate limit (solo si tienes permiso)
./data-converter -rate 500ms ...
```

### Problema: "Error: missing go.sum entry"

**Solución:**
```bash
cd tools/data-converter
go mod tidy
go build
```

## Recursos adicionales

- [README completo](./README.md)
- [Ejemplos de uso](./EXAMPLES.md)
- [Comparación detallada Python vs Go](./COMPARISON.md)
- [Makefile commands](./Makefile)

## Próximos pasos recomendados

1. **Probar el conversor** con un dataset pequeño
2. **Generar caché completo** con tu dataset completo
3. **Integrar en workflow** diario
4. **Documentar al equipo** el nuevo proceso
5. **Considerar CI/CD** para automatización
6. **Explorar opciones avanzadas** (múltiples workers, custom rate limits)

---

