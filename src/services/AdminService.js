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
   * Verifica un punto (cambia estado a activo y registra verificador)
   */
  async verificarPunto(id, entidadVerificadora = '') {
    const data = {
      estado: 'activo',
      entidad_verificadora: entidadVerificadora,
      fecha_verificacion: new Date().toISOString()
    };
    return await this.updatePunto(id, data);
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
    
    // Calcular stats con nuevos estados
    const stats = {
      total: puntos.length,
      activos: puntos.filter(p => p.estado === 'activo').length,
      pendientes: puntos.filter(p => p.estado === 'pendiente').length,
      inactivos: puntos.filter(p => p.estado === 'inactivo').length,
      cerrados: puntos.filter(p => p.estado === 'cerrado').length,
      solicitudesPendientes: 0, // TODO: Implementar cuando exista endpoint
      
      // Por categoría con nuevos valores
      porCategoria: {
        acopio: puntos.filter(p => p.categoria === 'acopio').length,
        albergue: puntos.filter(p => p.categoria === 'albergue').length,
        hidratacion: puntos.filter(p => p.categoria === 'hidratacion').length,
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
   * Crea un nuevo usuario con contraseña temporal (solo superadmin)
   */
  async createUsuarioWithTempPassword(userData) {
    if (!authService.isSuperAdmin()) {
      throw new Error('No tienes permisos para crear usuarios');
    }
    
    // Asegurar que el flag de cambio de contraseña esté presente
    const dataToSend = {
      email: userData.email,
      name: userData.name,
      password: userData.password,
      rol: userData.rol,
      organizacion: userData.organizacion || '',
      must_change_password: true
    };
    
    const response = await fetch(`${API_URL}/api/admin/users`, {
      method: 'POST',
      headers: authService.getAuthHeaders(),
      body: JSON.stringify(dataToSend)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error creando usuario');
    }
    
    return await response.json();
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
   * Cambiar contraseña del usuario actual
   */
  async changePassword(currentPassword, newPassword) {
    const response = await fetch(`${API_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: authService.getAuthHeaders(),
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error cambiando contraseña');
    }
    
    return await response.json();
  }

  /**
   * Confirmar contraseña temporal (primer inicio de sesión)
   */
  async confirmTempPassword(newPassword, keepTempPassword = false) {
    const response = await fetch(`${API_URL}/api/auth/confirm-password`, {
      method: 'POST',
      headers: authService.getAuthHeaders(),
      body: JSON.stringify({
        new_password: newPassword,
        keep_temp_password: keepTempPassword
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error confirmando contraseña');
    }
    
    return await response.json();
  }

  /**
   * Actualiza rol de un usuario (solo superadmin)
   */
  async updateUsuarioRol(userId, rol) {
    if (!authService.isSuperAdmin()) {
      throw new Error('No tienes permisos para modificar usuarios');
    }
    
    const response = await fetch(`${API_URL}/api/admin/users/${userId}/rol`, {
      method: 'PATCH',
      headers: authService.getAuthHeaders(),
      body: JSON.stringify({ rol })
    });
    
    if (!response.ok) {
      throw new Error('Error actualizando rol de usuario');
    }
    
    return await response.json();
  }

  /**
   * Activa/desactiva un usuario (solo superadmin)
   */
  async toggleUsuarioActivo(userId, activo) {
    if (!authService.isSuperAdmin()) {
      throw new Error('No tienes permisos para modificar usuarios');
    }
    
    const response = await fetch(`${API_URL}/api/admin/users/${userId}/toggle-active`, {
      method: 'PATCH',
      headers: authService.getAuthHeaders(),
      body: JSON.stringify({ activo })
    });
    
    if (!response.ok) {
      throw new Error('Error cambiando estado del usuario');
    }
    
    return await response.json();
  }
}

export const adminService = new AdminService();
