#!/bin/bash
# Script rápido para queries comunes de monitoreo

DB_PATH="backend/pb_data/data.db"

if [ ! -f "$DB_PATH" ]; then
    echo "❌ Base de datos no encontrada"
    exit 1
fi

case "${1:-stats}" in
    stats)
        echo "📊 ESTADÍSTICAS RÁPIDAS"
        echo ""
        echo "Total de puntos:"
        sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM puntos;"
        echo ""
        echo "Por categoría:"
        sqlite3 -header -column "$DB_PATH" "SELECT categoria, COUNT(*) as total FROM puntos GROUP BY categoria;"
        echo ""
        echo "Por estado:"
        sqlite3 -header -column "$DB_PATH" "SELECT estado, COUNT(*) as total FROM puntos GROUP BY estado;"
        ;;
    
    recent)
        echo "🕐 ÚLTIMOS 10 PUNTOS AGREGADOS"
        sqlite3 -header -column "$DB_PATH" "SELECT nombre, ciudad, categoria, created FROM puntos ORDER BY created DESC LIMIT 10;"
        ;;
    
    unverified)
        echo "⚠️  PUNTOS SIN VERIFICAR"
        sqlite3 -header -column "$DB_PATH" "SELECT id, nombre, ciudad, estado FROM puntos WHERE estado != 'publicado';"
        ;;
    
    search)
        if [ -z "$2" ]; then
            echo "Uso: ./db-query.sh search 'término'"
            exit 1
        fi
        echo "🔍 BUSCANDO: $2"
        sqlite3 -header -column "$DB_PATH" "SELECT nombre, ciudad, categoria, contacto_principal FROM puntos WHERE nombre LIKE '%$2%' OR ciudad LIKE '%$2%' OR direccion LIKE '%$2%';"
        ;;
    
    *)
        echo "Uso: ./db-query.sh [comando]"
        echo ""
        echo "Comandos disponibles:"
        echo "  stats       - Estadísticas generales (default)"
        echo "  recent      - Últimos puntos agregados"
        echo "  unverified  - Puntos sin verificar"
        echo "  search 'x'  - Buscar por nombre/ciudad/dirección"
        ;;
esac
