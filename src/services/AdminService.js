/**
 * Servicio de Administración - CRUD de puntos y usuarios
 */

import { authService } from './AuthService.js';

// URL del backend Go
// En desarrollo usa rutas relativas (proxy de Vite)
// En producción usa la URL base del sitio
const API_URL = import.meta.env.VITE_API_URL || '';

class AdminService {
  constructor() {}

  // ==================== PUNTOS ====================

  /**
   * Obtiene todos los puntos (sin filtrar por estado) - requiere auth
   */
  async getAllPuntos(page = 1, perPage = 50, filters = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: perPage.toString()
    });
    
    if (filters.estado) {
      params.append('estado', filters.estado);
    }
    if (filters.categoria) {
      params.append('categoria', filters.categoria);
    }
    if (filters.ciudad) {
      params.append('ciudad', filters.ciudad);
    }
    
    const response = await fetch(`${API_URL}/api/admin/puntos?${params}`, {
      headers: authService.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Error obteniendo puntos');
    }
    
    const result = await response.json();
    
    return {
      items: result.data || [],
      page: result.page || 1,
      perPage: result.limit || perPage,
      totalItems: result.total || 0,
      totalPages: Math.ceil((result.total || 0) / perPage)
    };
  }

  /**
   * Obtiene un punto por ID
   */
  async getPunto(id) {
    const response = await fetch(`${API_URL}/api/admin/puntos/${id}`, {
      headers: authService.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Punto no encontrado');
    }
    
    return await response.json();
  }

  /**
   * Crea un nuevo punto
   */
  async createPunto(data) {
    const response = await fetch(`${API_URL}/api/admin/puntos`, {
      method: 'POST',
      headers: authService.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Error creando punto');
    }
    
    return await response.json();
  }

  /**
   * Actualiza un punto existente
   */
  async updatePunto(id, data) {
    const response = await fetch(`${API_URL}/api/admin/puntos/${id}`, {
      method: 'PATCH',
      headers: authService.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Error actualizando punto');
    }
    
    return await response.json();
  }

  /**
   * Elimina un punto
   */
  async deletePunto(id) {
    const response = await fetch(`${API_URL}/api/admin/puntos/${id}`, {
      method: 'DELETE',
      headers: authService.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Error eliminando punto');
    }
    
    return { success: true };
  }

  /**
   * Cambia el estado de un punto rápidamente
   */
  async changeEstado(id, nuevoEstado) {
    const response = await fetch(`${API_URL}/api/admin/puntos/${id}/estado`, {
      method: 'PATCH',
      headers: authService.getAuthHeaders(),
      body: JSON.stringify({ estado: nuevoEstado })
    });
    
    if (!response.ok) {
      throw new Error('Error cambiando estado');
    }
    
    return await response.json();
  }

  /**
   * Verifica un punto (cambia estado a publicado)
   */
  async verificarPunto(id, notasInternas = '') {
    return await this.changeEstado(id, 'publicado');
  }

  /**
   * Rechaza un punto
   */
  async rechazarPunto(id, motivo = '') {
    return await this.updatePunto(id, {
      estado: 'rechazado',
      notas_internas: `RECHAZADO: ${motivo}`
    });
  }

  // ==================== SOLICITUDES EXTERNAS ====================

  /**
   * Funcionalidad de solicitudes pendiente de implementar en backend Go
   */
  async getSolicitudes(page = 1, perPage = 20, onlyPending = true) {
    console.warn('⚠️ getSolicitudes: Funcionalidad pendiente de implementar');
    return { items: [], page: 1, perPage, totalItems: 0, totalPages: 0 };
  }

  async marcarProcesada(id) {
    console.warn('⚠️ marcarProcesada: Funcionalidad pendiente de implementar');
    return null;
  }

  async convertirAPunto(solicitudId, datosAdicionales = {}) {
    console.warn('⚠️ convertirAPunto: Funcionalidad pendiente de implementar');
    return null;
  }

  // ==================== ESTADÍSTICAS ====================

  /**
   * Obtiene estadísticas generales
   * Calcula localmente desde todos los puntos
   */
  async getEstadisticas() {
    // Obtener todos los puntos
    const result = await this.getAllPuntos(1, 5000);
    const puntos = result.items;
    
    // Calcular stats
    const stats = {
      total: puntos.length,
      publicados: puntos.filter(p => p.estado === 'publicado').length,
      enRevision: puntos.filter(p => p.estado === 'revision').length,
      ocultos: puntos.filter(p => p.estado === 'oculto').length,
      rechazados: puntos.filter(p => p.estado === 'rechazado').length,
      solicitudesPendientes: 0, // TODO: Implementar cuando exista endpoint
      
      // Por categoría
      porCategoria: {
        informacion: puntos.filter(p => p.categoria === 'informacion').length,
        acopio: puntos.filter(p => p.categoria === 'acopio').length,
        solicitud_ayuda: puntos.filter(p => p.categoria === 'solicitud_ayuda').length,
        sos: puntos.filter(p => p.categoria === 'sos').length
      },
      
      // Últimos 7 días
      ultimosDias: this.calcularUltimosDias(puntos, 7)
    };
    
    return stats;
  }

  calcularUltimosDias(puntos, dias) {
    const ahora = new Date();
    const hace7Dias = new Date(ahora.getTime() - dias * 24 * 60 * 60 * 1000);
    
    return puntos.filter(p => {
      const created = p.created || p.created_at;
      return created && new Date(created) > hace7Dias;
    }).length;
  }

  // ==================== USUARIOS ====================

  /**
   * Obtiene lista de usuarios (solo superadmin)
   */
  async getUsuarios(page = 1, perPage = 20) {
    if (!authService.isSuperAdmin()) {
      throw new Error('No tienes permisos para ver usuarios');
    }
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: perPage.toString()
    });
    
    const response = await fetch(`${API_URL}/api/admin/users?${params}`, {
      headers: authService.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Error obteniendo usuarios');
    }
    
    const result = await response.json();
    
    return {
      items: result.data || [],
      page: result.page || 1,
      perPage: result.limit || perPage,
      totalItems: result.total || 0,
      totalPages: Math.ceil((result.total || 0) / perPage)
    };
  }

  /**
   * Crea un nuevo usuario (solo superadmin)
   */
  async createUsuario(userData) {
    if (!authService.isSuperAdmin()) {
      throw new Error('No tienes permisos para crear usuarios');
    }
    
    const response = await fetch(`${API_URL}/api/admin/users`, {
      method: 'POST',
      headers: authService.getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      throw new Error('Error creando usuario');
    }
    
    return await response.json();
  }

  /**
   * Actualiza rol de un usuario (solo superadmin)
   * Nota: Funcionalidad pendiente en backend
   */
  async updateUsuarioRol(userId, rol) {
    if (!authService.isSuperAdmin()) {
      throw new Error('No tienes permisos para modificar usuarios');
    }
    
    console.warn('⚠️ updateUsuarioRol: Funcionalidad pendiente de implementar en backend');
    return null;
  }

  /**
   * Activa/desactiva un usuario (solo superadmin)
   * Nota: Funcionalidad pendiente en backend
   */
  async toggleUsuarioActivo(userId, activo) {
    if (!authService.isSuperAdmin()) {
      throw new Error('No tienes permisos para modificar usuarios');
    }
    
    console.warn('⚠️ toggleUsuarioActivo: Funcionalidad pendiente de implementar en backend');
    return null;
  }
}

export const adminService = new AdminService();
