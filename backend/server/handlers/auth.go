package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/P1ngu-Dev/donde-ayudo-cl/backend/config"
	"github.com/P1ngu-Dev/donde-ayudo-cl/backend/database"
	"github.com/P1ngu-Dev/donde-ayudo-cl/backend/middleware"
	"github.com/P1ngu-Dev/donde-ayudo-cl/backend/models"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func Login(cfg *config.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var credentials models.UserLogin
		if err := json.NewDecoder(r.Body).Decode(&credentials); err != nil {
			http.Error(w, `{"error":"Invalid request body"}`, http.StatusBadRequest)
			return
		}

		if credentials.Email == "" || credentials.Password == "" {
			http.Error(w, `{"error":"Email and password are required"}`, http.StatusBadRequest)
			return
		}

		user, err := database.GetUserByEmail(credentials.Email)
		if err != nil {
			log.Printf("❌ Error obteniendo usuario: %v", err)
			http.Error(w, `{"error":"Internal server error"}`, http.StatusInternalServerError)
			return
		}
		if user == nil {
			log.Printf("⚠️ Usuario no encontrado: %s", credentials.Email)
			http.Error(w, `{"error":"Invalid credentials"}`, http.StatusUnauthorized)
			return
		}

		passwordHash, err := database.GetUserPasswordHash(credentials.Email)
		if err != nil {
			log.Printf("❌ Error obteniendo hash de contraseña: %v", err)
			http.Error(w, `{"error":"Internal server error"}`, http.StatusInternalServerError)
			return
		}

		err = bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(credentials.Password))
		if err != nil {
			http.Error(w, `{"error":"Invalid credentials"}`, http.StatusUnauthorized)
			return
		}

		claims := &middleware.Claims{
			UserID: user.ID,
			Email:  user.Email,
			Name:   user.Name,
			Rol:    user.Rol,
			RegisteredClaims: jwt.RegisteredClaims{
				ExpiresAt: jwt.NewNumericDate(time.Now().Add(cfg.JWTExpiry)),
				IssuedAt:  jwt.NewNumericDate(time.Now()),
			},
		}

		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		tokenString, err := token.SignedString([]byte(cfg.JWTSecret))
		if err != nil {
			http.Error(w, `{"error":"Error generating token"}`, http.StatusInternalServerError)
			return
		}

		response := models.LoginResponse{
			Token: tokenString,
			User:  user.ToResponse(),
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}

func Me(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		http.Error(w, `{"error":"Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	user, err := database.GetUserByID(userID)
	if err != nil || user == nil {
		http.Error(w, `{"error":"User not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user.ToResponse())
}

func Logout(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"message":"Logged out successfully"}`))
}

// ChangePassword permite a un usuario cambiar su contraseña actual
func ChangePassword(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		http.Error(w, `{"error":"Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req models.ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.CurrentPassword == "" || req.NewPassword == "" {
		http.Error(w, `{"error":"Current password and new password are required"}`, http.StatusBadRequest)
		return
	}

	if len(req.NewPassword) < 6 {
		http.Error(w, `{"error":"New password must be at least 6 characters"}`, http.StatusBadRequest)
		return
	}

	// Verificar contraseña actual
	currentHash, err := database.GetUserPasswordHashByID(userID)
	if err != nil {
		log.Printf("❌ Error obteniendo hash de contraseña: %v", err)
		http.Error(w, `{"error":"Internal server error"}`, http.StatusInternalServerError)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(currentHash), []byte(req.CurrentPassword))
	if err != nil {
		http.Error(w, `{"error":"Current password is incorrect"}`, http.StatusUnauthorized)
		return
	}

	// Generar nuevo hash
	newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("❌ Error generando hash de contraseña: %v", err)
		http.Error(w, `{"error":"Internal server error"}`, http.StatusInternalServerError)
		return
	}

	// Actualizar contraseña
	err = database.UpdateUserPassword(userID, string(newHash))
	if err != nil {
		log.Printf("❌ Error actualizando contraseña: %v", err)
		http.Error(w, `{"error":"Error updating password"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"message":"Password changed successfully"}`))
}

// ConfirmPassword permite confirmar/cambiar la contraseña temporal en el primer login
func ConfirmPassword(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	if userID == "" {
		http.Error(w, `{"error":"Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req models.ConfirmPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request body"}`, http.StatusBadRequest)
		return
	}

	user, err := database.GetUserByID(userID)
	if err != nil || user == nil {
		http.Error(w, `{"error":"User not found"}`, http.StatusNotFound)
		return
	}

	// Si quiere mantener la contraseña temporal
	if req.KeepTempPassword {
		err = database.ClearMustChangePassword(userID)
		if err != nil {
			log.Printf("❌ Error quitando flag de cambio de contraseña: %v", err)
			http.Error(w, `{"error":"Internal server error"}`, http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"message":"Password confirmed successfully"}`))
		return
	}

	// Si quiere cambiar la contraseña
	if req.NewPassword == "" {
		http.Error(w, `{"error":"New password is required"}`, http.StatusBadRequest)
		return
	}

	if len(req.NewPassword) < 6 {
		http.Error(w, `{"error":"New password must be at least 6 characters"}`, http.StatusBadRequest)
		return
	}

	// Generar nuevo hash
	newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("❌ Error generando hash de contraseña: %v", err)
		http.Error(w, `{"error":"Internal server error"}`, http.StatusInternalServerError)
		return
	}

	// Actualizar contraseña
	err = database.UpdateUserPassword(userID, string(newHash))
	if err != nil {
		log.Printf("❌ Error actualizando contraseña: %v", err)
		http.Error(w, `{"error":"Error updating password"}`, http.StatusInternalServerError)
		return
	}

	// Quitar el flag de cambio obligatorio
	err = database.ClearMustChangePassword(userID)
	if err != nil {
		log.Printf("❌ Error quitando flag de cambio de contraseña: %v", err)
		http.Error(w, `{"error":"Internal server error"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"message":"Password changed successfully"}`))
}
