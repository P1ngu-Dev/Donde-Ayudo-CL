/**
 * Script para crear las colecciones en PocketBase
 * Ejecutar con: node backend/create_collections.js EMAIL PASSWORD
 */

const POCKETBASE_URL = 'http://127.0.0.1:8090';

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Uso: node create_collections.js EMAIL PASSWORD');
    console.error('Ejemplo: node create_collections.js admin@dondeayudo.cl mipassword123');
    process.exit(1);
  }

  // 1. Autenticarse como superadmin (PocketBase v0.25+)
  console.log('🔐 Autenticando...');
  
  // En PocketBase 0.25+, superusers están en _superusers
  const authResponse = await fetch(`${POCKETBASE_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: email, password })
  });

  if (!authResponse.ok) {
    const errorData = await authResponse.text();
    console.error('❌ Error de autenticación:', errorData);
    console.error('Verifica que el email y contraseña sean correctos.');
    process.exit(1);
  }
  
  const authData = await authResponse.json();
  const token = authData.token;
  console.log('✅ Autenticado correctamente');

  // 2. Crear colección "puntos"
  console.log('\n📍 Creando colección "puntos"...');
  
  const puntosCollection = {
    name: "puntos",
    type: "base",
    schema: [
      { name: "nombre", type: "text", required: true },
      { name: "latitud", type: "number", required: true },
      { name: "longitud", type: "number", required: true },
      { name: "direccion", type: "text", required: false },
      { name: "ciudad", type: "text", required: false },
      { name: "categoria", type: "select", required: true, options: { maxSelect: 1, values: ["informacion", "acopio", "solicitud_ayuda"] } },
      { name: "subtipo", type: "text", required: false },
      { name: "contacto_principal", type: "text", required: false },
      { name: "contacto_nombre", type: "text", required: false },
      { name: "horario", type: "text", required: false },
      { name: "estado", type: "select", required: true, options: { maxSelect: 1, values: ["publicado", "revision", "oculto", "rechazado"] } },
      { name: "entidad_verificadora", type: "text", required: false },
      { name: "fecha_verificacion", type: "date", required: false },
      { name: "notas_internas", type: "editor", required: false },
      { name: "capacidad_estado", type: "select", required: false, options: { maxSelect: 1, values: ["abierto", "por_llenar", "colapsado", "cerrado"] } },
      { name: "necesidades_raw", type: "text", required: false },
      { name: "necesidades_tags", type: "json", required: false },
      { name: "nombre_zona", type: "text", required: false },
      { name: "habitado_actualmente", type: "bool", required: false },
      { name: "cantidad_ninos", type: "number", required: false },
      { name: "cantidad_adultos", type: "number", required: false },
      { name: "cantidad_ancianos", type: "number", required: false },
      { name: "animales_detalle", type: "text", required: false },
      { name: "riesgo_asbesto", type: "bool", required: false },
      { name: "evidencia_fotos", type: "file", required: false, options: { maxSelect: 10, maxSize: 5242880, mimeTypes: ["image/jpeg", "image/png", "image/webp"] } },
      { name: "logistica_llegada", type: "text", required: false },
      { name: "requiere_voluntarios", type: "bool", required: false },
      { name: "urgencia", type: "select", required: false, options: { maxSelect: 1, values: ["baja", "media", "alta", "critica"] } }
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
    console.error('❌ Error creando "puntos":', error);
  }

  // 3. Crear colección "solicitudes_externas"
  console.log('\n📥 Creando colección "solicitudes_externas"...');
  
  const solicitudesCollection = {
    name: "solicitudes_externas",
    type: "base",
    schema: [
      { name: "origen", type: "text", required: false },
      { name: "datos_brutos", type: "json", required: true },
      { name: "procesado", type: "bool", required: false }
    ]
  };

  const solicitudesResponse = await fetch(`${POCKETBASE_URL}/api/collections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    },
    body: JSON.stringify(solicitudesCollection)
  });

  if (solicitudesResponse.ok) {
    console.log('✅ Colección "solicitudes_externas" creada');
  } else {
    const error = await solicitudesResponse.json();
    console.error('❌ Error creando "solicitudes_externas":', error);
  }

  console.log('\n🎉 ¡Proceso completado! Revisa el dashboard de PocketBase.');
}

main().catch(console.error);
