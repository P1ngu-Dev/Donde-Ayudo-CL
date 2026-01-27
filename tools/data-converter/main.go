package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/P1ngu-Dev/donde-ayudo-cl/tools/data-converter/converter"
	"github.com/P1ngu-Dev/donde-ayudo-cl/tools/data-converter/geocoding"
	"github.com/P1ngu-Dev/donde-ayudo-cl/tools/data-converter/models"
)

const (
	version = "1.0.0"
)

func main() {
	// Flags de configuración
	var (
		inputFile      = flag.String("input", "data1.csv", "Archivo CSV de entrada")
		outputFile     = flag.String("output", "data1.json", "Archivo JSON de salida")
		cacheFile      = flag.String("cache", "geocache.json", "Archivo de caché de geocodificación")
		workers        = flag.Int("workers", 3, "Número de workers concurrentes para geocodificación")
		rateLimit      = flag.Duration("rate", 1100*time.Millisecond, "Tiempo mínimo entre peticiones de geocodificación")
		skipGeocode    = flag.Bool("skip-geocode", false, "Omitir geocodificación (usar solo para testing)")
		forceRefresh   = flag.Bool("force", false, "Forzar geocodificación incluso si existe en caché")
		noCache        = flag.Bool("no-cache", false, "Deshabilitar completamente el caché")
		defaultCountry = flag.String("country", "Chile", "País por defecto para geocodificación")
		verbose        = flag.Bool("verbose", false, "Modo verbose: mostrar logs detallados")
		showVersion    = flag.Bool("version", false, "Mostrar versión del programa")
	)

	flag.Parse()

	// Mostrar versión
	if *showVersion {
		fmt.Printf("data-converter v%s\n", version)
		os.Exit(0)
	}

	// Banner
	printBanner()

	// Validar archivos
	if err := validateFiles(*inputFile); err != nil {
		log.Fatalf("Error: %v", err)
	}

	// Crear configuración
	config := &models.Config{
		InputFile:      *inputFile,
		OutputFile:     *outputFile,
		CacheFile:      *cacheFile,
		RateLimit:      *rateLimit,
		Workers:        *workers,
		GeoProvider:    "nominatim",
		ForceRefresh:   *forceRefresh,
		SkipGeocoding:  *skipGeocode,
		DefaultCountry: *defaultCountry,
		Verbose:        *verbose,
		UseCache:       !*noCache,
	}

	// Mostrar configuración
	if *verbose {
		printConfig(config)
	}

	// Crear servicio de geocodificación
	geoService, err := geocoding.NewService(config)
	if err != nil {
		log.Fatalf("Error creando servicio de geocodificación: %v", err)
	}

	// Crear conversor
	conv := converter.NewCSVToJSON(config, geoService)

	// Ejecutar conversión
	log.Printf("Iniciando conversión: %s -> %s\n", *inputFile, *outputFile)

	if err := conv.Convert(); err != nil {
		log.Fatalf("Error en la conversión: %v", err)
	}

	log.Println("\n✓ Conversión completada exitosamente!")
}

// validateFiles valida que el archivo de entrada exista
func validateFiles(inputFile string) error {
	if _, err := os.Stat(inputFile); os.IsNotExist(err) {
		return fmt.Errorf("el archivo de entrada no existe: %s", inputFile)
	}

	ext := filepath.Ext(inputFile)
	if ext != ".csv" {
		return fmt.Errorf("el archivo de entrada debe ser CSV (tiene extensión %s)", ext)
	}

	return nil
}

// printBanner muestra el banner del programa
func printBanner() {
	banner := `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║          🗺️  DATA CONVERTER - Donde Ayudo CL 🇨🇱            ║
║                                                              ║
║          Conversor de datos CSV a JSON con                  ║
║          geocodificación automática                         ║
║                                                              ║
║          Version: %-10s                                 ║
╚══════════════════════════════════════════════════════════════╝
`
	fmt.Printf(banner, version)
}

// printConfig muestra la configuración actual
func printConfig(config *models.Config) {
	log.Println("\n" + strings.Repeat("─", 60))
	log.Println("CONFIGURACIÓN")
	log.Println(strings.Repeat("─", 60))
	log.Printf("Archivo entrada:     %s", config.InputFile)
	log.Printf("Archivo salida:      %s", config.OutputFile)
	log.Printf("Archivo caché:       %s", config.CacheFile)
	log.Printf("Workers:             %d", config.Workers)
	log.Printf("Rate limit:          %v", config.RateLimit)
	log.Printf("País por defecto:    %s", config.DefaultCountry)
	log.Printf("Usar caché:          %v", config.UseCache)
	log.Printf("Forzar refresh:      %v", config.ForceRefresh)
	log.Printf("Omitir geocoding:    %v", config.SkipGeocoding)
	log.Printf("Modo verbose:        %v", config.Verbose)
	log.Println(strings.Repeat("─", 60) + "\n")
}
