#!/bin/bash

# Script para configurar el backend Go de Donde Ayudo CL
# Este script crea todos los archivos necesarios del backend

set -e

echo "🚀 Configurando backend Go..."

# Crear los archivos uno por uno usando heredoc
# ===== CONFIG =====
cat > config/config.go << 'EOF'
package config

import (
	"log"
	"os"
	"time"
)

type Config struct {
	Port        string
	JWTSecret   string
	JWTExpiry   time.Duration
	DBPath      string
	Environment string
}

func Load() *Config {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "change-this-secret-in-production-12345"
		log.Println("⚠️  Usando JWT_SECRET por defecto. Configura JWT_SECRET env var en producción!")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8090"
	}

	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "../pb_data/data.db"
	}

	env := os.Getenv("ENVIRONMENT")
	if env == "" {
		env = "development"
	}

	return &Config{
		Port:        port,
		JWTSecret:   jwtSecret,
		JWTExpiry:   24 * time.Hour,
		DBPath:      dbPath,
		Environment: env,
	}
}
EOF

echo "✅ config/config.go creado"

# Ejecutar go build
echo "🔨 Compilando..."
go build -o donde-ayudo-server

echo "✨ ¡Backend configurado exitosamente!"
echo "📝 Para ejecutar: ./donde-ayudo-server"
