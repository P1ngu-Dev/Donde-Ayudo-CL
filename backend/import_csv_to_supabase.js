#!/usr/bin/env node

/**
 * Script de Importación: CSV AppSheet → PostgreSQL (Supabase)
 * 
 * Este script lee el CSV de AppSheet y lo importa a Supabase,
 * parseando todos los campos complejos (georeferencia, emojis, arrays)
 */

const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { createClient } = require('@supabase/supabase-js');

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const SUPABASE_URL = process.env.DATABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'your-anon-key';
const CSV_FILE = './src/data/BD appsheet - Formulario.csv';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============================================================================
// FUNCIONES DE PARSEO
// ============================================================================

/**
 * Parsear georeferencia: "-36.738972, -72.993188" → {lat, lng}
 */
function parseGeoReferencia(georef) {
  if (!georef || georef.trim() === '') return null;
  
  const coords = georef.split(',').map(s => parseFloat(s.trim()));
  if (coords.length !== 2 || coords.some(isNaN)) return null;
  
  return {
    latitud: coords[0],
    longitud: coords[1]
  };
}

/**
 * Parsear nivel de urgencia
 */
function parseNivelUrgencia(nivel) {
  if (!nivel) return null;
  
  const map = {
    '🔴 Crítico (< 6 horas)': 'critico',
    '🟠 Alto (< 12 horas)': 'alto',
    '🟡 Medio (< 24 horas)': 'medio',
    '🟢 Bajo (> 24 horas)': 'bajo'
  };
  
  return map[nivel] || null;
}

/**
 * Parsear tipos de acceso
 */
function parseTiposAcceso(ruta) {
  if (!ruta) return null;
  
  const map = {
    '🚗 Auto Común': 'auto',
    '🚙 Camioneta / 4x4': '4x4',
    '👷 Carretilla / A pie': 'pie',
    '🚚 Camión 3/4': 'camion',
    '🚛 Camión Grande': 'camion_grande'
  };
  
  const tipos = ruta.split(',')
    .map(s => s.trim())
    .map(s => map[s])
    .filter(Boolean);
  
  return tipos.length > 0 ? tipos : null;
}

/**
 * Parsear categorías de ayuda
 */
function parseCategoriasAyuda(ayuda) {
  if (!ayuda) return null;
  
  const map = {
    '🚑 Salud y Primeros Auxilios': 'salud',
    '🧠 Apoyo Psicosocial': 'psicosocial',
    '💧 Agua y Alimentos': 'agua_alimentos',
    '🛠️ Herramientas y Despeje': 'herramientas',
    '⛺ Techo y Abrigo': 'techo',
    '🍼 Cuidado Infantil': 'infantil',
    '👴 Adulto Mayor': 'adulto_mayor',
    '🐾 Atención Veterinaria': 'veterinaria',
    '🦴 Alimento Mascotas': 'alimento_mascotas',
    '🏗️ Reconstrucción': 'reconstruccion'
  };
  
  const categorias = ayuda.split(',')
    .map(s => s.trim())
    .map(s => map[s])
    .filter(Boolean);
  
  return categorias.length > 0 ? categorias : null;
}

/**
 * Parsear lista de items con emojis
 */
function parseListaItems(texto) {
  if (!texto) return null;
  
  // Remover emojis y normalizar
  const items = texto.split(',')
    .map(s => s.trim())
    .map(s => s.replace(/[^\w\s]/gi, '').trim())
    .filter(Boolean);
  
  return items.length > 0 ? items : null;
}

/**
 * Parsear presencia de asbesto
 */
function parseAsbesto(valor) {
  if (!valor) return 'no_se';
  
  const v = valor.toLowerCase();
  if (v === 'sí' || v === 'si') return 'si';
  if (v === 'no') return 'no';
  return 'no_se';
}

/**
 * Parsear boolean de checkbox
 */
function parseBoolean(valor) {
  if (!valor) return false;
  const v = valor.trim().toLowerCase();
  return v === '✅ si' || v === 'si' || v === 'sí' || v === 'true';
}

/**
 * Parsear estado del registro
 */
function parseEstado(estado) {
  if (!estado) return 'activo';
  
  const map = {
    'ACTIVO': 'activo',
    'ELIMINADO': 'eliminado',
    'PENDIENTE': 'pendiente'
  };
  
  return map[estado.toUpperCase()] || 'activo';
}

/**
 * Construir objeto necesidades_tags
 */
function buildNecesidadesTags(row) {
  const tags = {};
  
  // Medicamentos
  if (row.Medicamentos) {
    tags.medicamentos = row.Medicamentos.trim();
  }
  
  // Olla común
  if (row['Olla comun']) {
    tags.olla_comun = parseBoolean(row['Olla comun']);
  }
  
  // Alimentos
  const alimentos = parseListaItems(row.Alimentos);
  if (alimentos) {
    tags.alimentos = alimentos;
  }
  
  // Herramientas
  const herramientas = parseListaItems(row.Herramientas);
  if (herramientas) {
    tags.herramientas = herramientas;
  }
  
  // Techo y abrigo
  const techo = parseListaItems(row['Techo y abrigo']);
  if (techo) {
    tags.techo_abrigo = techo;
  }
  
  // Animales
  const animales = parseListaItems(row.Animales);
  if (animales) {
    tags.animales = animales;
  }
  
  return Object.keys(tags).length > 0 ? tags : null;
}

