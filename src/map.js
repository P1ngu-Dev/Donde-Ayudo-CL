// Módulo de Mapa - Leaflet con marcadores SVG ligeros
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { repository } from './services/DataRepository.js';
import { createIcon, icon } from './icons.js';

// ===== SISTEMA DE ALIAS DE TIPOS =====
// Mapea tipos similares a un tipo principal
// Útil cuando el JSON tiene "acopio", "centro de acopio", "punto de acopio", etc.
export const TYPE_ALIASES = {
  // Acopio
  'centro de acopio': 'acopio',
  'punto de acopio': 'acopio',
  'centro acopio': 'acopio',
  'acopio de donaciones': 'acopio',
  
  // Albergue
  'centro de albergue': 'albergue',
  'refugio temporal': 'albergue',
  'alojamiento': 'albergue',
  
  // Hidratación
  'punto de hidratacion': 'hidratacion',
  'agua': 'hidratacion',
  'hidratación': 'hidratacion',
  
  // Donaciones
  'donacion': 'donacion',
  'donaciones': 'donacion',
  'centro de donacion': 'donacion',
  
  // Caridad
  'campaña solidaria': 'caridad',
  'evento benefico': 'caridad'
};

/**
 * Normaliza un tipo usando el sistema de alias
 * Si el tipo tiene un alias definido, retorna el tipo principal
 * Si no, retorna el tipo original en minúsculas
 */
export function normalizeType(type) {
  if (!type) return 'default';
  
  const normalized = type.toLowerCase().trim();
  return TYPE_ALIASES[normalized] || normalized;
}

// Configuración de colores por tipo de punto
export const MARKER_COLORS = {
  albergue: '#3B82F6',    // Azul
  acopio: '#10B981',      // Verde
  hidratacion: '#06B6D4', // Cyan
  riesgo: '#EF4444',      // Rojo
  ayuda: '#F59E0B',       // Naranja
  donacion: '#8B5CF6',    // Púrpura
  rescate: '#EC4899',     // Rosa
  refugio: '#14B8A6',     // Teal
  default: '#6B7280'      // Gris
};

// Paleta de colores para asignación dinámica
const COLOR_PALETTE = [
  '#3B82F6', // Azul
  '#10B981', // Verde
  '#06B6D4', // Cyan
  '#EF4444', // Rojo
  '#F59E0B', // Naranja
  '#8B5CF6', // Púrpura
  '#EC4899', // Rosa
  '#14B8A6', // Teal
  '#F97316', // Naranja oscuro
  '#84CC16', // Lima
  '#06B6D4', // Azul cielo
  '#A855F7', // Violeta
  '#E11D48', // Rojo oscuro
  '#0EA5E9', // Azul claro
  '#22C55E', // Verde brillante
];

// Cache de colores asignados dinámicamente
const dynamicColorCache = {};

/**
 * Obtiene un color para un tipo, asignando uno dinámicamente si no está definido
 */
export function getColorForType(type) {
  // Normalizar el tipo primero
  const normalizedType = normalizeType(type);
  
  // Si ya está definido, retornarlo
  if (MARKER_COLORS[normalizedType]) {
    return MARKER_COLORS[normalizedType];
  }
  
  // Si ya se asignó un color dinámicamente, retornarlo
  if (dynamicColorCache[normalizedType]) {
    return dynamicColorCache[normalizedType];
  }
  
  // Asignar un nuevo color de la paleta
  const usedColors = Object.values(dynamicColorCache);
  const availableColors = COLOR_PALETTE.filter(c => !usedColors.includes(c));
  
  // Si se agotaron los colores, usar uno al azar
  const newColor = availableColors.length > 0 
    ? availableColors[0] 
    : COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
  
  dynamicColorCache[normalizedType] = newColor;
  return newColor;
}

