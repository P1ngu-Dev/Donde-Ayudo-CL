// Repositorio de datos con estrategia Offline-First
// Fuente de verdad: API (simulada por mock) -> LocalStorage -> Memoria

const STORAGE_KEY = 'donde-ayudo-data';
const MOCK_URL = '/src/data/data1.json'; // Vite servirá esto como estático en dev

export class DataRepository {
  constructor() {
    this.points = [];
    this.lastUpdated = null;
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
      this.saveToStorage(freshData);
      this.points = freshData;
      console.log('Datos actualizados desde red');
    } catch (error) {
      console.warn('Modo offline: usando datos en caché', error);
      if (this.points.length === 0) {
        console.error('No hay datos disponibles ni en caché ni en red');
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
        console.log('Datos cargados de LocalStorage', this.points.length);
      } catch (e) {
        console.error('Error al leer LocalStorage', e);
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
      console.warn('Quota excedida en LocalStorage', e);
    }
  }

  getAllPoints() {
    return this.points;
  }

  getPointsByType(type) {
    if (!type || type === 'todos') return this.points;
    return this.points.filter(p => p.type === type);
  }
}

export const repository = new DataRepository();
