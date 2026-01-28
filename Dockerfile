# Etapa 1: Build del backend Go
FROM golang:1.24-alpine AS backend-builder

WORKDIR /app/backend

# Copiar módulos Go
COPY backend/server/go.mod backend/server/go.sum ./
RUN go mod download

# Copiar código fuente del backend
COPY backend/server/ ./

# Compilar el binario (CGO deshabilitado para PostgreSQL)
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o donde-ayudo-server .

# Etapa 2: Build del frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./
RUN npm ci

# Copiar código fuente del frontend
COPY . .

# Build del frontend con Vite
RUN npm run build

# Etapa 3: Imagen final simplificada (Backend Go sirve frontend)
FROM golang:1.24-alpine

# Instalar PostgreSQL client y CA certificates
RUN apk add --no-cache postgresql-client ca-certificates

WORKDIR /app

# Copiar el binario del backend
COPY --from=backend-builder /app/backend/donde-ayudo-server ./

# Copiar el frontend compilado
COPY --from=frontend-builder /app/dist ./public

# Copiar script de inicialización
COPY backend/init_db.sh ./
RUN chmod +x init_db.sh

# Variables de entorno
ENV PORT=8080
ENV DB_PATH=/data/data.db
ENV ENVIRONMENT=production
ENV JWT_SECRET=change-this-in-production
ENV STATIC_DIR=/app/public

# Exponer puerto 8080
EXPOSE 8080

# Iniciar backend (servirá también el frontend)
CMD ["./donde-ayudo-server"]
