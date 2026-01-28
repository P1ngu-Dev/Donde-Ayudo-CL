#!/bin/bash
# Script de prueba rápida de integración Frontend + Backend

API_URL="http://localhost:8091"
FRONTEND_URL="http://localhost:5175"

echo "🧪 Probando integración Donde-Ayudo CL"
echo "========================================"
echo ""

# 1. Verificar backend está corriendo
echo "1️⃣ Verificando backend Go..."
if curl -s "${API_URL}/" > /dev/null; then
    echo "✅ Backend respondiendo en ${API_URL}"
else
    echo "❌ Backend no responde. Iniciar con: cd backend/server && PORT=8091 ./donde-ayudo-server"
    exit 1
fi

# 2. Probar API pública de puntos
echo ""
echo "2️⃣ Probando API pública /api/puntos..."
PUNTOS=$(curl -s "${API_URL}/api/puntos?limit=1" | jq -r '.total')
if [ "$PUNTOS" -gt 0 ]; then
    echo "✅ API pública funciona: ${PUNTOS} puntos disponibles"
else
    echo "❌ Error en API pública"
    exit 1
fi

# 3. Probar login
echo ""
echo "3️⃣ Probando login admin..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"super@donde-ayudo.cl","password":"admin123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
    echo "✅ Login exitoso, token obtenido"
else
    echo "❌ Error en login"
    echo "$LOGIN_RESPONSE" | jq .
    exit 1
fi

# 4. Probar endpoint autenticado
echo ""
echo "4️⃣ Probando endpoint autenticado /api/auth/me..."
ME_RESPONSE=$(curl -s "${API_URL}/api/auth/me" -H "Authorization: Bearer ${TOKEN}")
USER_EMAIL=$(echo "$ME_RESPONSE" | jq -r '.email')
if [ "$USER_EMAIL" == "super@donde-ayudo.cl" ]; then
    echo "✅ Autenticación funciona correctamente"
    echo "   Usuario: $(echo "$ME_RESPONSE" | jq -r '.name')"
    echo "   Rol: $(echo "$ME_RESPONSE" | jq -r '.rol')"
else
    echo "❌ Error en autenticación"
    exit 1
fi

# 5. Probar endpoint admin
echo ""
echo "5️⃣ Probando endpoint admin /api/admin/puntos..."
ADMIN_RESPONSE=$(curl -s "${API_URL}/api/admin/puntos?limit=2" -H "Authorization: Bearer ${TOKEN}")
ADMIN_PUNTOS=$(echo "$ADMIN_RESPONSE" | jq -r '.total')
if [ "$ADMIN_PUNTOS" -gt 0 ]; then
    echo "✅ API admin funciona: ${ADMIN_PUNTOS} puntos totales"
else
    echo "❌ Error en API admin"
    exit 1
fi

# 6. Verificar frontend
echo ""
echo "6️⃣ Verificando frontend..."
if curl -s "${FRONTEND_URL}/" | grep -q "Donde Ayudo"; then
    echo "✅ Frontend respondiendo en ${FRONTEND_URL}"
else
    echo "⚠️ Frontend no responde o no cargó correctamente"
    echo "   Iniciar con: npm run dev"
fi

echo ""
echo "========================================"
echo "✅ Todas las pruebas pasaron correctamente"
echo ""
echo "📝 Credenciales de prueba:"
echo "   • Email: super@donde-ayudo.cl"
echo "   • Email: admin@donde-ayudo.cl"
echo "   • Email: verificador@donde-ayudo.cl"
echo "   • Password (todos): admin123"
echo ""
echo "🔗 URLs:"
echo "   • Mapa público: ${FRONTEND_URL}/"
echo "   • Admin panel: ${FRONTEND_URL}/admin.html"
echo "   • API: ${API_URL}/api/puntos"