// Iconos SVG por tipo (peso ~0kb, escalables)
// Solo define iconos para tipos específicos, los demás serán círculos de color
const ICONS_SVG = {
  albergue: `<svg fill="#ffffff" height="200px" width="200px" version="1.1" id="_x31_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 128 128" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <circle cx="27.3" cy="68.9" r="7.8"></circle> <path d="M41.5,75.8c0,0,5.4,0,11.5,0v2.4h50.3h9.9h8.5c0-8.1-3.7-14.7-8.5-15.3v0L53,57.5v2c-0.5,0-0.9,0-1.4,0 c-0.4-0.1-1.4,0-1.5,0c-6.5,0-11.9,4.8-13,10.9c0,0-0.1,0.8-0.1,1C37.1,73.8,39,75.8,41.5,75.8z"></path> <polygon points="14.5,81.2 14.5,58.7 4.3,58.7 4.3,114 14.5,114 14.5,91.4 112.5,91.4 112.5,114 122.7,114 122.7,91.4 122.7,81.3 122.7,81.2 "></polygon> </g> </g></svg> `,
  acopio: '<svg fill="#ffffff" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 612.001 612.001" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M599.724,169.892L318.584,55.057c-9.642-3.938-20.449-3.908-30.068,0.085L12.173,169.853 C4.803,172.913,0,180.107,0,188.087v41.11c0,10.904,8.839,19.742,19.742,19.742h14.807c2.726,0,4.936,2.209,4.936,4.936v261.582 c0,24.532,19.887,44.42,44.42,44.42h12.901V322.535h418.39v237.341h12.901c24.532,0,44.42-19.887,44.42-44.42V253.875 c0-2.726,2.21-4.936,4.936-4.936h14.807c10.904,0,19.742-8.839,19.742-19.742v-41.029C612,180.148,607.147,172.925,599.724,169.892 z M197.42,248.939h-98.71v-44.42h98.709L197.42,248.939L197.42,248.939z M355.354,248.939h-98.709v-44.42h98.709V248.939z M513.291,248.939H414.58v-44.42h98.71L513.291,248.939L513.291,248.939z M223.099,461.201h-28.093v38.756h-13.124v-38.756h-28.266 c-10.216,0-18.497,8.281-18.497,18.497v61.68c0,10.216,8.282,18.496,18.497,18.496h69.482c10.216,0,18.497-8.28,18.497-18.496 v-61.68C241.596,469.482,233.314,461.201,223.099,461.201z M340.777,461.201h-28.093v38.756h-13.124v-38.756h-28.265 c-10.216,0-18.497,8.281-18.497,18.497v61.68c0,10.216,8.282,18.496,18.497,18.496h69.481c10.216,0,18.497-8.28,18.497-18.496 v-61.68C359.275,469.482,350.993,461.201,340.777,461.201z M460.642,461.201h-28.093v38.756h-13.124v-38.756H391.16 c-10.216,0-18.497,8.281-18.497,18.497v61.68c0,10.216,8.281,18.496,18.497,18.496h69.481c10.216,0,18.497-8.28,18.497-18.496 v-61.68C479.14,469.482,470.857,461.201,460.642,461.201z M282.182,349.896h-28.093v38.757h-13.124v-38.757H212.7 c-10.216,0-18.497,8.282-18.497,18.497v61.68c0,10.216,8.282,18.497,18.497,18.497h69.482c10.216,0,18.497-8.281,18.497-18.497 v-61.68C300.68,358.178,292.397,349.896,282.182,349.896z M402.732,349.896h-28.094v38.757h-13.123v-38.757H333.25 c-10.216,0-18.497,8.282-18.497,18.497v61.68c0,10.216,8.282,18.497,18.497,18.497h69.482c10.216,0,18.496-8.281,18.496-18.497 v-61.68C421.229,358.178,412.948,349.896,402.732,349.896z"></path> </g> </g></svg>',
  // hidratacion: sin icono, solo color cyan
  // riesgo: sin icono, solo color rojo
  // Puedes agregar más iconos aquí según necesites
  'caridad' : '<svg fill="#ffffff" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M640.172 171.124c119.859 14.637 199.51 49.612 199.51 76.982 0 15.683-30.577 37.475-87.407 54.605-62.809 18.932-148.567 29.865-240.273 29.865-91.711 0-177.469-10.933-240.277-29.865-56.827-17.13-87.403-38.921-87.403-54.605 0-29.366 89.458-66.158 219.676-79.227 11.254-1.13 19.462-11.169 18.332-22.423s-11.169-19.462-22.423-18.332c-151.876 15.243-256.546 58.29-256.546 119.982 0 75.871 164.41 125.43 368.64 125.43 204.223 0 368.64-49.559 368.64-125.43 0-58.893-94.601-100.433-235.505-117.64-11.227-1.371-21.44 6.619-22.812 17.846s6.619 21.44 17.846 22.812zm199.27 725.213c0 40.635-147.078 85.422-327.291 85.422S184.86 936.972 184.86 896.337c0-.463.028-.955.086-1.491 1.218-11.245-6.91-21.348-18.155-22.567s-21.348 6.91-22.567 18.155a54.641 54.641 0 00-.324 5.902c0 76.346 164.316 126.382 368.251 126.382s368.251-50.036 368.251-126.382c0-11.311-9.169-20.48-20.48-20.48s-20.48 9.169-20.48 20.48z"></path><path d="M143.697 253.367v646.461c0 11.311 9.169 20.48 20.48 20.48s20.48-9.169 20.48-20.48V253.367c0-11.311-9.169-20.48-20.48-20.48s-20.48 9.169-20.48 20.48zm695.917 0v646.461c0 11.311 9.169 20.48 20.48 20.48s20.48-9.169 20.48-20.48V253.367c0-11.311-9.169-20.48-20.48-20.48s-20.48 9.169-20.48 20.48zm-155.482-4.616c3.451 13.322-7.557 24.218-24.453 24.218h-267.94c-16.896 0-27.894-10.895-24.443-24.218 3.441-13.322 20.091-24.218 36.987-24.218h242.862c16.896 0 33.536 10.895 36.987 24.218z"></path><path d="M610.493 117.674c-6.258-38.164-37.244-69.15-75.408-75.408a92.68 92.68 0 00-107.066 107.067c6.258 38.163 37.244 69.149 75.408 75.407a92.682 92.682 0 00107.066-107.066zm40.42-6.629c14.954 91.175-62.939 169.069-154.115 154.115-55.512-9.102-100.097-53.687-109.199-109.196C372.632 64.789 450.535-13.109 541.713 1.846c55.512 9.102 100.097 53.687 109.2 109.2zm20.256 427.849c47.893 47.893 47.893 125.538 0 173.419L544.774 838.708c-17.963 17.982-47.121 17.982-65.077.007L353.296 712.314c-47.895-47.883-47.895-125.527-.004-173.419 43.311-43.322 110.971-47.458 158.939-12.411 47.968-35.047 115.628-30.911 158.937 12.41zM497.75 567.857c-31.897-31.897-83.604-31.897-115.493 0-31.897 31.897-31.897 83.604 0 115.493l126.41 126.41a5.048 5.048 0 007.136-.007l126.404-126.404c31.895-31.887 31.895-83.594-.004-115.493-31.887-31.895-83.594-31.895-115.491.002-7.998 7.998-20.965 7.998-28.963 0z"></path></g></svg>',
  'donacion' : '<svg fill="#ffffff" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M640.172 171.124c119.859 14.637 199.51 49.612 199.51 76.982 0 15.683-30.577 37.475-87.407 54.605-62.809 18.932-148.567 29.865-240.273 29.865-91.711 0-177.469-10.933-240.277-29.865-56.827-17.13-87.403-38.921-87.403-54.605 0-29.366 89.458-66.158 219.676-79.227 11.254-1.13 19.462-11.169 18.332-22.423s-11.169-19.462-22.423-18.332c-151.876 15.243-256.546 58.29-256.546 119.982 0 75.871 164.41 125.43 368.64 125.43 204.223 0 368.64-49.559 368.64-125.43 0-58.893-94.601-100.433-235.505-117.64-11.227-1.371-21.44 6.619-22.812 17.846s6.619 21.44 17.846 22.812zm199.27 725.213c0 40.635-147.078 85.422-327.291 85.422S184.86 936.972 184.86 896.337c0-.463.028-.955.086-1.491 1.218-11.245-6.91-21.348-18.155-22.567s-21.348 6.91-22.567 18.155a54.641 54.641 0 00-.324 5.902c0 76.346 164.316 126.382 368.251 126.382s368.251-50.036 368.251-126.382c0-11.311-9.169-20.48-20.48-20.48s-20.48 9.169-20.48 20.48z"></path><path d="M143.697 253.367v646.461c0 11.311 9.169 20.48 20.48 20.48s20.48-9.169 20.48-20.48V253.367c0-11.311-9.169-20.48-20.48-20.48s-20.48 9.169-20.48 20.48zm695.917 0v646.461c0 11.311 9.169 20.48 20.48 20.48s20.48-9.169 20.48-20.48V253.367c0-11.311-9.169-20.48-20.48-20.48s-20.48 9.169-20.48 20.48zm-155.482-4.616c3.451 13.322-7.557 24.218-24.453 24.218h-267.94c-16.896 0-27.894-10.895-24.443-24.218 3.441-13.322 20.091-24.218 36.987-24.218h242.862c16.896 0 33.536 10.895 36.987 24.218z"></path><path d="M610.493 117.674c-6.258-38.164-37.244-69.15-75.408-75.408a92.68 92.68 0 00-107.066 107.067c6.258 38.163 37.244 69.149 75.408 75.407a92.682 92.682 0 00107.066-107.066zm40.42-6.629c14.954 91.175-62.939 169.069-154.115 154.115-55.512-9.102-100.097-53.687-109.199-109.196C372.632 64.789 450.535-13.109 541.713 1.846c55.512 9.102 100.097 53.687 109.2 109.2zm20.256 427.849c47.893 47.893 47.893 125.538 0 173.419L544.774 838.708c-17.963 17.982-47.121 17.982-65.077.007L353.296 712.314c-47.895-47.883-47.895-125.527-.004-173.419 43.311-43.322 110.971-47.458 158.939-12.411 47.968-35.047 115.628-30.911 158.937 12.41zM497.75 567.857c-31.897-31.897-83.604-31.897-115.493 0-31.897 31.897-31.897 83.604 0 115.493l126.41 126.41a5.048 5.048 0 007.136-.007l126.404-126.404c31.895-31.887 31.895-83.594-.004-115.493-31.887-31.895-83.594-31.895-115.491.002-7.998 7.998-20.965 7.998-28.963 0z"></path></g></svg>',
  'bomberos' : '<svg fill="#ffffff" height="200px" width="200px" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 297.167 297.167" xmlns:xlink="http://www.w3.org/1999/xlink" enable-background="new 0 0 297.167 297.167"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="m280.667,189.505h-0.833v-38.791c0-6.5-0.165-9.833-2.051-17.459l-13.23-51.309c-1.082-4.265-5.484-7.441-9.885-7.441h-16.834v-8.125c0-4.4-3.267-7.875-7.667-7.875h-17c-4.4,0-8.333,3.475-8.333,7.875v8.125h-41v-16h17.083c4.557,0 7.917-3.818 7.917-8.375v-0.5c0-4.557-3.36-8.125-7.917-8.125h-156.5c-4.557,0-8.583,3.568-8.583,8.125v0.5c0,4.557 4.026,8.375 8.583,8.375h24.417v16.269c-18,2.655-33,18.687-33,38.073v76.559c-9.001,0.266-15.834,7.594-15.834,16.537 0,9.113 7.553,16.563 16.667,16.563h16.507c0,0-0.007,0.104-0.007,0.188 0,18.226 14.774,32.969 33,32.969s33-14.728 33-32.953c0-0.084-0.006-0.203-0.007-0.203h98.014c0,0-0.007,0.104-0.007,0.188 0,18.226 14.774,32.969 33,32.969 18.226,0 33-14.728 33-32.953 0-0.084-0.006-0.203-0.007-0.203h17.507c9.113,0 16.5-7.387 16.5-16.5 0-9.114-7.387-16.503-16.5-16.503zm-30-98l13.5,49h-50.333v-49h36.833zm-102.834-17h-17v-16h17v16zm-49.999,0v-16h17v16h-17zm-16-16v16h-17v-16h17zm-33.001,115h140v16h-140v-16zm25.583,49.125c0,4.557-3.694,8.25-8.25,8.25-4.556,0-8.25-3.693-8.25-8.25 0-4.557 3.694-8.25 8.25-8.25 4.556,0 8.25,3.694 8.25,8.25zm164.001,0c0,4.557-3.694,8.25-8.25,8.25-4.556,0-8.25-3.693-8.25-8.25 0-4.557 3.694-8.25 8.25-8.25 4.555,0 8.25,3.694 8.25,8.25z"></path> </g> </g></svg>',
  'acopio comedor solidario' : '<svg viewBox="0 0 15 15" version="1.1" id="restaurant" xmlns="http://www.w3.org/2000/svg" fill="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path id="path11774" d="M3.5,0l-1,5.5c-0.1464,0.805,1.7815,1.181,1.75,2L4,14c-0.0384,0.9993,1,1,1,1s1.0384-0.0007,1-1L5.75,7.5c-0.0314-0.8176,1.7334-1.1808,1.75-2L6.5,0H6l0.25,4L5.5,4.5L5.25,0h-0.5L4.5,4.5L3.75,4L4,0H3.5z M12,0c-0.7364,0-1.9642,0.6549-2.4551,1.6367C9.1358,2.3731,9,4.0182,9,5v2.5c0,0.8182,1.0909,1,1.5,1L10,14c-0.0905,0.9959,1,1,1,1s1,0,1-1V0z"></path> </g></svg>',
  'acopio para infancias' : '<svg fill="#ffffff" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24.432 24.432" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M6.42,9.301c1.771,0,3.205-1.435,3.205-3.208c0-1.105,0.389-2.117-0.465-2.691C8.648,3.053,6.4,2.888,5.736,2.888 c-0.79,0-1.817,0.644-2.376,1.119C2.665,4.594,3.213,5.111,3.213,6.092C3.213,7.866,4.646,9.301,6.42,9.301z M4.186,5.779 c0.589-0.107,0.989,0.087,0.989,0.087l0.984-0.479c0,0-0.501,0.724-0.051,0.479C7.11,5.53,8.231,5.67,8.801,5.782 c0.02,0.125,0.038,0.253,0.038,0.386c0,1.32-1.048,2.387-2.349,2.387c-1.294,0-2.343-1.067-2.343-2.387 C4.147,6.035,4.165,5.907,4.186,5.779z"></path> <path d="M22.066,5.643c-0.015-0.183-0.03-0.365-0.07-0.541c-0.127-1.124-1.133-3.408-4.02-3.34 c-2.488,0.059-3.031,1.932-3.162,3.072c-0.088,0.28-0.145,0.573-0.164,0.878c-3.236,0.565-2.88,3.849-0.904,3.905 c-0.188-1.715,0.63-2.745,0.945-3.076c0.291,1.771,1.82,3.132,3.672,3.132c1.756,0,3.222-1.223,3.619-2.858 c0.303,0.534,0.812,1.628,0.688,2.803C25.783,9.591,24.251,6.032,22.066,5.643z M18.363,8.617c-1.455,0-2.639-1.172-2.672-2.621 c0.531-0.193,0.925-1.113,0.925-1.113s0.315,0.108,0.315,1.147c0.551,0.192,1.508-1.614,1.508-1.614v1.423 c0.607,0.166,2.521-0.054,2.521-0.054l0.071,0.06c0.001,0.03,0.009,0.061,0.009,0.092C21.042,7.415,19.842,8.617,18.363,8.617z"></path> <polygon points="19.143,9.769 17.568,9.769 16.253,9.769 12.402,14.409 8.675,9.827 4.438,9.827 0,14.699 0.93,15.658 4.107,12.947 4.107,18.205 4.744,18.205 4.744,22.202 4.339,22.202 4.339,22.671 6.184,22.671 6.184,22.202 6.184,18.205 6.875,18.205 6.875,22.202 6.875,22.671 8.716,22.671 8.716,22.202 8.312,22.202 8.312,18.205 9.085,18.205 9.085,13.046 11.625,15.654 12.663,15.398 13.238,15.542 16.115,12.249 16.279,13.554 13.607,18.146 16.689,18.146 16.689,22.144 16.284,22.144 16.284,22.609 18.127,22.609 18.127,22.144 18.129,22.144 18.129,18.146 18.818,18.146 18.818,22.144 18.818,22.609 20.662,22.609 20.662,22.144 20.257,22.144 20.257,18.146 22.646,18.146 20.292,13.554 20.421,11.948 22.67,14.962 24.16,14.591 20.594,9.769 "></polygon> </g> </g> </g></svg>',
  'atencion de salud' : '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="Layer_2" data-name="Layer 2"> <g id="invisible_box" data-name="invisible box"> <rect width="48" height="48" fill="none"></rect> </g> <g id="Medical"> <g> <path d="M41,42H40V9a2.9,2.9,0,0,0-3-3H30V4a2,2,0,0,0-2-2H20a2,2,0,0,0-2,2V6H11A2.9,2.9,0,0,0,8,9V42H7a2,2,0,0,0,0,4H41a2,2,0,0,0,0-4ZM21,7h2V5a1,1,0,0,1,2,0V7h2a1,1,0,0,1,0,2H25v2a1,1,0,0,1-2,0V9H21a1,1,0,0,1,0-2ZM36,42H27V35H21v7H12V10h6v2a2,2,0,0,0,2,2h8a2,2,0,0,0,2-2V10h6Z"></path> <rect x="16" y="17" width="6" height="6"></rect> <rect x="26" y="17" width="6" height="6"></rect> <rect x="16" y="26" width="6" height="6"></rect> <rect x="26" y="26" width="6" height="6"></rect> </g> </g> </g> </g></svg>',
  'atención psicosocial': '<svg fill="#ffffff" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 45.22 45.22" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <circle cx="22.611" cy="5.024" r="3.552"></circle> <path d="M26.436,12.675c-0.399-2-2.289-3.373-4.339-3.099c-1.696,0.225-2.99,1.51-3.309,3.099c1.07-0.792,2.394-1.262,3.824-1.262 S25.364,11.884,26.436,12.675z"></path> <path d="M35.291,29.401c-0.814-0.717-2.057-0.637-2.772,0.178l-2.8,3.18c-0.717,0.814-0.637,2.057,0.178,2.773 c0.373,0.328,0.836,0.49,1.297,0.49c0.545,0,1.087-0.227,1.476-0.668l2.798-3.181C36.186,31.36,36.106,30.118,35.291,29.401z"></path> <path d="M32.669,10.911c-0.718-0.814-1.959-0.894-2.772-0.177c-0.814,0.717-0.895,1.959-0.178,2.773l2.8,3.181 c0.389,0.441,0.931,0.667,1.477,0.667c0.461,0,0.923-0.161,1.297-0.489c0.814-0.717,0.895-1.959,0.177-2.773L32.669,10.911z"></path> <g> <path d="M22.629,23.517c-0.006,0-0.031,0-0.037,0c-1.251,0-2.444,0.567-3.278,1.502c-0.834,0.934-1.231,2.194-1.09,3.438 l2.019,13.048c0.138,1.229,1.144,2.244,2.368,2.244c1.226,0,2.229-1.007,2.37-2.238l2.017-13.056 c0.142-1.243-0.256-2.504-1.09-3.438C25.072,24.085,23.881,23.517,22.629,23.517z"></path> <circle cx="22.61" cy="18.078" r="4.33"></circle> </g> <g> <path d="M41.219,17.509c-0.005,0-0.027,0-0.033,0c-1.14,0-2.226,0.517-2.984,1.367c-0.76,0.85-1.121,1.998-0.993,3.131 l1.837,11.878c0.126,1.12,1.042,2.043,2.156,2.043c1.115,0,2.03-0.917,2.157-2.036l1.836-11.887 c0.128-1.132-0.233-2.279-0.992-3.129S42.358,17.509,41.219,17.509z"></path> <circle cx="41.202" cy="12.557" r="3.942"></circle> </g> </g> <g> <path d="M9.93,29.401c0.815-0.717,2.057-0.637,2.773,0.178l2.799,3.18c0.717,0.814,0.637,2.057-0.177,2.773 c-0.373,0.328-0.836,0.49-1.297,0.49c-0.545,0-1.087-0.227-1.476-0.668l-2.798-3.181C9.036,31.36,9.114,30.118,9.93,29.401z"></path> <path d="M12.55,10.911c0.718-0.814,1.959-0.894,2.773-0.177c0.814,0.717,0.894,1.959,0.177,2.773l-2.799,3.181 c-0.389,0.441-0.931,0.667-1.477,0.667c-0.461,0-0.923-0.161-1.297-0.489c-0.814-0.717-0.894-1.959-0.177-2.773L12.55,10.911z"></path> <g> <path d="M4.001,17.509c0.005,0,0.028,0,0.034,0c1.139,0,2.225,0.517,2.984,1.367c0.76,0.85,1.121,1.998,0.993,3.131L6.174,33.885 c-0.126,1.12-1.042,2.043-2.156,2.043c-1.115,0-2.03-0.917-2.157-2.036L0.025,22.005c-0.128-1.132,0.233-2.279,0.992-3.129 C1.776,18.026,2.861,17.509,4.001,17.509z"></path> <circle cx="4.019" cy="12.557" r="3.942"></circle> </g> </g> </g> </g></svg>',
  'ayuda animal': '<svg fill="currentColor" viewBox="0 0 50 50" version="1.2" baseProfile="tiny" xmlns="http://www.w3.org/2000/svg" overflow="inherit"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M18.48 18.875c2.33-.396 4.058-2.518 4.321-5.053.267-2.578.869-12.938-3.02-12.279-10.088 1.711-9.38 18.702-1.301 17.332zm13.273 0c8.077 1.37 8.785-15.621-1.303-17.333-3.888-.659-3.287 9.701-3.021 12.279.264 2.536 1.994 4.658 4.324 5.054zm-17.417 8.005c0-1.348-.481-2.57-1.256-3.459-1.275-1.666-5.328-5.035-6.323-4.172-2.077 1.806-2.01 6.251-.759 9.481.643 1.796 2.196 3.059 4.011 3.059 2.389 0 4.327-2.198 4.327-4.909zm29.137-7.631c-.993-.863-5.046 2.506-6.321 4.172-.775.889-1.257 2.111-1.257 3.459 0 2.711 1.94 4.909 4.327 4.909 1.816 0 3.37-1.263 4.013-3.059 1.248-3.23 1.317-7.675-.762-9.481zm-8.136 15.277c-3.676-1.833-3.562-5.363-4.398-8.584-.665-2.569-3.02-4.469-5.823-4.469-2.743 0-5.057 1.821-5.779 4.312-.895 3.082-.356 6.67-4.363 8.717-3.255 1.061-4.573 2.609-4.573 6.27 0 2.974 2.553 6.158 5.848 6.554 3.676.554 6.544-.17 8.867-1.494 2.323 1.324 5.189 2.047 8.871 1.494 3.293-.396 5.847-3.568 5.847-6.554-.001-3.741-1.235-5.135-4.497-6.246zm-4.337 4.474h-3.811l.005 4h-4.156l.006-4h-4.044v-4h4.045l-.006-4h4.156l-.005 4h3.81v4z"></path></g></svg>'
};

