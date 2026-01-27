#!/bin/bash

# Script para compilar el conversor en múltiples plataformas

VERSION="1.0.0"
APP_NAME="data-converter"
BUILD_DIR="build"

echo "🔨 Building Data Converter v${VERSION}..."
echo ""

# Crear directorio de build
mkdir -p ${BUILD_DIR}

# Compilar para diferentes plataformas
echo "📦 Building for Linux (amd64)..."
GOOS=linux GOARCH=amd64 go build -o ${BUILD_DIR}/${APP_NAME}-linux-amd64 -ldflags "-s -w" .

echo "📦 Building for Linux (arm64)..."
GOOS=linux GOARCH=arm64 go build -o ${BUILD_DIR}/${APP_NAME}-linux-arm64 -ldflags "-s -w" .

echo "📦 Building for macOS (amd64)..."
GOOS=darwin GOARCH=amd64 go build -o ${BUILD_DIR}/${APP_NAME}-darwin-amd64 -ldflags "-s -w" .

echo "📦 Building for macOS (arm64 - Apple Silicon)..."
GOOS=darwin GOARCH=arm64 go build -o ${BUILD_DIR}/${APP_NAME}-darwin-arm64 -ldflags "-s -w" .

echo "📦 Building for Windows (amd64)..."
GOOS=windows GOARCH=amd64 go build -o ${BUILD_DIR}/${APP_NAME}-windows-amd64.exe -ldflags "-s -w" .

echo ""
echo "✅ Build completed! Binaries available in ${BUILD_DIR}/"
echo ""
ls -lh ${BUILD_DIR}/

echo ""
echo "📊 Binary sizes:"
du -h ${BUILD_DIR}/*
