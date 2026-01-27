package geocoding

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/P1ngu-Dev/donde-ayudo-cl/tools/data-converter/models"
	"github.com/codingsince1985/geo-golang"
	"github.com/codingsince1985/geo-golang/openstreetmap"
	"golang.org/x/time/rate"
)

// Service maneja la geocodificación con caché y rate limiting
type Service struct {
	geocoder       geo.Geocoder
	cache          map[string]*models.GeoCache
	cacheMutex     sync.RWMutex
	limiter        *rate.Limiter
	cacheFile      string
	verbose        bool
	defaultCountry string
}

// NewService crea un nuevo servicio de geocodificación
func NewService(config *models.Config) (*Service, error) {
	// Crear geocoder (por ahora solo OpenStreetMap/Nominatim)
	geocoder := openstreetmap.Geocoder()

	// Configurar rate limiter (1 request por segundo para Nominatim)
	limiter := rate.NewLimiter(rate.Every(config.RateLimit), 1)

	service := &Service{
		geocoder:       geocoder,
		cache:          make(map[string]*models.GeoCache),
		limiter:        limiter,
		cacheFile:      config.CacheFile,
		verbose:        config.Verbose,
		defaultCountry: config.DefaultCountry,
	}

	// Cargar caché si existe
	if config.UseCache && !config.ForceRefresh {
		if err := service.LoadCache(); err != nil {
			if config.Verbose {
				log.Printf("No se pudo cargar el caché (se creará uno nuevo): %v", err)
			}
		}
	}

	return service, nil
}

// LoadCache carga el caché desde disco
func (s *Service) LoadCache() error {
	data, err := os.ReadFile(s.cacheFile)
	if err != nil {
		return err
	}

	var cache map[string]*models.GeoCache
	if err := json.Unmarshal(data, &cache); err != nil {
		return err
	}

	s.cacheMutex.Lock()
	s.cache = cache
	s.cacheMutex.Unlock()

	if s.verbose {
		log.Printf("Caché cargado: %d direcciones", len(cache))
	}

	return nil
}

// SaveCache guarda el caché en disco
func (s *Service) SaveCache() error {
	s.cacheMutex.RLock()
	defer s.cacheMutex.RUnlock()

	data, err := json.MarshalIndent(s.cache, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(s.cacheFile, data, 0644)
}

// normalizeAddress normaliza una dirección para buscar en caché
func (s *Service) normalizeAddress(address string) string {
	normalized := strings.TrimSpace(strings.ToLower(address))

	// Añadir país si no está presente
	if s.defaultCountry != "" && !strings.Contains(normalized, strings.ToLower(s.defaultCountry)) {
		normalized = fmt.Sprintf("%s, %s", normalized, strings.ToLower(s.defaultCountry))
	}

	return normalized
}

// Geocode geocodifica una dirección con caché y rate limiting
func (s *Service) Geocode(address string) (*float64, *float64, error) {
	if address == "" {
		return nil, nil, nil
	}

	normalized := s.normalizeAddress(address)

	// Verificar caché
	s.cacheMutex.RLock()
	if cached, ok := s.cache[normalized]; ok {
		s.cacheMutex.RUnlock()
		if s.verbose {
			log.Printf("  [CACHE] %s", address)
		}
		lat, lng := cached.Lat, cached.Lng
		return &lat, &lng, nil
	}
	s.cacheMutex.RUnlock()

	// Rate limiting
	ctx := context.Background()
	if err := s.limiter.Wait(ctx); err != nil {
		return nil, nil, fmt.Errorf("rate limiter error: %w", err)
	}

	// Geocodificar
	if s.verbose {
		log.Printf("  [GEOCODING] %s", address)
	}

	// Añadir país para mejor precisión
	fullAddress := address
	if s.defaultCountry != "" && !strings.Contains(strings.ToLower(address), strings.ToLower(s.defaultCountry)) {
		fullAddress = fmt.Sprintf("%s, %s", address, s.defaultCountry)
	}

	location, err := s.geocoder.Geocode(fullAddress)
	if err != nil {
		if s.verbose {
			log.Printf("  [ERROR] Error geocodificando %s: %v", address, err)
		}
		return nil, nil, err
	}

	if location == nil {
		if s.verbose {
			log.Printf("  [WARNING] No se encontraron coordenadas para: %s", address)
		}
		return nil, nil, nil
	}

	lat := location.Lat
	lng := location.Lng

	// Guardar en caché
	s.cacheMutex.Lock()
	s.cache[normalized] = &models.GeoCache{
		Address:   normalized,
		Lat:       lat,
		Lng:       lng,
		Timestamp: time.Now(),
	}
	s.cacheMutex.Unlock()

	return &lat, &lng, nil
}

// GetCacheStats retorna estadísticas del caché
func (s *Service) GetCacheStats() (int, int) {
	s.cacheMutex.RLock()
	defer s.cacheMutex.RUnlock()

	total := len(s.cache)
	valid := 0

	for _, entry := range s.cache {
		if entry.Lat != 0 && entry.Lng != 0 {
			valid++
		}
	}

	return total, valid
}
