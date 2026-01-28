/**
 * Servicio de Autenticación para Panel Admin
 * Maneja login, logout, verificación de roles y permisos con JWT
 */

// URL del backend Go
// En desarrollo usa rutas relativas (proxy de Vite)
// En producción usa la URL base del sitio
const API_URL = import.meta.env.VITE_API_URL || '';

const TOKEN_KEY = 'donde-ayudo-token';
const USER_KEY = 'donde-ayudo-user';

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
    // Restaurar sesión desde localStorage si existe
    this.token = localStorage.getItem(TOKEN_KEY);
    this.user = this.loadUser();
    this.isValid = !!(this.token && this.user);
    
    this.listeners = new Set();
    
    // Verificar token al cargar
    if (this.isValid) {
      this.verifyToken().catch(() => {
        this.logout();
      });
    }
  }

  /**
   * Carga usuario desde localStorage
   */
  loadUser() {
    const userData = localStorage.getItem(USER_KEY);
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  /**
   * Guarda usuario en localStorage
   */
  saveUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.user = user;
  }

  /**
   * Verifica si el token es válido
   */
  async verifyToken() {
    if (!this.token) return false;
    
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        this.saveUser(userData);
        this.isValid = true;
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error verificando token:', error);
      return false;
    }
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
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return { 
          success: false, 
          error: errorData.error || 'Error en el login'
        };
      }
      
      const data = await response.json();
      
      // Verificar si el usuario tiene rol
      if (!data.user.rol) {
        return { 
          success: false, 
          error: 'Tu cuenta no tiene permisos de administración. Contacta al administrador.' 
        };
      }
      
      // Verificar si está activo
      if (data.user.activo === false) {
        return { 
          success: false, 
          error: 'Tu cuenta ha sido desactivada. Contacta al administrador.' 
        };
      }
      
      // Guardar token y usuario
      this.token = data.token;
      localStorage.setItem(TOKEN_KEY, data.token);
      this.saveUser(data.user);
      this.isValid = true;
      
      this.notifyListeners();
      
      return { 
        success: true, 
        user: data.user,
        token: data.token
      };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'No se pudo conectar con el servidor'
      };
    }
  }

  /**
   * Logout
   */
  async logout() {
    this.token = null;
    this.user = null;
    this.isValid = false;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.notifyListeners();
  }

  /**
   * Verifica si hay una sesión válida
   */
  isAuthenticated() {
    return this.isValid && this.user?.rol;
  }

  /**
   * Obtiene el token actual para requests autenticados
   */
  getToken() {
    return this.token;
  }

  /**
   * Headers para requests autenticados
   */
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
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
