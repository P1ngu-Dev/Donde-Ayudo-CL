/**
 * Script de migración: JSON -> PocketBase
 * Migra los datos de data1.json a la colección "puntos"
 * 
 * Ejecutar: node backend/migrate_data.js EMAIL PASSWORD
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const POCKETBASE_URL = 'http://127.0.0.1:8090';

// Mapeo de tipos antiguos a categorías nuevas
const TYPE_TO_CATEGORY = {
  'acopio': 'acopio',
  'acopio comedor solidario': 'acopio',
  'acopio para infancias': 'acopio',
  'albergue': 'informacion',
  'atencion de salud': 'informacion',
  'atención psicosocial': 'informacion',
  'ayuda animal': 'informacion',
  'bomberos': 'informacion',
  'donaciones': 'informacion',
  'evento benefico': 'informacion',
  'voluntariado': 'informacion',
  'campaña solidaria': 'informacion'
};

// Normalizar subtipo (el type original, limpio)
function normalizeSubtipo(type) {
  if (!type) return 'otro';
  return type.toLowerCase().trim();
}

// Mapear status antiguo a estado nuevo
function mapStatus(oldStatus, verified) {
  if (verified === true) return 'publicado';
  if (oldStatus === 'active') return 'revision'; // Activo pero no verificado -> revisión
  if (oldStatus === 'inactive') return 'oculto';
  return 'revision';
}

// Mapear capacity_status
function mapCapacityStatus(old) {
  if (!old || old === '') return null;
  const map = {
    'open': 'abierto',
    'abierto': 'abierto',
    'filling': 'por_llenar',
    'full': 'colapsado',
    'colapsado': 'colapsado',
    'closed': 'cerrado',
    'cerrado': 'cerrado'
  };
  return map[old.toLowerCase()] || null;
}

// Formatear horario desde objeto a texto legible
function formatSchedule(schedule) {
  if (!schedule) return null;
  if (typeof schedule === 'string') return schedule;
  
  const { start, end, days } = schedule;
  if (!start && !end && !days) return null;
  
  let result = '';
  if (days) result += days;
  if (start || end) {
    if (result) result += ' | ';
    result += `${start || '?'} - ${end || '?'}`;
  }
  return result || null;
}

// Transformar un registro del JSON antiguo al formato nuevo
function transformRecord(old) {
  const categoria = TYPE_TO_CATEGORY[old.type?.toLowerCase()] || 'informacion';
  
  // Manejar lat/lng que pueden ser string o number
  const lat = parseFloat(old.lat);
  const lng = parseFloat(old.lng);
  
  // Saltar registros sin coordenadas válidas
  if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
    return null;
  }

  const newRecord = {
    // Campos base
    nombre: old.name || old.place || 'Sin nombre',
    latitud: lat,
    longitud: lng,
    direccion: old.address || null,
    ciudad: old.city || null,
    categoria: categoria,
    subtipo: normalizeSubtipo(old.type),
    contacto_principal: old.contact || null,
    contacto_nombre: null, // No existe en el JSON antiguo
    horario: formatSchedule(old.schedule),
    
    // Estado y verificación
    estado: mapStatus(old.status, old.verified),
    entidad_verificadora: old.verificator || null,
    fecha_verificacion: old.verified ? new Date().toISOString() : null,
    notas_internas: null,
    
    // Campos de acopio
    capacidad_estado: categoria === 'acopio' ? mapCapacityStatus(old.capacity_status) : null,
    necesidades_raw: old.info || null,
    necesidades_tags: Array.isArray(old.supplies_needed) && old.supplies_needed.length > 0 
      ? old.supplies_needed.map(s => s.toLowerCase().trim())
      : null,
    
    // Campos de solicitud_ayuda (no existen en el JSON antiguo)
    nombre_zona: null,
    habitado_actualmente: null,
    cantidad_ninos: null,
    cantidad_adultos: null,
    cantidad_ancianos: null,
    animales_detalle: null,
    riesgo_asbesto: null,
    logistica_llegada: null,
    requiere_voluntarios: null,
    urgencia: null
  };

  return newRecord;
}

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Uso: node migrate_data.js EMAIL PASSWORD');
    process.exit(1);
  }

  // 1. Leer JSON
  console.log('📂 Leyendo data1.json...');
  const jsonPath = join(__dirname, '..', 'src', 'data', 'data1.json');
  const rawData = JSON.parse(readFileSync(jsonPath, 'utf8'));
  console.log(`   Encontrados ${rawData.length} registros`);

  // 2. Autenticarse
  console.log('\n🔐 Autenticando en PocketBase...');
  const authResponse = await fetch(`${POCKETBASE_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: email, password })
  });

  if (!authResponse.ok) {
    console.error('❌ Error de autenticación');
    process.exit(1);
  }
  
  const authData = await authResponse.json();
  const token = authData.token;
  console.log('✅ Autenticado');

  // 3. Transformar y migrar
  console.log('\n🔄 Migrando registros...');
  
  let success = 0;
  let skipped = 0;
  let errors = 0;
  const errorDetails = [];

  for (const oldRecord of rawData) {
    const newRecord = transformRecord(oldRecord);
    
    if (!newRecord) {
      skipped++;
      console.log(`   ⏭️  Saltado (sin coordenadas): ${oldRecord.name || oldRecord.id}`);
      continue;
    }

    try {
      const response = await fetch(`${POCKETBASE_URL}/api/collections/puntos/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(newRecord)
      });

      if (response.ok) {
        success++;
        if (success % 20 === 0) {
          console.log(`   ✅ ${success} registros migrados...`);
        }
      } else {
        errors++;
        const err = await response.json();
        errorDetails.push({ name: oldRecord.name, error: err });
        console.log(`   ❌ Error: ${oldRecord.name} - ${JSON.stringify(err.data || err.message)}`);
      }
    } catch (e) {
      errors++;
      errorDetails.push({ name: oldRecord.name, error: e.message });
    }
  }

  // 4. Resumen
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN DE MIGRACIÓN');
  console.log('='.repeat(50));
  console.log(`✅ Exitosos:  ${success}`);
  console.log(`⏭️  Saltados:  ${skipped}`);
  console.log(`❌ Errores:   ${errors}`);
  console.log('='.repeat(50));

  if (errorDetails.length > 0 && errorDetails.length <= 10) {
    console.log('\nDetalles de errores:');
    errorDetails.forEach(e => console.log(`  - ${e.name}: ${JSON.stringify(e.error)}`));
  }

  console.log('\n🎉 Migración completada. Revisa el dashboard de PocketBase.');
}

main().catch(console.error);
