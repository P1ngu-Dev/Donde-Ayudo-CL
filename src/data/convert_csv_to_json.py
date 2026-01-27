"""
NOTA: Este script ha sido reemplazado por una versión mejorada en Go
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nueva herramienta: tools/data-converter/
- 10-50x más rápido
- Sistema de caché inteligente
- Procesamiento concurrente
- CLI completa con múltiples opciones

Para usar la nueva versión:
    cd tools/data-converter
    ./data-converter -help

Ver documentación: tools/data-converter/README.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Este script Python se mantiene solo como referencia.
Para producción, usa la versión Go.
"""

import csv
import json
from datetime import datetime
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
import time

def get_coordinates(address):
    """Get latitude and longitude from address using Nominatim"""
    if not address or address.strip() == "":
        return None, None
    
    try:
        geolocator = Nominatim(user_agent="donde-ayudo-cl")
        # Add "Chile" to improve accuracy
        full_address = f"{address}, Chile" if "Chile" not in address else address
        location = geolocator.geocode(full_address, timeout=10)
        
        if location:
            return round(location.latitude, 6), round(location.longitude, 6)
        else:
            print(f"  No se encontraron coordenadas para: {address}")
            return None, None
    except (GeocoderTimedOut, GeocoderServiceError) as e:
        print(f"  Error geocodificando {address}: {e}")
        return None, None

# Read CSV file
with open('data1.csv', 'r', encoding='utf-8') as csvfile:
    csv_reader = csv.DictReader(csvfile)
    data = []
    
    for idx, row in enumerate(csv_reader, start=1):
        address = row.get('DIRECCIÓN', '').strip()
        
        # Get coordinates from address
        print(f"[{idx}] Geocodificando: {row.get('Espacio', '')[:40]}...")
        lat, lng = get_coordinates(address)
        
        # Transform to match the example.json structure
        transformed_row = {
            "id": str(idx),
            "name": row.get('Espacio', '').strip(),
            "type": row.get('TIPO', '').lower().strip(),
            "lat": lat,
            "lng": lng,
            "city": row.get('COMUNA', '').strip(),
            "address": address,
            "place": row.get('Espacio', '').strip(),
            "status": "active",
            "capacity_status": "",
            "supplies_needed": [item.strip() for item in row.get('MÁS INFO', '').split(',') if item.strip()] if row.get('MÁS INFO', '').strip() else [],
            "info": row.get('MÁS INFO', '').strip(),
            "schedule": {
                "start": row.get('Horario de Inicio', '').strip(),
                "end": row.get('Horario de fin', '').strip(),
                "days": row.get('Dias (ordenar columnas) (Semana del 19)', '').strip()
            },
            "created_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "updated_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
            "contact": row.get('CONTACTO', '').strip(),
            "verified": False,
            "verificator": ""
        }
        data.append(transformed_row)
        
        # Delay to respect Nominatim usage policy (max 1 request per second)
        time.sleep(1.1)

# Write to JSON file
with open('data1.json', 'w', encoding='utf-8') as jsonfile:
    json.dump(data, jsonfile, ensure_ascii=False, indent=2)

print(f"\nConversion complete! {len(data)} records converted to JSON.")
successful_coords = sum(1 for item in data if item['lat'] is not None)
print(f"Coordenadas obtenidas: {successful_coords}/{len(data)}")
