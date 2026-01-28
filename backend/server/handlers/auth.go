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
