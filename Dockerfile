# Etapa 1: Build del backend Go
FROM golang:1.24-alpine AS backend-builder

WORKDIR /app/backend

# Instalar dependencias para CGO (requerido por SQLite)
RUN apk add --no-cache gcc musl-dev sqlite-dev

# Copiar módulos Go
COPY backend/server/go.mod backend/server/go.sum ./
RUN go mod download

# Copiar código fuente del backend
COPY backend/server/ ./

# Compilar el binario
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o donde-ayudo-server .

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

# Etapa 3: Imagen final con Nginx para servir frontend y proxy al backend
FROM nginx:alpine

# Instalar supervisor para ejecutar backend + nginx
RUN apk add --no-cache supervisor sqlite-libs

# Copiar el binario del backend
COPY --from=backend-builder /app/backend/donde-ayudo-server /usr/local/bin/donde-ayudo-server

# Copiar el frontend compilado
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copiar configuración de Nginx
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar configuración de Supervisor
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Crear directorio para la base de datos
RUN mkdir -p /app/data

# Variables de entorno por defecto
ENV PORT=8091
ENV DB_PATH=/app/data/data.db
ENV ENVIRONMENT=production
ENV JWT_SECRET=change-this-in-production

# Exponer puerto 80 (Nginx)
EXPOSE 80

# Iniciar supervisor (ejecuta backend + nginx)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
