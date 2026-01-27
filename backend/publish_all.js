/**
 * Script para publicar todos los puntos en revisión
 */

const POCKETBASE_URL = 'http://127.0.0.1:8090';

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Uso: node publish_all.js EMAIL PASSWORD');
    process.exit(1);
  }

  // Autenticarse
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

  // Obtener todos los puntos en revisión
  console.log('\n📋 Obteniendo puntos en revisión...');
  const listResponse = await fetch(`${POCKETBASE_URL}/api/collections/puntos/records?perPage=500&filter=estado='revision'`, {
    headers: { 'Authorization': token }
  });
  
  const data = await listResponse.json();
  console.log(`   Encontrados: ${data.items?.length || 0} puntos`);

  if (!data.items || data.items.length === 0) {
    console.log('No hay puntos para publicar');
    return;
  }

  // Actualizar cada uno
  console.log('\n🚀 Publicando puntos...');
  let updated = 0;
  
  for (const punto of data.items) {
    const updateResponse = await fetch(`${POCKETBASE_URL}/api/collections/puntos/records/${punto.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({
        estado: 'publicado',
        entidad_verificadora: 'Migración inicial',
        fecha_verificacion: new Date().toISOString()
      })
    });

    if (updateResponse.ok) {
      updated++;
      if (updated % 20 === 0) {
        console.log(`   ✅ ${updated} publicados...`);
      }
    }
  }

  console.log(`\n🎉 Completado: ${updated} puntos publicados`);
}

main().catch(console.error);
