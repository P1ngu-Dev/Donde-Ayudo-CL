#!/bin/bash
cd /home/pingu/Proyectos/Donde-Ayudo-CL/backend/server/database

# Reemplazar datetime('now') con NOW()
sed -i "s/datetime('now')/NOW()/g" puntos.go users.go

# users.go - reemplazos más complejos
sed -i 's/VALUES (?, ?, ?, ?, ?, ?, FALSE, TRUE, TRUE, NOW(), NOW(), ?)/VALUES ($1, $2, $3, $4, $5, $6, FALSE, TRUE, TRUE, NOW(), NOW(), $7)/g' users.go

echo "✅ Archivos actualizados"
