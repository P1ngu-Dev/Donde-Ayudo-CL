// Repositorio de datos con Backend Go + SQLite
// Fuente de verdad: Go API -> LocalStorage (cache) -> Memoria

const STORAGE_KEY = 'donde-ayudo-data';

// URL del backend Go
// En desarrollo usa rutas relativas (proxy de Vite)
// En producción usa la URL base del sitio
const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Transforma un registro de la API Go al formato que espera el frontend
 * Esto permite mantener compatibilidad con el código existente del mapa
 */
function transformAPItoFrontend(record) {
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
    status: record.estado === 'activo' ? 'active' : 'inactive',
    contact: record.contacto_principal,
    verified: record.estado === 'activo',
    verificator: record.entidad_verificadora,
    
    // Horario como string
    schedule: record.horario ? { formatted: record.horario } : null,
    
    // Necesidades (usa tags si existen, sino el texto raw)
    supplies_needed: record.necesidades_tags || [],
    info: record.necesidades_raw || '',
    
    // Campos nuevos del sistema
    categoria: record.categoria,
    subtipo: record.subtipo,
    categorias_ayuda: record.categorias_ayuda || [],
    nivel_urgencia: record.nivel_urgencia,
    estado: record.estado,
    capacidad_estado: record.capacidad_estado,
    contacto_nombre: record.contacto_nombre,
    entidad_verificadora: record.entidad_verificadora,
    fecha_verificacion: record.fecha_verificacion,
    
    // Campos específicos de solicitudes de ayuda
    nombre_zona: record.nombre_zona,
    habitado_actualmente: record.habitado_actualmente,
    cantidad_ninos: record.cantidad_ninos,
    cantidad_adolescentes: record.cantidad_adolescentes,
    cantidad_adultos: record.cantidad_adultos,
    cantidad_ancianos: record.cantidad_ancianos,
    animales_detalle: record.animales_detalle,
    
    // Riesgos y logística
    riesgo_asbesto: record.riesgo_asbesto,
    foto_asbesto: record.foto_asbesto,
    logistica_llegada: record.logistica_llegada,
    tipos_acceso: record.tipos_acceso || [],
    requiere_voluntarios: record.requiere_voluntarios,
    
    // Infraestructura
    tiene_banos: record.tiene_banos,
    tiene_electricidad: record.tiene_electricidad,
    tiene_senal: record.tiene_senal,
    
    // Evidencia
    evidencia_fotos: record.evidencia_fotos || [],
    archivo_kml: record.archivo_kml,
    
    // Metadatos
    created_at: record.created,
    updated_at: record.updated,
    created_by: record.created_by
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
    
    // 2. Intentar actualizar desde la API
    try {
      const freshData = await this.fetchFromAPI();
      // Solo actualizar si los datos son diferentes
      if (freshData.length > 0) {
        this.saveToStorage(freshData);
        this.points = freshData;
        this.cache.clear();
      }
    } catch (error) {
      console.warn('⚠️ No se pudo conectar a la API, usando caché local:', error.message);
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
   * Obtiene datos desde la API Go
   * Solo trae puntos con estado "publicado" por defecto
   */
  async fetchFromAPI(includeUnverified = false) {
    const response = await fetch(`${API_URL}/api/puntos?limit=1000`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    const allRecords = result.data || [];
    
    // Filtrar en cliente si necesario
    // Permitimos SOS en revisión para que aparezcan como reportes de la comunidad
    const records = includeUnverified 
      ? allRecords 
      : allRecords.filter(r => r.estado === 'publicado' || (r.estado === 'revision' && r.categoria === 'sos'));
    
    console.log(`🌐 Obtenidos ${records.length} puntos desde API (${allRecords.length} totales)`);
    
    // Transformar al formato del frontend
    return records.map(transformAPItoFrontend);
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
   * Nota: La API actual no tiene este endpoint, se puede implementar más tarde
   */
  async submitExternalRequest(data, origen = 'web') {
    try {
      console.warn('⚠️ submitExternalRequest: Funcionalidad pendiente de implementar en backend Go');
      // TODO: Implementar endpoint /api/solicitudes en backend Go
      return { success: false, error: 'Funcionalidad no disponible temporalmente' };
    } catch (error) {
      console.error('❌ Error enviando solicitud:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envía una alerta SOS directa al mapa (estado: revision)
   * Requiere autenticación en el futuro
   */
  async submitSOS(data) {
    try {
      console.warn('⚠️ submitSOS: Funcionalidad pendiente - requiere autenticación en backend Go');
      // TODO: Implementar endpoint POST /api/puntos público o con auth opcional
      // Por ahora los SOS se crean manualmente por admins
      return { success: false, error: 'Los reportes SOS deben ser creados por administradores por el momento' };
    } catch (error) {
       console.error('❌ Error enviando SOS:', error);
       return { success: false, error: error.message };
    }
  }

  /**
   * Fuerza recarga desde la API
   */
  async refresh() {
    const freshData = await this.fetchFromAPI();
    this.saveToStorage(freshData);
    this.points = freshData;
    this.cache.clear();
    return this.points;
  }
}

export const repository = new DataRepository();
