package converter

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/P1ngu-Dev/donde-ayudo-cl/tools/data-converter/geocoding"
	"github.com/P1ngu-Dev/donde-ayudo-cl/tools/data-converter/models"
)

// CSVToJSON convierte un archivo CSV a JSON
type CSVToJSON struct {
	config     *models.Config
	geoService *geocoding.Service
	stats      *ConversionStats
}

// ConversionStats mantiene estadísticas de la conversión
type ConversionStats struct {
	Total             int
	Processed         int
	SuccessfulGeocode int
	FailedGeocode     int
	SkippedGeocode    int
	StartTime         time.Time
	mu                sync.Mutex
}

// NewCSVToJSON crea un nuevo conversor
func NewCSVToJSON(config *models.Config, geoService *geocoding.Service) *CSVToJSON {
	return &CSVToJSON{
		config:     config,
		geoService: geoService,
		stats: &ConversionStats{
			StartTime: time.Now(),
		},
	}
}

// Convert realiza la conversión completa
func (c *CSVToJSON) Convert() error {
	// Abrir archivo CSV
	file, err := os.Open(c.config.InputFile)
	if err != nil {
		return fmt.Errorf("error abriendo archivo CSV: %w", err)
	}
	defer file.Close()

	// Leer CSV
	reader := csv.NewReader(file)
	records, err := c.readCSV(reader)
	if err != nil {
		return fmt.Errorf("error leyendo CSV: %w", err)
	}

	c.stats.Total = len(records)
	log.Printf("Registros encontrados: %d", c.stats.Total)

	// Procesar registros con concurrencia controlada
	locations := c.processRecords(records)

	// Guardar JSON
	if err := c.saveJSON(locations); err != nil {
		return fmt.Errorf("error guardando JSON: %w", err)
	}

	// Guardar caché de geocodificación
	if c.config.UseCache && !c.config.SkipGeocoding {
		if err := c.geoService.SaveCache(); err != nil {
			log.Printf("Advertencia: no se pudo guardar el caché: %v", err)
		}
	}

	// Mostrar estadísticas
	c.printStats()

	return nil
}

// readCSV lee el archivo CSV y retorna los registros
func (c *CSVToJSON) readCSV(reader *csv.Reader) ([]map[string]string, error) {
	// Leer header
	header, err := reader.Read()
	if err != nil {
		return nil, err
	}

	var records []map[string]string

	// Leer registros
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}

		// Crear map del registro
		recordMap := make(map[string]string)
		for i, value := range record {
			if i < len(header) {
				recordMap[header[i]] = value
			}
		}
		records = append(records, recordMap)
	}

	return records, nil
}

// processRecords procesa los registros con concurrencia controlada
func (c *CSVToJSON) processRecords(records []map[string]string) []*models.Location {
	locations := make([]*models.Location, len(records))

	// Crear canales para procesamiento concurrente
	type job struct {
		index  int
		record map[string]string
	}

	jobs := make(chan job, len(records))
	var wg sync.WaitGroup

	// Lanzar workers
	numWorkers := c.config.Workers
	if c.config.SkipGeocoding {
		numWorkers = 1 // Sin geocodificación, un worker es suficiente
	}

	for w := 0; w < numWorkers; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := range jobs {
				location := c.processRecord(j.index+1, j.record)
				locations[j.index] = location
			}
		}()
	}

	// Enviar trabajos
	for i, record := range records {
		jobs <- job{index: i, record: record}
	}
	close(jobs)

	// Esperar a que terminen todos los workers
	wg.Wait()

	return locations
}

