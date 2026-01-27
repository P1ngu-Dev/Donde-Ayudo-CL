package middleware

import (
	"net/http"
)

// RequireRole middleware que verifica que el usuario tenga uno de los roles permitidos
func RequireRole(allowedRoles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Obtener rol del contexto (seteado por RequireAuth)
			userRole := GetUserRole(r)

			if userRole == "" {
				http.Error(w, `{"error":"User role not found in context"}`, http.StatusUnauthorized)
				return
			}

			// Verificar si el rol está en la lista de roles permitidos
			hasPermission := false
			for _, role := range allowedRoles {
				if userRole == role {
					hasPermission = true
					break
				}
			}

			if !hasPermission {
				http.Error(w, `{"error":"Forbidden: insufficient permissions"}`, http.StatusForbidden)
				return
			}

			// Usuario tiene permisos, continuar
			next.ServeHTTP(w, r)
		})
	}
}
