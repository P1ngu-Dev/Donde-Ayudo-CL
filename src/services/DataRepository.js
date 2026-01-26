// Repositorio de datos con estrategia Offline-First
// Fuente de verdad: API (simulada por mock) -> LocalStorage -> Memoria

const STORAGE_KEY = 'donde-ayudo-data';
const MOCK_URL = '/src/data/data1.json'; // Vite servirá esto como estático en dev

export class DataRepository {
  constructor() {
    this.points = [];
    this.lastUpdated = null;
    this.cache = new Map(); // Cache en memoria para filtros
  }

  /**
   * Inicializa el repositorio cargando datos
   * Estrategia: Cache-First (Network en background) para velocidad,
   * o Network-First para frescura.
   * Dado el contexto de emergencia, usaremos: 
   * "Stale-While-Revalidate" manual:
   * 1. Cargar de LocalStorage (rápido)
   * 2. Intentar fetch de red
   * 3. Si red responde, actualizar LocalStorage y notificar
   */
  async initialize() {
    // 1. Cargar caché local inmediato
    this.loadFromStorage();
    
    // 2. Intentar actualizar desde red (Mock/API)
    try {
      const freshData = await this.fetchFromNetwork();
      // Solo actualizar si los datos son diferentes
      if (JSON.stringify(freshData) !== JSON.stringify(this.points)) {
        this.saveToStorage(freshData);
        this.points = freshData;
        this.cache.clear(); // Limpiar cache de filtros
      }
    } catch (error) {
      // Modo offline: usando datos en caché
      if (this.points.length === 0) {
        // No hay datos disponibles
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
      } catch (e) {
        // Error al leer LocalStorage
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  async fetchFromNetwork() {
    // Aquí en el futuro se cambiará por la URL de PocketBase
    // const response = await fetch('https://api.dondeayudo.cl/points');
    
    // Por ahora, simulamos un delay de red y cargamos el mock
    const response = await fetch(MOCK_URL);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  }

  saveToStorage(data) {
    const payload = {
      timestamp: new Date().toISOString(),
      data: data
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      // Quota excedida en LocalStorage - ignorar silenciosamente
    }
  }

  getAllPoints() {
    return this.points;
  }

  getPointsByType(type) {
    if (!type || type === 'todos') return this.points;
    
    // Usar cache para evitar filtrar repetidamente
    if (this.cache.has(type)) {
      return this.cache.get(type);
    }
    
    const filtered = this.points.filter(p => p.type === type);
    this.cache.set(type, filtered);
    return filtered;
  }
}

export const repository = new DataRepository();