// processRecord procesa un registro individual
func (c *CSVToJSON) processRecord(id int, record map[string]string) *models.Location {
	c.stats.mu.Lock()
	c.stats.Processed++
	current := c.stats.Processed
	c.stats.mu.Unlock()

	espacio := strings.TrimSpace(record["Espacio"])
	address := strings.TrimSpace(record["DIRECCIÓN"])

	if c.config.Verbose {
		truncated := espacio
		if len(truncated) > 40 {
			truncated = truncated[:40] + "..."
		}
		log.Printf("[%d/%d] Procesando: %s", current, c.stats.Total, truncated)
	}

	// Geocodificar si no está deshabilitado
	var lat, lng *float64
	if !c.config.SkipGeocoding && address != "" {
		var err error
		lat, lng, err = c.geoService.Geocode(address)

		c.stats.mu.Lock()
		if err != nil || (lat == nil || lng == nil) {
			c.stats.FailedGeocode++
		} else if lat != nil && lng != nil {
			c.stats.SuccessfulGeocode++
			// Redondear a 6 decimales
			rounded := roundToDecimals(*lat, 6)
			lat = &rounded
			rounded = roundToDecimals(*lng, 6)
			lng = &rounded
		}
		c.stats.mu.Unlock()
	} else {
		c.stats.mu.Lock()
		c.stats.SkippedGeocode++
		c.stats.mu.Unlock()
	}

	// Parsear supplies_needed
	suppliesNeeded := []string{}
	if masInfo := strings.TrimSpace(record["MÁS INFO"]); masInfo != "" {
		for _, item := range strings.Split(masInfo, ",") {
			if trimmed := strings.TrimSpace(item); trimmed != "" {
				suppliesNeeded = append(suppliesNeeded, trimmed)
			}
		}
	}

	// Crear ubicación
	now := time.Now().Format(time.RFC3339)
	location := &models.Location{
		ID:             strconv.Itoa(id),
		Name:           espacio,
		Type:           strings.ToLower(strings.TrimSpace(record["TIPO"])),
		Lat:            lat,
		Lng:            lng,
		City:           strings.TrimSpace(record["COMUNA"]),
		Address:        address,
		Place:          espacio,
		Status:         "active",
		CapacityStatus: "",
		SuppliesNeeded: suppliesNeeded,
		Info:           strings.TrimSpace(record["MÁS INFO"]),
		Schedule: models.Schedule{
			Start: strings.TrimSpace(record["Horario de Inicio"]),
			End:   strings.TrimSpace(record["Horario de fin"]),
			Days:  strings.TrimSpace(record["Dias (ordenar columnas) (Semana del 19)"]),
		},
		CreatedAt:   now,
		UpdatedAt:   now,
		Contact:     strings.TrimSpace(record["CONTACTO"]),
		Verified:    false,
		Verificator: "",
	}

	return location
}

// saveJSON guarda las ubicaciones en un archivo JSON
func (c *CSVToJSON) saveJSON(locations []*models.Location) error {
	data, err := json.MarshalIndent(locations, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(c.config.OutputFile, data, 0644)
}

// printStats muestra las estadísticas de la conversión
func (c *CSVToJSON) printStats() {
	duration := time.Since(c.stats.StartTime)

	log.Println("\n" + strings.Repeat("=", 60))
	log.Println("RESUMEN DE CONVERSIÓN")
	log.Println(strings.Repeat("=", 60))
	log.Printf("Total de registros:        %d", c.stats.Total)
	log.Printf("Registros procesados:      %d", c.stats.Processed)

	if !c.config.SkipGeocoding {
		log.Printf("Geocodificación exitosa:   %d", c.stats.SuccessfulGeocode)
		log.Printf("Geocodificación fallida:   %d", c.stats.FailedGeocode)
		successRate := 0.0
		if c.stats.Total > 0 {
			successRate = float64(c.stats.SuccessfulGeocode) / float64(c.stats.Total) * 100
		}
		log.Printf("Tasa de éxito:             %.1f%%", successRate)

		cacheTotal, cacheValid := c.geoService.GetCacheStats()
		log.Printf("Entradas en caché:         %d (%d válidas)", cacheTotal, cacheValid)
	} else {
		log.Printf("Geocodificación omitida:   %d", c.stats.SkippedGeocode)
	}

	log.Printf("Tiempo de ejecución:       %v", duration.Round(time.Millisecond))
	log.Printf("Archivo de salida:         %s", c.config.OutputFile)
	log.Println(strings.Repeat("=", 60))
}

// roundToDecimals redondea un número a n decimales
func roundToDecimals(value float64, decimals int) float64 {
	multiplier := math.Pow(10, float64(decimals))
	return math.Round(value*multiplier) / multiplier
}
