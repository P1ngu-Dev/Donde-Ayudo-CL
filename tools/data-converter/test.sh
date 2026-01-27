#!/bin/bash

# Script de prueba rápida del conversor

echo "🧪 Ejecutando prueba del conversor..."
echo ""

# Verificar si existe el CSV
if [ ! -f "../../src/data/data1.csv" ]; then
    echo "❌ Error: No se encuentra el archivo data1.csv"
    echo "   Esperado en: ../../src/data/data1.csv"
    exit 1
fi

# Ejecutar con modo skip-geocode para prueba rápida
echo "📝 Probando conversión sin geocodificación (prueba rápida)..."
./data-converter \
    -input ../../src/data/data1.csv \
    -output test_output.json \
    -skip-geocode \
    -verbose

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Prueba exitosa!"
    echo "📄 Archivo generado: test_output.json"
    echo ""
    echo "Para ejecutar con geocodificación real:"
    echo "./data-converter -input ../../src/data/data1.csv -output ../../src/data/data1.json -verbose"
else
    echo ""
    echo "❌ La prueba falló"
    exit 1
fi
