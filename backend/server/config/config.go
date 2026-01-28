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
	DatabaseURL string
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

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		databaseURL = "postgres://localhost:5432/donde_ayudo?sslmode=disable"
		log.Println("⚠️  Usando DATABASE_URL por defecto. Configura DATABASE_URL en producción!")
	}

	env := os.Getenv("ENVIRONMENT")
	if env == "" {
		env = "development"
	}

	return &Config{
		Port:        port,
		JWTSecret:   jwtSecret,
		JWTExpiry:   24 * time.Hour,
		DatabaseURL: databaseURL,
		Environment: env,
	}
}
