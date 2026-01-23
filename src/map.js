// Módulo de Mapa - Leaflet con marcadores SVG ligeros
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { repository } from './services/DataRepository.js';
import { createIcon, icon } from './icons.js';

// Configuración de colores por tipo de punto
const MARKER_COLORS = {
  albergue: '#3B82F6',    // Azul
  acopio: '#10B981',      // Verde
  hidratacion: '#06B6D4', // Cyan
  riesgo: '#EF4444',      // Rojo
  default: '#6B7280'      // Gris
};

// Iconos SVG por tipo (peso ~0kb, escalables)
const ICONS_SVG = {
  albergue: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/></svg>`,
  acopio: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 4h4v2h-4V4zm1 10h-2v2H7v-2H5v-2h2v-2h2v2h2v2zm6 2h-4v-2h4v2z"/></svg>`,
  hidratacion: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.79 6 9.14 0 3.63-2.65 6.2-6 6.2z"/></svg>`,
  riesgo: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`
};

// Labels de tipos
const TYPE_LABELS = {
  albergue: 'Albergue',
  acopio: 'Centro de Acopio',
  hidratacion: 'Punto de Hidratación',
  riesgo: 'Zona de Riesgo'
};

/**
 * Crea un icono SVG personalizado para Leaflet
 */
function createMarkerIcon(type, status) {
  const color = MARKER_COLORS[type] || MARKER_COLORS.default;
  const borderColor = status === 'full' ? '#EF4444' : 
                      status === 'closed' ? '#6B7280' : color;
  const svg = ICONS_SVG[type] || ICONS_SVG.albergue;
  
  const html = `
    <div class="custom-marker" style="
      background: ${color};
      border: 3px solid ${borderColor};
      ${status === 'full' ? 'opacity: 0.75;' : ''}
    ">
      <div class="marker-icon" style="color: white;">
        ${svg}
      </div>
    </div>
  `;
  
  return L.divIcon({
    html: html,
    className: 'marker-wrapper',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
}

/**
 * Genera el HTML del detalle para el Bottom Sheet
 */
export function createDetailContent(point) {
  const statusConfig = {
    active: { text: 'Disponible', class: 'active', icon: createIcon('check', '', 'small') },
    full: { text: 'Capacidad llena', class: 'full', icon: createIcon('x', '', 'small') },
    closed: { text: 'Cerrado', class: 'closed', icon: createIcon('minus', '', 'small') }
  };
  
  const status = statusConfig[point.status] || statusConfig.active;
  const typeIcon = createIcon(point.type, '', 'xlarge');
  const typeLabel = TYPE_LABELS[point.type] || point.type;
  const color = MARKER_COLORS[point.type] || MARKER_COLORS.default;

  // Formatear contacto como link si es teléfono
  let contactHtml = '';
  if (point.contact && point.contact !== 'No disponible') {
    const isPhone = point.contact.match(/^\+?\d[\d\s-]{7,}/);
    if (isPhone) {
      const cleanPhone = point.contact.replace(/\s/g, '');
      contactHtml = `
        <a href="tel:${cleanPhone}" class="contact-link">
          ${createIcon('phone', '', 'medium')} <span>${point.contact}</span>
        </a>
      `;
    } else {
      contactHtml = `
        <div class="contact-link">
          ${createIcon('message', '', 'medium')} <span>${point.contact}</span>
        </div>
      `;
    }
  }

  // Lista de suministros necesarios
  let suppliesHtml = '';
  if (point.supplies_needed?.length > 0) {
    suppliesHtml = `
      <div class="detail-section">
        <h4>Se necesita</h4>
        <div class="supplies-list">
          ${point.supplies_needed.map(s => `<span class="supply-tag">${s}</span>`).join('')}
        </div>
      </div>
    `;
  }

  // Tiempo desde última actualización
  const updatedDate = new Date(point.updated_at);
  const now = new Date();
  const diffMs = now - updatedDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  
  let timeAgo;
  if (diffMins < 60) {
    timeAgo = `hace ${diffMins} min`;
  } else if (diffHours < 24) {
    timeAgo = `hace ${diffHours}h`;
  } else {
    timeAgo = updatedDate.toLocaleDateString('es-CL');
  }

  return `
    <div class="detail-header">
      <div class="detail-icon" style="background: ${color}15; color: ${color};">
        ${typeIcon}
      </div>
      <div>
        <h3 class="detail-title">${point.name}</h3>
        <p class="detail-type">${typeLabel}</p>
      </div>
    </div>
    
    <div class="status-badge ${status.class}">
      ${status.icon}
      <span>${status.text}</span>
    </div>
    
    ${point.address ? `
      <div class="detail-section">
        <h4>Dirección</h4>
        <p style="color: #374151; font-size: 0.95rem;">${point.address}</p>
      </div>
    ` : ''}
    
    ${suppliesHtml}
    
    ${contactHtml ? `
      <div class="detail-section">
        <h4>Contacto</h4>
        ${contactHtml}
      </div>
    ` : ''}
    
    <div class="detail-footer">
      Actualizado ${timeAgo}
    </div>
  `;
}

/**
 * Clase principal del Mapa
 */
export class MapManager {
  constructor(containerId) {
    this.containerId = containerId;
    this.map = null;
    this.markers = [];
    this.markersLayer = null;
    this.userLocationMarker = null;
    this.onPointClick = null; // Callback cuando se hace click en un punto
  }

  /**
   * Inicializa el mapa centrado en Chile
   */
  init() {
    // Centro aproximado de la zona afectada (Región del Biobío)
    const defaultCenter = [-36.73, -73.0];
    const defaultZoom = 12;

    this.map = L.map(this.containerId, {
      zoomControl: false,
      attributionControl: false // Lo añadiremos manualmente más pequeño
    }).setView(defaultCenter, defaultZoom);

    // Tiles de OpenStreetMap (gratis, sin API key)
    // Usamos un solo subdominio para mejor caché
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      updateWhenIdle: true, // Mejora rendimiento en móviles
      updateWhenZooming: false
    }).addTo(this.map);

    // Attribution pequeño
    L.control.attribution({
      position: 'bottomleft',
      prefix: '<a href="https://osm.org">OSM</a>'
    }).addTo(this.map);

    // Control de zoom en posición mobile-friendly
    L.control.zoom({
      position: 'bottomright'
    }).addTo(this.map);

    // Layer group para marcadores
    this.markersLayer = L.layerGroup().addTo(this.map);

    return this;
  }

  /**
   * Registra callback para clicks en puntos
   */
  setPointClickHandler(callback) {
    this.onPointClick = callback;
  }

  /**
   * Carga y renderiza los puntos del repositorio
   */
  async loadPoints() {
    const points = await repository.initialize();
    this.renderPoints(points);
    return points;
  }

  /**
   * Renderiza los puntos en el mapa
   */
  renderPoints(points) {
    this.markersLayer.clearLayers();
    this.markers = [];

    points.forEach(point => {
      const marker = L.marker([point.lat, point.lng], {
        icon: createMarkerIcon(point.type, point.status)
      });

      // Click handler para abrir Bottom Sheet
      marker.on('click', () => {
        if (this.onPointClick) {
          this.onPointClick(point);
        }
        // Centrar suavemente en el punto
        this.map.panTo([point.lat, point.lng], { animate: true, duration: 0.3 });
      });

      marker.pointData = point;
      this.markers.push(marker);
      this.markersLayer.addLayer(marker);
    });

    // Ajustar vista para mostrar todos los puntos
    if (points.length > 0) {
      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  /**
   * Filtra marcadores por tipo
   */
  filterByType(type) {
    const filteredPoints = repository.getPointsByType(type);
    this.renderPoints(filteredPoints);
    return filteredPoints.length;
  }

  /**
   * Centra el mapa en la ubicación del usuario
   */
  locateUser() {
    if (!navigator.geolocation) {
      console.warn('Geolocalización no soportada');
      return Promise.reject('No soportado');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          
          // Eliminar marcador anterior si existe
          if (this.userLocationMarker) {
            this.map.removeLayer(this.userLocationMarker);
          }

          // Crear marcador de ubicación
          this.userLocationMarker = L.circleMarker([latitude, longitude], {
            radius: 12,
            fillColor: '#3B82F6',
            color: '#1D4ED8',
            weight: 3,
            fillOpacity: 0.9
          }).addTo(this.map);

          // Añadir pulso animado (solo CSS, ligero)
          const pulseIcon = L.divIcon({
            html: '<div class="user-pulse"></div>',
            className: 'user-location-wrapper',
            iconSize: [24, 24]
          });
          L.marker([latitude, longitude], { icon: pulseIcon }).addTo(this.map);

          this.map.setView([latitude, longitude], 15, { animate: true });
          resolve({ latitude, longitude });
        },
        (error) => {
          console.error('Error de geolocalización:', error.message);
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  getMap() {
    return this.map;
  }
}

// Exportar instancia singleton
export const mapManager = new MapManager('map');
