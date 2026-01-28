package middleware

import (
	"net/http"

	"github.com/go-chi/cors"
)

func CORS() func(http.Handler) http.Handler {
	return cors.Handler(cors.Options{
		AllowedOrigins: []string{
			// Desarrollo local
			"http://localhost:*",
			"http://127.0.0.1:*",
			"http://localhost:5173",
			"http://localhost:8090",
			"http://localhost:8091",
			// Plataformas de hosting comunes
			"https://*.netlify.app",
			"https://*.vercel.app",
			"https://*.railway.app",
			"https://*.onrender.com",
			// Dominio de producción (actualizar con dominio real)
			"https://dondeayudo.cl",
			"https://www.dondeayudo.cl",
			"https://donde-ayudo.cl",
			"https://www.donde-ayudo.cl",
		},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Requested-With"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	})
}