// Labels de tipos
export const TYPE_LABELS = {
  albergue: 'Albergue',
  acopio: 'Centro de Acopio',
  hidratacion: 'Punto de Hidratación',
  riesgo: 'Zona de Riesgo',
  ayuda: 'Punto de Ayuda',
  donacion: 'Centro de Donación',
  rescate: 'Punto de Rescate',
  refugio: 'Refugio',
  'ayuda animal': 'Atención veterinaria',
  bomberos: 'Bomberos',
  'caridad': 'Evento benéfico',
  'atención psicosocial' : 'Atención psicosocial',
  'atencion de salud' : 'Atención de salud',
  'acopio para infancias' : 'Acopio para infancias',
  'acopio comedor solidario' : 'Comedor solidario'

};

/**
 * Obtiene el label de un tipo, normalizando primero
 */
export function getTypeLabel(type) {
  const normalizedType = normalizeType(type);
  return TYPE_LABELS[normalizedType] || type;
}

/**
 * Crea un icono SVG personalizado para Leaflet
 */
function createMarkerIcon(type, status) {
  const normalizedType = normalizeType(type);
  const color = getColorForType(type);
  const borderColor = status === 'full' ? '#EF4444' : 
                      status === 'closed' ? '#6B7280' : color;
  const svg = ICONS_SVG[normalizedType]; // Sin fallback - puede ser undefined
  
  // Si no hay icono específico, solo mostrar el círculo de color
  const iconHTML = svg ? `
    <div class="marker-icon" style="color: white;">
      ${svg}
    </div>
  ` : '';
  
  const html = `
    <div class="custom-marker" style="
      background: ${color};
      border: 3px solid ${borderColor};
      ${status === 'full' ? 'opacity: 0.75;' : ''}
    ">
      ${iconHTML}
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
  const typeLabel = getTypeLabel(point.type);
  const color = getColorForType(point.type);

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
