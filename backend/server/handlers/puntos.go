package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/P1ngu-Dev/donde-ayudo-cl/backend/database"
	"github.com/go-chi/chi/v5"
)

func GetPuntos(w http.ResponseWriter, r *http.Request) {
	categoria := r.URL.Query().Get("categoria")
	subtipo := r.URL.Query().Get("subtipo")
	ciudad := r.URL.Query().Get("ciudad")

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit < 1 || limit > 100 {
		limit = 50
	}

	response, err := database.GetPuntos(categoria, subtipo, ciudad, "publicado", page, limit)
	if err != nil {
		log.Printf("❌ Error en GetPuntos: %v", err)
		http.Error(w, `{"error":"Error fetching puntos"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func GetPunto(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	punto, err := database.GetPuntoByID(id)
	if err != nil {
		http.Error(w, `{"error":"Punto not found"}`, http.StatusNotFound)
		return
	}

	if punto.Estado != "publicado" {
		http.Error(w, `{"error":"Punto not found"}`, http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(punto)
}