/**
 * Parsear fotos (pueden ser múltiples separadas por coma)
 */
function parseFotos(foto) {
  if (!foto) return null;
  
  const urls = foto.split(',')
    .map(s => s.trim())
    .filter(Boolean);
  
  return urls.length > 0 ? urls : null;
}

/**
 * Parsear fecha "22/01/2026 10:15:09" → ISO timestamp
 */
function parseFecha(fecha) {
  if (!fecha) return new Date().toISOString();
  
  try {
    const [datePart, timePart] = fecha.split(' ');
    const [day, month, year] = datePart.split('/');
    const [hour, minute, second] = timePart ? timePart.split(':') : ['00', '00', '00'];
    
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour}:${minute}:${second}Z`;
    return isoDate;
  } catch (error) {
    console.error(`Error parseando fecha: ${fecha}`, error);
    return new Date().toISOString();
  }
}

// ============================================================================
// FUNCIÓN PRINCIPAL DE IMPORTACIÓN
// ============================================================================

async function importCSV() {
  console.log('📂 Leyendo CSV...');
  
  // Leer archivo CSV
  const fileContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  
  console.log(`📊 Total de registros: ${records.length}`);
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const row of records) {
    try {
      // Parsear georeferencia
      const coords = parseGeoReferencia(row.georeferencia);
      
      // Saltar si no hay coordenadas
      if (!coords) {
        console.log(`⚠️  Saltando registro ${row.id}: Sin georeferencia`);
        skipped++;
        continue;
      }
      
      // Construir objeto para insertar
      const punto = {
        id: row.id || `import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        nombre: row['Nombre zona'] || 'Zona sin nombre',
        latitud: coords.latitud,
        longitud: coords.longitud,
        
        // Clasificación
        categorias_ayuda: parseCategoriasAyuda(row['Que ayuda se necesita?']),
        
        // Urgencia
        nivel_urgencia: parseNivelUrgencia(row.Nivel_Urgencia),
        
        // Contacto
        contacto_principal: row.Contacto || null,
        
        // Estado
        estado: parseEstado(row.Estado_Registro),
        
        // Observaciones (privadas)
        notas_internas: row['Observaciones ¿Hay algo que faltó por preguntar?'] || null,
        
        // Necesidades
        necesidades_raw: row['Que ayuda se necesita?'] || null,
        necesidades_tags: buildNecesidadesTags(row),
        
        // Detalles demográficos
        habitado_actualmente: parseBoolean(row['Hay damnificados habitando la zona?']),
        cantidad_ninos: parseInt(row['Numero niños']) || 0,
        cantidad_adolescentes: parseInt(row['Numero adolecentes']) || 0,
        cantidad_adultos: parseInt(row['Numero adultos']) || 0,
        cantidad_ancianos: parseInt(row['Numero adulto mayor']) || 0,
        
        // Riesgos
        riesgo_asbesto: parseAsbesto(row.Presencia_Asbesto),
        foto_asbesto: row.Foto_Asbesto || null,
        fallecidos_reportados: row.Muertos && row.Muertos.toLowerCase() === 'sí',
        
        // Logística
        logistica_llegada: row['ruta para llegar'] || null,
        tipos_acceso: parseTiposAcceso(row['ruta para llegar']),
        
        // Infraestructura
        tiene_banos: parseBoolean(row.Baños),
        tiene_electricidad: parseBoolean(row.Electricidad),
        tiene_senal: parseBoolean(row.Señal),
        
        // Evidencia
        evidencia_fotos: parseFotos(row.Foto),
        archivo_kml: row.Archivo_Ruta_KML || null,
        
        // Metadata
        created: parseFecha(row['Fecha y hora']),
        created_by: row.Quien_Ingreso || null
      };
      
      // Insertar en Supabase
      const { error } = await supabase
        .from('puntos')
        .upsert(punto, { onConflict: 'id' });
      
      if (error) {
        console.error(`❌ Error insertando ${punto.id}:`, error.message);
        errors++;
      } else {
        console.log(`✅ Importado: ${punto.nombre} (${punto.id})`);
        imported++;
      }
      
    } catch (error) {
      console.error(`❌ Error procesando registro:`, error);
      errors++;
    }
  }
  
  console.log('\n📈 RESUMEN:');
  console.log(`  ✅ Importados: ${imported}`);
  console.log(`  ⚠️  Saltados: ${skipped}`);
  console.log(`  ❌ Errores: ${errors}`);
}

// ============================================================================
// EJECUTAR
// ============================================================================

importCSV()
  .then(() => {
    console.log('\n✅ Importación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
