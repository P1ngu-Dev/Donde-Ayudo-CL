package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/P1ngu-Dev/donde-ayudo-cl/backend/database"
	"github.com/P1ngu-Dev/donde-ayudo-cl/backend/middleware"
	"github.com/P1ngu-Dev/donde-ayudo-cl/backend/models"
	"github.com/go-chi/chi/v5"
	"golang.org/x/crypto/bcrypt"
)

func GetAdminPuntos(w http.ResponseWriter, r *http.Request) {
	categoria := r.URL.Query().Get("categoria")
	subtipo := r.URL.Query().Get("subtipo")
	ciudad := r.URL.Query().Get("ciudad")
	estado := r.URL.Query().Get("estado")

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 || limit > 100 {
		limit = 50
	}

	response, err := database.GetPuntos(categoria, subtipo, ciudad, estado, page, limit)
	if err != nil {
		http.Error(w, `{"error":"Error fetching puntos"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func CreatePunto(w http.ResponseWriter, r *http.Request) {
	var req models.PuntoCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Nombre == "" || req.Latitud == 0 || req.Longitud == 0 || req.Categoria == "" {
		http.Error(w, `{"error":"Missing required fields"}`, http.StatusBadRequest)
		return
	}

	userID := middleware.GetUserID(r)

	punto, err := database.CreatePunto(req, userID)
	if err != nil {
		http.Error(w, `{"error":"Error creating punto"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(punto)
}

func UpdatePunto(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req models.PuntoUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request body"}`, http.StatusBadRequest)
		return
	}

	punto, err := database.UpdatePunto(id, req)
	if err != nil {
		http.Error(w, `{"error":"Error updating punto"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(punto)
}

func UpdatePuntoEstado(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req models.EstadoUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request body"}`, http.StatusBadRequest)
		return
	}

	validEstados := map[string]bool{
		"publicado": true,
		"revision":  true,
		"oculto":    true,
		"rechazado": true,
	}
	if !validEstados[req.Estado] {
		http.Error(w, `{"error":"Invalid estado value"}`, http.StatusBadRequest)
		return
	}

	userID := middleware.GetUserID(r)

	punto, err := database.UpdatePuntoEstado(id, req.Estado, userID)
	if err != nil {
		http.Error(w, `{"error":"Error updating estado"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(punto)
}

func DeletePunto(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	err := database.DeletePunto(id)
	if err != nil {
		http.Error(w, `{"error":"Error deleting punto"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"message":"Punto deleted successfully"}`))
}

func GetUsers(w http.ResponseWriter, r *http.Request) {
	users, err := database.GetUsers()
	if err != nil {
		http.Error(w, `{"error":"Error fetching users"}`, http.StatusInternalServerError)
		return
	}

	responses := make([]models.UserResponse, len(users))
	for i, user := range users {
		responses[i] = user.ToResponse()
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(responses)
}

func CreateUser(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email        string `json:"email"`
		Name         string `json:"name"`
		Password     string `json:"password"`
		Rol          string `json:"rol"`
		Organizacion string `json:"organizacion"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error":"Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Name == "" || req.Password == "" || req.Rol == "" {
		http.Error(w, `{"error":"Missing required fields"}`, http.StatusBadRequest)
		return
	}

	validRoles := map[string]bool{
		"superadmin":  true,
		"admin":       true,
		"verificador": true,
	}
	if !validRoles[req.Rol] {
		http.Error(w, `{"error":"Invalid rol value"}`, http.StatusBadRequest)
		return
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, `{"error":"Error hashing password"}`, http.StatusInternalServerError)
		return
	}

	user, err := database.CreateUser(req.Email, req.Name, string(passwordHash), req.Rol, req.Organizacion)
	if err != nil {
		http.Error(w, `{"error":"Error creating user"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user.ToResponse())
}
