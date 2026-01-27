// Repositorio de datos con PocketBase
// Fuente de verdad: PocketBase API -> LocalStorage (cache) -> Memoria

import PocketBase from 'pocketbase';

const STORAGE_KEY = 'donde-ayudo-data';

// URL de PocketBase - cambiar en producción
const POCKETBASE_URL = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';

// Instancia global de PocketBase
export const pb = new PocketBase(POCKETBASE_URL);

/**
 * Transforma un registro de PocketBase al formato que espera el frontend
 * Esto permite mantener compatibilidad con el código existente del mapa
 */
function transformPBtoFrontend(record) {
  return {
    // Campos que el frontend ya usa (compatibilidad)
    id: record.id,
    name: record.nombre,
    type: record.subtipo || record.categoria, // Usa subtipo si existe, sino categoria
    lat: record.latitud,
    lng: record.longitud,
    city: record.ciudad,
    address: record.direccion,
    place: record.nombre,
    status: record.estado === 'publicado' ? 'active' : 'inactive',
    contact: record.contacto_principal,
    verified: record.estado === 'publicado',
    verificator: record.entidad_verificadora,
    
    // Horario como string
    schedule: record.horario ? { formatted: record.horario } : null,
    
    // Necesidades (usa tags si existen, sino el texto raw)
    supplies_needed: record.necesidades_tags || [],
    info: record.necesidades_raw || '',
    
    // Campos nuevos del sistema PocketBase
    categoria: record.categoria,
    subtipo: record.subtipo,
    estado: record.estado,
    capacidad_estado: record.capacidad_estado,
    contacto_nombre: record.contacto_nombre,
    entidad_verificadora: record.entidad_verificadora,
    fecha_verificacion: record.fecha_verificacion,
    
    // Campos específicos de solicitudes de ayuda
    nombre_zona: record.nombre_zona,
    habitado_actualmente: record.habitado_actualmente,
    cantidad_ninos: record.cantidad_ninos,
    cantidad_adultos: record.cantidad_adultos,
    cantidad_ancianos: record.cantidad_ancianos,
    animales_detalle: record.animales_detalle,
    riesgo_asbesto: record.riesgo_asbesto,
    logistica_llegada: record.logistica_llegada,
    requiere_voluntarios: record.requiere_voluntarios,
    urgencia: record.urgencia,
    
    // Metadatos
    created_at: record.created,
    updated_at: record.updated
  };
}

export class DataRepository {
  constructor() {
    this.points = [];
    this.lastUpdated = null;
    this.cache = new Map(); // Cache en memoria para filtros
  }

  /**
   * Inicializa el repositorio cargando datos
   * Estrategia: Cache-First, luego Network
   */
  async initialize() {
    // 1. Cargar caché local inmediato (para velocidad)
    this.loadFromStorage();
    
    // 2. Intentar actualizar desde PocketBase
    try {
      const freshData = await this.fetchFromPocketBase();
      // Solo actualizar si los datos son diferentes
      if (freshData.length > 0) {
        this.saveToStorage(freshData);
        this.points = freshData;
        this.cache.clear();
      }
    } catch (error) {
      console.warn('⚠️ No se pudo conectar a PocketBase, usando caché local:', error.message);
      // Si no hay datos en caché, intentar cargar el JSON estático como fallback
      if (this.points.length === 0) {
        try {
          await this.loadFallbackJSON();
        } catch (e) {
          console.error('❌ No hay datos disponibles');
        }
      }
    }
    
    return this.points;
  }

  loadFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        this.points = parsed.data || [];
        this.lastUpdated = parsed.timestamp;
        console.log(`📦 Cargados ${this.points.length} puntos desde caché local`);
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  /**
   * Obtiene datos desde PocketBase
   * Solo trae puntos con estado "publicado" por defecto
   */
  async fetchFromPocketBase(includeUnverified = false) {
    // Traer todos los puntos sin sort (sort estaba causando el error 400)
    let allRecords = [];
    let page = 1;
    const perPage = 500;
    
    while (true) {
      const result = await pb.collection('puntos').getList(page, perPage);
      
      allRecords = allRecords.concat(result.items);
      
      if (result.items.length < perPage) {
        break; // Ya no hay más páginas
      }
      page++;
    }
    
    // Filtrar en cliente si necesario
    const records = includeUnverified 
      ? allRecords 
      : allRecords.filter(r => r.estado === 'publicado');
    
    console.log(`🌐 Obtenidos ${records.length} puntos desde PocketBase (${allRecords.length} totales)`);
    
    // Transformar al formato del frontend
    return records.map(transformPBtoFrontend);
  }

  /**
   * Fallback: cargar desde JSON estático si PocketBase no está disponible
   */
  async loadFallbackJSON() {
    const response = await fetch('/src/data/data1.json');
    if (response.ok) {
      const data = await response.json();
      this.points = data;
      console.log(`📄 Fallback: Cargados ${data.length} puntos desde JSON local`);
    }
  }

  saveToStorage(data) {
    const payload = {
      timestamp: new Date().toISOString(),
      data: data
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      // Quota excedida en LocalStorage - ignorar
    }
  }

  getAllPoints() {
    return this.points;
  }

  getPointsByType(type) {
    if (!type || type === 'todos') return this.points;
    
    if (this.cache.has(type)) {
      return this.cache.get(type);
    }
    
    // Filtrar por subtipo o categoria
    const filtered = this.points.filter(p => 
      p.type === type || p.subtipo === type || p.categoria === type
    );
    this.cache.set(type, filtered);
    return filtered;
  }

  getPointsByCategory(categoria) {
    return this.points.filter(p => p.categoria === categoria);
  }

  /**
   * Envía una solicitud externa (SOS o datos de usuario)
   * Esto va a la tabla solicitudes_externas
   */
  async submitExternalRequest(data, origen = 'web') {
    try {
      const record = await pb.collection('solicitudes_externas').create({
        origen: origen,
        datos_brutos: data,
        procesado: false
      });
      console.log('✅ Solicitud enviada:', record.id);
      return { success: true, id: record.id };
    } catch (error) {
      console.error('❌ Error enviando solicitud:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fuerza recarga desde PocketBase
   */
  async refresh() {
    const freshData = await this.fetchFromPocketBase();
    this.saveToStorage(freshData);
    this.points = freshData;
    this.cache.clear();
    return this.points;
  }
}

export const repository = new DataRepository();
