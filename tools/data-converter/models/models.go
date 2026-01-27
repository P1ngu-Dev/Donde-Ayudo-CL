package models

import "time"

// CSVRecord representa una fila del CSV de entrada
type CSVRecord struct {
	Espacio     string `csv:"Espacio"`
	Tipo        string `csv:"TIPO"`
	Comuna      string `csv:"COMUNA"`
	Direccion   string `csv:"DIRECCIÓN"`
	MasInfo     string `csv:"MÁS INFO"`
	HorarioInit string `csv:"Horario de Inicio"`
	HorarioFin  string `csv:"Horario de fin"`
	Dias        string `csv:"Dias (ordenar columnas) (Semana del 19)"`
	Contacto    string `csv:"CONTACTO"`
}

// Schedule representa los horarios de atención
type Schedule struct {
	Start string `json:"start"`
	End   string `json:"end"`
	Days  string `json:"days"`
}

// Location representa un lugar de ayuda
type Location struct {
	ID             string   `json:"id"`
	Name           string   `json:"name"`
	Type           string   `json:"type"`
	Lat            *float64 `json:"lat"`
	Lng            *float64 `json:"lng"`
	City           string   `json:"city"`
	Address        string   `json:"address"`
	Place          string   `json:"place"`
	Status         string   `json:"status"`
	CapacityStatus string   `json:"capacity_status"`
	SuppliesNeeded []string `json:"supplies_needed"`
	Info           string   `json:"info"`
	Schedule       Schedule `json:"schedule"`
	CreatedAt      string   `json:"created_at"`
	UpdatedAt      string   `json:"updated_at"`
	Contact        string   `json:"contact"`
	Verified       bool     `json:"verified"`
	Verificator    string   `json:"verificator"`
}

// GeoCache representa una entrada en el caché de geocodificación
type GeoCache struct {
	Address   string
	Lat       float64
	Lng       float64
	Timestamp time.Time
}

// Config representa la configuración del conversor
type Config struct {
	InputFile      string
	OutputFile     string
	CacheFile      string
	RateLimit      time.Duration
	Workers        int
	GeoProvider    string
	ForceRefresh   bool
	SkipGeocoding  bool
	DefaultCountry string
	Verbose        bool
	UseCache       bool
}
