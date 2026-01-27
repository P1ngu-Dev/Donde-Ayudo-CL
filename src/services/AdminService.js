/**
 * Servicio de Administración - CRUD de puntos y solicitudes
 */

import { pb } from './DataRepository.js';
import { authService } from './AuthService.js';

class AdminService {
  constructor() {}

  // ==================== PUNTOS ====================

  /**
   * Obtiene todos los puntos (sin filtrar por estado)
   */
  async getAllPuntos(page = 1, perPage = 50, filters = {}) {
    const filterParts = [];
    
    if (filters.estado) {
      filterParts.push(`estado = "${filters.estado}"`);
    }
    if (filters.categoria) {
      filterParts.push(`categoria = "${filters.categoria}"`);
    }
    if (filters.search) {
      filterParts.push(`(nombre ~ "${filters.search}" || ciudad ~ "${filters.search}" || direccion ~ "${filters.search}")`);
    }
    
    const filterString = filterParts.join(' && ');
    
    const result = await pb.collection('puntos').getList(page, perPage, {
      filter: filterString || undefined
    });
    
    return {
      items: result.items,
      page: result.page,
      perPage: result.perPage,
      totalItems: result.totalItems,
      totalPages: result.totalPages
    };
  }

  /**
   * Obtiene un punto por ID
   */
  async getPunto(id) {
    return await pb.collection('puntos').getOne(id);
  }

  /**
   * Crea un nuevo punto
   */
  async createPunto(data) {
    // Agregar info de verificación
    const user = authService.getCurrentUser();
    const enrichedData = {
      ...data,
      verificado_por: user?.id,
      entidad_verificadora: user?.organizacion || user?.name || 'Admin Web',
      fecha_verificacion: new Date().toISOString()
    };
    
    return await pb.collection('puntos').create(enrichedData);
  }

  /**
   * Actualiza un punto existente
   */
  async updatePunto(id, data) {
    // Si se cambia el estado a publicado, agregar info de verificación
    if (data.estado === 'publicado') {
      const user = authService.getCurrentUser();
      data.verificado_por = user?.id;
      data.entidad_verificadora = user?.organizacion || user?.name || 'Admin Web';
      data.fecha_verificacion = new Date().toISOString();
    }
    
    return await pb.collection('puntos').update(id, data);
  }

  /**
   * Elimina un punto
   */
  async deletePunto(id) {
    return await pb.collection('puntos').delete(id);
  }

  /**
   * Cambia el estado de un punto rápidamente
   */
  async changeEstado(id, nuevoEstado) {
    return await this.updatePunto(id, { estado: nuevoEstado });
  }

  /**
   * Verifica un punto (cambia estado a publicado)
   */
  async verificarPunto(id, notasInternas = '') {
    const user = authService.getCurrentUser();
    return await pb.collection('puntos').update(id, {
      estado: 'publicado',
      verificado_por: user?.id,
      entidad_verificadora: user?.organizacion || user?.name || 'Admin Web',
      fecha_verificacion: new Date().toISOString(),
      notas_internas: notasInternas
    });
  }

  /**
   * Rechaza un punto
   */
  async rechazarPunto(id, motivo = '') {
    return await pb.collection('puntos').update(id, {
      estado: 'rechazado',
      notas_internas: `RECHAZADO: ${motivo}`
    });
  }

  // ==================== SOLICITUDES EXTERNAS ====================

  /**
   * Obtiene solicitudes externas (bandeja de entrada)
   */
  async getSolicitudes(page = 1, perPage = 20, onlyPending = true) {
    const filter = onlyPending ? 'procesado = false' : '';
    
    return await pb.collection('solicitudes_externas').getList(page, perPage, {
      filter: filter || undefined
    });
  }

  /**
   * Marca una solicitud como procesada
   */
  async marcarProcesada(id) {
    return await pb.collection('solicitudes_externas').update(id, {
      procesado: true
    });
  }

  /**
   * Convierte una solicitud externa en un punto
   */
  async convertirAPunto(solicitudId, datosAdicionales = {}) {
    // 1. Obtener la solicitud
    const solicitud = await pb.collection('solicitudes_externas').getOne(solicitudId);
    const datos = solicitud.datos_brutos;
    
    // 2. Crear el punto con los datos de la solicitud + adicionales
    const punto = await this.createPunto({
      nombre: datos.nombre || 'Sin nombre',
      latitud: datos.lat || datos.latitud || 0,
      longitud: datos.lng || datos.longitud || 0,
      direccion: datos.direccion || '',
      ciudad: datos.ciudad || '',
      categoria: datos.categoria || 'informacion',
      subtipo: datos.subtipo || datos.type || '',
      contacto_principal: datos.contacto || datos.telefono || '',
      necesidades_raw: datos.descripcion || datos.necesidades || '',
      estado: 'revision', // Por defecto en revisión
      ...datosAdicionales
    });
    
    // 3. Marcar solicitud como procesada
    await this.marcarProcesada(solicitudId);
    
    return punto;
  }

  // ==================== ESTADÍSTICAS ====================

  /**
   * Obtiene estadísticas generales
   */
  async getEstadisticas() {
    // Obtener todos los puntos (con paginación grande para respetar reglas de API)
    const puntosResult = await pb.collection('puntos').getList(1, 5000);
    const solicitudesResult = await pb.collection('solicitudes_externas').getList(1, 5000);
    
    const puntos = puntosResult.items;
    const solicitudes = solicitudesResult.items;
    
    // Calcular stats
    const stats = {
      total: puntos.length,
      publicados: puntos.filter(p => p.estado === 'publicado').length,
      enRevision: puntos.filter(p => p.estado === 'revision').length,
      ocultos: puntos.filter(p => p.estado === 'oculto').length,
      rechazados: puntos.filter(p => p.estado === 'rechazado').length,
      solicitudesPendientes: solicitudes.filter(s => !s.procesado).length,
      
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
    
    return puntos.filter(p => new Date(p.created) > hace7Dias).length;
  }

  // ==================== USUARIOS ====================

  /**
   * Obtiene lista de usuarios (solo superadmin)
   */
  async getUsuarios(page = 1, perPage = 20) {
    if (!authService.isSuperAdmin()) {
      throw new Error('No tienes permisos para ver usuarios');
    }
    
    return await pb.collection('users').getList(page, perPage, {
      sort: '-created'
    });
  }

  /**
   * Actualiza rol de un usuario (solo superadmin)
   */
  async updateUsuarioRol(userId, rol) {
    if (!authService.isSuperAdmin()) {
      throw new Error('No tienes permisos para modificar usuarios');
    }
    
    return await pb.collection('users').update(userId, { rol });
  }

  /**
   * Activa/desactiva un usuario (solo superadmin)
   */
  async toggleUsuarioActivo(userId, activo) {
    if (!authService.isSuperAdmin()) {
      throw new Error('No tienes permisos para modificar usuarios');
    }
    
    return await pb.collection('users').update(userId, { activo });
  }
}

export const adminService = new AdminService();
