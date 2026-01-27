/**
 * Script para crear las colecciones en PocketBase v0.25+
 * Usa el formato correcto de "fields" en lugar de "schema"
 */

const POCKETBASE_URL = 'http://127.0.0.1:8090';

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Uso: node create_collections_v2.js EMAIL PASSWORD');
    process.exit(1);
  }

  // 1. Autenticarse
  console.log('🔐 Autenticando...');
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

  // 2. Crear colección "puntos" con formato correcto v0.25+
  console.log('\n📍 Creando colección "puntos"...');
  
  const puntosCollection = {
    name: "puntos",
    type: "base",
    listRule: "",      // Público para listar
    viewRule: "",      // Público para ver
    createRule: null,  // Solo admins
    updateRule: null,  // Solo admins
    deleteRule: null,  // Solo admins
    fields: [
      { name: "nombre", type: "text", required: true },
      { name: "latitud", type: "number", required: true },
      { name: "longitud", type: "number", required: true },
      { name: "direccion", type: "text", required: false },
      { name: "ciudad", type: "text", required: false },
      { 
        name: "categoria", 
        type: "select", 
        required: true,
        values: ["informacion", "acopio", "solicitud_ayuda"],
        maxSelect: 1
      },
      { name: "subtipo", type: "text", required: false },
      { name: "contacto_principal", type: "text", required: false },
      { name: "contacto_nombre", type: "text", required: false },
      { name: "horario", type: "text", required: false },
      { 
        name: "estado", 
        type: "select", 
        required: true,
        values: ["publicado", "revision", "oculto", "rechazado"],
        maxSelect: 1
      },
      { name: "entidad_verificadora", type: "text", required: false },
      { name: "fecha_verificacion", type: "date", required: false },
      { name: "notas_internas", type: "editor", required: false },
      { 
        name: "capacidad_estado", 
        type: "select", 
        required: false,
        values: ["abierto", "por_llenar", "colapsado", "cerrado"],
        maxSelect: 1
      },
      { name: "necesidades_raw", type: "text", required: false },
      { name: "necesidades_tags", type: "json", required: false },
      { name: "nombre_zona", type: "text", required: false },
      { name: "habitado_actualmente", type: "bool", required: false },
      { name: "cantidad_ninos", type: "number", required: false },
      { name: "cantidad_adultos", type: "number", required: false },
      { name: "cantidad_ancianos", type: "number", required: false },
      { name: "animales_detalle", type: "text", required: false },
      { name: "riesgo_asbesto", type: "bool", required: false },
      { 
        name: "evidencia_fotos", 
        type: "file", 
        required: false, 
        maxSelect: 10, 
        maxSize: 5242880, 
        mimeTypes: ["image/jpeg", "image/png", "image/webp"]
      },
      { name: "logistica_llegada", type: "text", required: false },
      { name: "requiere_voluntarios", type: "bool", required: false },
      { 
        name: "urgencia", 
        type: "select", 
        required: false,
        values: ["baja", "media", "alta", "critica"],
        maxSelect: 1
      }
    ]
  };

  const puntosResponse = await fetch(`${POCKETBASE_URL}/api/collections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    },
    body: JSON.stringify(puntosCollection)
  });

  if (puntosResponse.ok) {
    console.log('✅ Colección "puntos" creada');
  } else {
    const error = await puntosResponse.json();
    console.error('❌ Error creando "puntos":', JSON.stringify(error, null, 2));
  }

  // 3. Verificar campos
  console.log('\n🔍 Verificando campos creados...');
  const verifyResponse = await fetch(`${POCKETBASE_URL}/api/collections/puntos`, {
    headers: { 'Authorization': token }
  });
  
  if (verifyResponse.ok) {
    const collection = await verifyResponse.json();
    console.log(`   Campos encontrados: ${collection.fields?.length || 0}`);
    if (collection.fields) {
      collection.fields.forEach(f => console.log(`   - ${f.name} (${f.type})`));
    }
  }

  console.log('\n🎉 Proceso completado!');
}

main().catch(console.error);
