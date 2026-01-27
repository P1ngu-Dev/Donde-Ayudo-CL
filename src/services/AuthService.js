/**
 * Servicio de Autenticación para Panel Admin
 * Maneja login, logout, verificación de roles y permisos
 */

import { pb } from './DataRepository.js';

// Roles disponibles y sus permisos
export const ROLES = {
  superadmin: {
    name: 'Super Administrador',
    permissions: ['*'], // Todo
    color: 'purple'
  },
  admin: {
    name: 'Administrador',
    permissions: ['puntos:*', 'solicitudes:*', 'users:view'],
    color: 'blue'
  },
  verificador: {
    name: 'Verificador',
    permissions: ['puntos:view', 'puntos:verify', 'solicitudes:view', 'solicitudes:process'],
    color: 'green'
  }
};

class AuthService {
  constructor() {
    // Restaurar sesión si existe
    this.user = pb.authStore.model;
    this.isValid = pb.authStore.isValid;
    
    // Escuchar cambios en auth
    pb.authStore.onChange((token, model) => {
      this.user = model;
      this.isValid = pb.authStore.isValid;
      this.notifyListeners();
    });
    
    this.listeners = new Set();
  }

  /**
   * Registra un listener para cambios de autenticación
   */
  onAuthChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  notifyListeners() {
    this.listeners.forEach(cb => cb(this.user, this.isValid));
  }

  /**
   * Login con email y contraseña
   */
  async login(email, password) {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      
      // Verificar si el usuario tiene rol
      if (!authData.record.rol) {
        await this.logout();
        return { 
          success: false, 
          error: 'Tu cuenta no tiene permisos de administración. Contacta al administrador.' 
        };
      }
      
      // Verificar si está activo
      if (authData.record.activo === false) {
        await this.logout();
        return { 
          success: false, 
          error: 'Tu cuenta ha sido desactivada. Contacta al administrador.' 
        };
      }
      
      return { 
        success: true, 
        user: authData.record,
        token: authData.token
      };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message === 'Failed to authenticate.' 
          ? 'Email o contraseña incorrectos' 
          : error.message 
      };
    }
  }

  /**
   * Logout
   */
  async logout() {
    pb.authStore.clear();
    this.user = null;
    this.isValid = false;
  }

  /**
   * Verifica si hay una sesión válida
   */
  isAuthenticated() {
    return pb.authStore.isValid && this.user?.rol;
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser() {
    return this.user;
  }

  /**
   * Obtiene el rol del usuario actual
   */
  getRole() {
    return this.user?.rol || null;
  }

  /**
   * Obtiene info del rol
   */
  getRoleInfo() {
    const role = this.getRole();
    return role ? ROLES[role] : null;
  }

  /**
   * Verifica si el usuario tiene un permiso específico
   */
  hasPermission(permission) {
    const role = this.getRole();
    if (!role) return false;
    
    const roleInfo = ROLES[role];
    if (!roleInfo) return false;
    
    // Superadmin tiene todos los permisos
    if (roleInfo.permissions.includes('*')) return true;
    
    // Verificar permiso exacto
    if (roleInfo.permissions.includes(permission)) return true;
    
    // Verificar permisos con wildcard (ej: puntos:* incluye puntos:view)
    const [resource, action] = permission.split(':');
    if (roleInfo.permissions.includes(`${resource}:*`)) return true;
    
    return false;
  }

  /**
   * Verifica si el usuario puede editar puntos
   */
  canEditPuntos() {
    return this.hasPermission('puntos:edit') || this.hasPermission('puntos:*');
  }

  /**
   * Verifica si el usuario puede verificar puntos
   */
  canVerifyPuntos() {
    return this.hasPermission('puntos:verify') || this.hasPermission('puntos:*');
  }

  /**
   * Verifica si el usuario puede gestionar usuarios
   */
  canManageUsers() {
    return this.hasPermission('users:manage') || this.getRole() === 'superadmin';
  }

  /**
   * Verifica si es superadmin
   */
  isSuperAdmin() {
    return this.getRole() === 'superadmin';
  }

  /**
   * Redirige a login si no está autenticado
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = '/admin.html';
      return false;
    }
    return true;
  }
}

// Exportar instancia singleton
export const authService = new AuthService();
