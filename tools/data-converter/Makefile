# Makefile para Data Converter

# Variables
BINARY_NAME=data-converter
GO_FILES=$(shell find . -name '*.go' -not -path "./vendor/*")
BUILD_DIR=build
VERSION=1.0.0

.PHONY: all build run clean test deps help install

# Default target
all: build

## build: Compilar el binario
build:
	@echo "🔨 Compilando..."
	@go build -o $(BINARY_NAME) -ldflags "-s -w -X main.version=$(VERSION)" .
	@echo "✅ Compilado: $(BINARY_NAME)"

## install: Instalar dependencias
deps:
	@echo "📦 Instalando dependencias..."
	@go mod download
	@go mod tidy
	@echo "✅ Dependencias instaladas"

## run: Compilar y ejecutar con argumentos de ejemplo
run: build
	@echo "🚀 Ejecutando..."
	@./$(BINARY_NAME) -verbose

## test: Ejecutar tests
test:
	@echo "🧪 Ejecutando tests..."
	@go test -v ./...

## clean: Limpiar binarios y caché
clean:
	@echo "🧹 Limpiando..."
	@rm -f $(BINARY_NAME)
	@rm -rf $(BUILD_DIR)
	@rm -f geocache.json
	@go clean
	@echo "✅ Limpieza completada"

## build-all: Compilar para todas las plataformas
build-all:
	@echo "🔨 Compilando para todas las plataformas..."
	@./build.sh

## install: Instalar el binario en el sistema
install: build
	@echo "📥 Instalando en /usr/local/bin..."
	@sudo cp $(BINARY_NAME) /usr/local/bin/
	@echo "✅ Instalado: /usr/local/bin/$(BINARY_NAME)"

## fmt: Formatear código
fmt:
	@echo "✨ Formateando código..."
	@go fmt ./...
	@echo "✅ Código formateado"

## vet: Verificar código
vet:
	@echo "🔍 Verificando código..."
	@go vet ./...
	@echo "✅ Verificación completada"

## lint: Ejecutar linter (requiere golangci-lint)
lint:
	@echo "🔍 Ejecutando linter..."
	@golangci-lint run ./...

## dev: Modo desarrollo con recompilación automática
dev:
	@echo "👨‍💻 Modo desarrollo..."
	@go run . -verbose -input ../../src/data/data1.csv -output ../../src/data/data1.json

## help: Mostrar esta ayuda
help:
	@echo "Comandos disponibles:"
	@sed -n 's/^##//p' $(MAKEFILE_LIST) | column -t -s ':' | sed -e 's/^/ /'

.DEFAULT_GOAL := help
