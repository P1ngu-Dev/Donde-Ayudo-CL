package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/P1ngu-Dev/donde-ayudo-cl/backend/config"
	"github.com/P1ngu-Dev/donde-ayudo-cl/backend/database"
	"github.com/P1ngu-Dev/donde-ayudo-cl/backend/handlers"
	mw "github.com/P1ngu-Dev/donde-ayudo-cl/backend/middleware"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	// Banner
	printBanner()

	// Cargar configuración
	cfg := config.Load()
	log.Printf("🔧 Configuración cargada - Entorno: %s\n", cfg.Environment)

	// Conectar a base de datos
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("❌ Error conectando a la base de datos: %v", err)
	}
	defer db.Close()

	// Crear router
	r := chi.NewRouter()

	// Middleware global
	r.Use(middleware.Logger)    // Log de requests
	r.Use(middleware.Recoverer) // Recuperación de panics
	r.Use(mw.CORS())            // CORS para desarrollo

	// ==================== RUTAS PÚBLICAS ====================

	// API Routes
	r.Get("/api", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"message":"Donde Ayudo CL API v1.0","status":"running"}`))
	})

	r.Get("/api/puntos", handlers.GetPuntos)
	r.Get("/api/puntos/{id}", handlers.GetPunto)

	// ==================== AUTH ====================
	r.Post("/api/auth/login", handlers.Login(cfg))

	// Rutas protegidas de auth
	r.Group(func(r chi.Router) {
		r.Use(mw.RequireAuth(cfg))
		r.Get("/api/auth/me", handlers.Me)
		r.Post("/api/auth/logout", handlers.Logout)
		r.Post("/api/auth/change-password", handlers.ChangePassword)
		r.Post("/api/auth/confirm-password", handlers.ConfirmPassword)
	})

	// ==================== ADMIN (Requiere autenticación) ====================
	r.Route("/api/admin", func(r chi.Router) {
		// Middleware: todas las rutas admin requieren auth
		r.Use(mw.RequireAuth(cfg))

		// --- PUNTOS ---
		// GET /api/admin/puntos - Ver todos los puntos (verificador, admin, superadmin)
		r.With(mw.RequireRole("verificador", "admin", "superadmin")).Get("/puntos", handlers.GetAdminPuntos)

		// POST /api/admin/puntos - Crear punto (admin, superadmin)
		r.With(mw.RequireRole("admin", "superadmin")).Post("/puntos", handlers.CreatePunto)

		// PATCH /api/admin/puntos/:id - Actualizar punto (admin, superadmin)
		r.With(mw.RequireRole("admin", "superadmin")).Patch("/puntos/{id}", handlers.UpdatePunto)

		// PATCH /api/admin/puntos/:id/estado - Cambiar estado (verificador, admin, superadmin)
		r.With(mw.RequireRole("verificador", "admin", "superadmin")).Patch("/puntos/{id}/estado", handlers.UpdatePuntoEstado)

		// DELETE /api/admin/puntos/:id - Eliminar punto (superadmin)
		r.With(mw.RequireRole("superadmin")).Delete("/puntos/{id}", handlers.DeletePunto)

		// --- USUARIOS ---
		// GET /api/admin/users - Listar usuarios (admin, superadmin)
		r.With(mw.RequireRole("admin", "superadmin")).Get("/users", handlers.GetUsers)

		// POST /api/admin/users - Crear usuario (superadmin)
		r.With(mw.RequireRole("superadmin")).Post("/users", handlers.CreateUser)

		// PATCH /api/admin/users/:id/rol - Cambiar rol de usuario (superadmin)
		r.With(mw.RequireRole("superadmin")).Patch("/users/{id}/rol", handlers.UpdateUserRol)

		// PATCH /api/admin/users/:id/toggle-active - Activar/desactivar usuario (superadmin)
		r.With(mw.RequireRole("superadmin")).Patch("/users/{id}/toggle-active", handlers.ToggleUserActive)
	})

	// ==================== FRONTEND ESTÁTICO ====================
	// Servir archivos estáticos del frontend
	staticDir := os.Getenv("STATIC_DIR")
	if staticDir == "" {
		staticDir = "./public" // Default para desarrollo local
	}

	// Verificar si existe el directorio
	if _, err := os.Stat(staticDir); err == nil {
		log.Printf("📁 Sirviendo frontend desde: %s\n", staticDir)

		// FileServer para assets
		fs := http.FileServer(http.Dir(staticDir))

		r.Get("/*", func(w http.ResponseWriter, r *http.Request) {
			// Si el archivo existe, servirlo
			path := filepath.Join(staticDir, r.URL.Path)
			if _, err := os.Stat(path); err == nil {
				fs.ServeHTTP(w, r)
				return
			}

			// Si no existe, servir index.html (SPA fallback)
			http.ServeFile(w, r, filepath.Join(staticDir, "index.html"))
		})
	} else {
		log.Printf("⚠️  Directorio de frontend no encontrado: %s (solo API)\n", staticDir)
		r.Get("/", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"message":"Donde Ayudo CL API v1.0","status":"running","mode":"api-only"}`))
		})
	}

	//

	// Iniciar servidor
	addr := ":" + cfg.Port
	log.Printf("\n🚀 Servidor iniciado en http://localhost%s\n", addr)
	log.Printf("📍 API Pública:  http://localhost%s/api/puntos\n", addr)
	log.Printf("🔐 Login:        http://localhost%s/api/auth/login\n", addr)
	log.Printf("👤 Admin API:    http://localhost%s/api/admin/puntos\n\n", addr)

	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("❌ Error iniciando servidor: %v", err)
	}
}

func printBanner() {
	banner := `
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║          🗺️  DONDE AYUDO CL - Backend API Server  🇨🇱          ║
║                                                                ║
║          Stack: Go + SQLite + JWT                             ║
║          Version: 1.0.0                                       ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`
	log.Println(banner)
}
