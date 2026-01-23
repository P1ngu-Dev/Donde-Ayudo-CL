# Guía de Deployment - Donde Ayudo CL

## 🚀 Opciones de Deployment

### 1. DigitalOcean App Platform (Recomendado)

**Ventajas:** Auto-scaling, SSL gratis, CI/CD integrado

```bash
# 1. Crear cuenta en DigitalOcean
# 2. Conectar repositorio de GitHub
# 3. Configurar build:
Build Command: npm run build
Output Directory: dist
```

**Configuración App Platform:**
```yaml
name: donde-ayudo-cl
region: nyc
services:
  - name: web
    github:
      repo: P1ngu-Dev/Donde-Ayudo-CL
      branch: main
    build_command: npm run build
    output_dir: dist
    run_command: npx serve dist -s
    http_port: 3000
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
```

### 2. Vercel

**El más rápido para deployment:**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy a producción
vercel --prod
```

**Configuración automática** (detecta Vite)

### 3. Netlify

```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy

# Deploy a producción
netlify deploy --prod
```

**netlify.toml:**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### 4. GitHub Pages

```bash
# Instalar gh-pages
npm i -D gh-pages

# Agregar script a package.json
"deploy": "npm run build && gh-pages -d dist"

# Deploy
npm run deploy
```

**Nota:** Configurar `base` en vite.config.js:
```js
export default defineConfig({
  base: '/Donde-Ayudo-CL/',
  // ... resto de config
})
```

### 5. Servidor Propio (Ubuntu/Debian)

```bash
# En el servidor
sudo apt update
sudo apt install nginx nodejs npm

# Clonar repo
git clone https://github.com/P1ngu-Dev/Donde-Ayudo-CL.git
cd Donde-Ayudo-CL

# Build
npm install
npm run build

# Configurar Nginx
sudo nano /etc/nginx/sites-available/dondeayudo

# Contenido:
server {
    listen 80;
    server_name dondeayudo.cl www.dondeayudo.cl;
    root /var/www/dondeayudo/dist;
    index index.html;

    # PWA Service Worker
    location /sw.js {
        add_header Cache-Control "no-cache";
        add_header Service-Worker-Allowed "/";
    }

    # Assets con cache largo
    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # SPA Fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}

# Activar sitio
sudo ln -s /etc/nginx/sites-available/dondeayudo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL con Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d dondeayudo.cl -d www.dondeayudo.cl
```

## 📊 Métricas de Performance

### Objetivos (Lighthouse)

- **Performance:** > 90
- **Accessibility:** > 95
- **Best Practices:** 100
- **SEO:** 100
- **PWA:** ✓ Installable

### Bundle Size

- **Total:** ~200KB (gzipped)
- **Leaflet:** ~43KB
- **App Code:** ~6KB
- **CSS:** ~11KB

### Tiempos de Carga (3G)

- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3.5s
- **Speed Index:** < 2.5s

## 🔧 Optimizaciones Post-Deploy

### 1. CDN

Usar Cloudflare gratis:
- Cache automático de assets
- Minificación adicional
- Protección DDoS

### 2. Monitoring

```bash
# Instalar Sentry para error tracking
npm i @sentry/browser

# Configurar en main.js
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "TU_DSN_DE_SENTRY",
  environment: "production"
});
```

### 3. Analytics

```html
<!-- Google Analytics (agregar en index.html) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## 🧪 Testing Pre-Deploy

```bash
# 1. Build local
npm run build

# 2. Preview
npm run preview

# 3. Lighthouse (Chrome DevTools)
# - Abrir DevTools
# - Tab "Lighthouse"
# - Generar reporte

# 4. Test PWA
# - Application tab → Manifest
# - Application tab → Service Workers
# - Network tab → Offline (verificar funcionamiento)
```

## 🔄 CI/CD con GitHub Actions

Crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

## 📱 App Stores (Futuro)

### PWABuilder

Para publicar en Microsoft Store y Google Play:

```bash
# 1. Ir a https://www.pwabuilder.com/
# 2. Ingresar URL del sitio
# 3. Descargar packages para cada store
# 4. Seguir guías de publicación
```

## ⚠️ Checklist Pre-Deploy

- [ ] `npm run build` sin errores
- [ ] Service Worker funcionando en preview
- [ ] Manifest validado (Chrome DevTools)
- [ ] Iconos generados y optimizados
- [ ] Lighthouse score > 90 en todas las métricas
- [ ] Testing en dispositivos reales (iOS/Android)
- [ ] Variables de entorno configuradas
- [ ] Analytics configurado
- [ ] Error tracking configurado
- [ ] Dominio apuntando correctamente
- [ ] SSL/TLS configurado

---

**¿Problemas?** Abre un issue en GitHub o contacta al equipo.
