/**
 * Admin Panel - Main JavaScript
 * Panel de administración para Donde Ayudo CL
 */

import { authService, ROLES } from './services/AuthService.js';
import { adminService } from './services/AdminService.js';

// Debug helpers (browser console)
window.authService = authService;
window.adminService = adminService;

// ==================== STATE ====================
let currentView = 'dashboard';
let puntosPage = 1;
let puntosFilters = {};
let currentEditId = null;
let confirmCallback = null;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  // Verificar si ya hay sesión
  if (authService.isAuthenticated()) {
    showDashboard();
  } else {
    showLogin();
  }
  
  // Setup event listeners
  setupLoginForm();
  setupNavigation();
  setupLogout();
  setupModals();
  setupFilters();
  setupMobileMenu();
});

// ==================== LOGIN ====================
function showLogin() {
  document.getElementById('login-section').style.display = 'flex';
  document.getElementById('admin-layout').classList.remove('active');
}

function showDashboard() {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('admin-layout').classList.add('active');
  
  // Update user info
  updateUserInfo();
  
  // Check permissions
  checkPermissions();
  
  // Load initial data
  loadDashboard();
}

function setupLoginForm() {
  const form = document.getElementById('login-form');
  const alert = document.getElementById('login-alert');
  const alertText = document.getElementById('login-alert-text');
  const btn = document.getElementById('login-btn');
  const btnText = document.getElementById('login-btn-text');
  const spinner = document.getElementById('login-spinner');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Show loading
    btn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'block';
    alert.classList.remove('show');
    
    const result = await authService.login(email, password);
    
    // Hide loading
    btn.disabled = false;
    btnText.style.display = 'block';
    spinner.style.display = 'none';
    
    if (result.success) {
      showDashboard();
      showToast('¡Bienvenido!', 'success');
    } else {
      alert.classList.add('show');
      alertText.textContent = result.error;
    }
  });
  
  // Forgot password
  document.getElementById('forgot-password').addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Contacta al administrador para recuperar tu contraseña', 'warning');
  });
}

function updateUserInfo() {
  const user = authService.getCurrentUser();
  const roleInfo = authService.getRoleInfo();
  
  if (user) {
    document.getElementById('user-name').textContent = user.name || user.email;
    document.getElementById('user-role').textContent = roleInfo?.name || 'Sin rol';
    document.getElementById('user-avatar').textContent = (user.name || user.email)[0].toUpperCase();
  }
}

function checkPermissions() {
  // Show admin section only for superadmin
  if (authService.isSuperAdmin()) {
    document.getElementById('admin-section').style.display = 'block';
  }
}

// ==================== NAVIGATION ====================
function setupNavigation() {
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      navigateTo(view);
    });
  });
}

function navigateTo(view) {
  // Update active nav item
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  
  // Update active view section
  document.querySelectorAll('.view-section').forEach(section => {
    section.classList.toggle('active', section.id === `view-${view}`);
  });
  
  currentView = view;
  
  // Load view data
  switch (view) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'puntos':
      loadPuntos();
      break;
    case 'solicitudes':
      loadSolicitudes();
      break;
    case 'usuarios':
      loadUsuarios();
      break;
  }
  
  // Close mobile menu
  document.getElementById('sidebar').classList.remove('open');
}

// ==================== DASHBOARD ====================
async function loadDashboard() {
  try {
    const stats = await adminService.getEstadisticas();
    
    // Update stats
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-publicados').textContent = stats.publicados;
    document.getElementById('stat-revision').textContent = stats.enRevision;
    document.getElementById('stat-solicitudes').textContent = stats.solicitudesPendientes;
    
    // Update badge
    const badge = document.getElementById('solicitudes-badge');
    if (stats.solicitudesPendientes > 0) {
      badge.style.display = 'block';
      badge.textContent = stats.solicitudesPendientes;
    } else {
      badge.style.display = 'none';
    }
    
    // Load recent puntos en revisión
    const result = await adminService.getAllPuntos(1, 5, { estado: 'revision' });
    renderRecentPuntos(result.items);
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
    showToast('Error cargando datos', 'error');
  }
}

function renderRecentPuntos(puntos) {
  const tbody = document.getElementById('recent-puntos-table');
  
  if (puntos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <p>¡Genial! No hay puntos pendientes de revisión</p>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = puntos.map(p => `
    <tr>
      <td class="truncate">${escapeHtml(p.nombre)}</td>
      <td>${escapeHtml(p.ciudad || '-')}</td>
      <td><span class="category-badge ${p.categoria}">${p.categoria}</span></td>
      <td><span class="status-badge ${p.estado}">${p.estado}</span></td>
      <td>${formatDate(p.created)}</td>
      <td class="actions-cell">
        <button class="btn-action btn-verify" title="Verificar" onclick="window.adminActions.verify('${p.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>
        <button class="btn-action btn-edit" title="Editar" onclick="window.adminActions.edit('${p.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </td>
    </tr>
  `).join('');
}

// ==================== PUNTOS ====================
async function loadPuntos() {
  try {
    const result = await adminService.getAllPuntos(puntosPage, 20, puntosFilters);
    renderPuntosTable(result.items);
    updatePagination(result);
  } catch (error) {
    console.error('Error loading puntos:', error);
    showToast('Error cargando puntos', 'error');
  }
}

function renderPuntosTable(puntos) {
  const tbody = document.getElementById('puntos-table');
  
  if (puntos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <p>No se encontraron puntos</p>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = puntos.map(p => `
    <tr>
      <td class="truncate">${escapeHtml(p.nombre)}</td>
      <td>${escapeHtml(p.ciudad || '-')}</td>
      <td><span class="category-badge ${p.categoria}">${p.categoria}</span></td>
      <td><span class="status-badge ${p.estado}">${p.estado}</span></td>
      <td class="truncate">${escapeHtml(p.entidad_verificadora || '-')}</td>
      <td class="actions-cell">
        <button class="btn-action btn-view" title="Ver" onclick="window.adminActions.view('${p.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
        <button class="btn-action btn-edit" title="Editar" onclick="window.adminActions.edit('${p.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        ${p.estado === 'revision' ? `
          <button class="btn-action btn-verify" title="Verificar" onclick="window.adminActions.verify('${p.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </button>
        ` : ''}
        <button class="btn-action btn-delete" title="Eliminar" onclick="window.adminActions.delete('${p.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </td>
    </tr>
  `).join('');
}

function updatePagination(result) {
  document.getElementById('puntos-pagination-info').textContent = 
    `Mostrando ${(result.page - 1) * result.perPage + 1}-${Math.min(result.page * result.perPage, result.totalItems)} de ${result.totalItems}`;
  
  document.getElementById('puntos-prev').disabled = result.page <= 1;
  document.getElementById('puntos-next').disabled = result.page >= result.totalPages;
}

function setupFilters() {
  // Filter change handlers
  document.getElementById('filter-estado').addEventListener('change', (e) => {
    puntosFilters.estado = e.target.value;
    puntosPage = 1;
    loadPuntos();
  });
  
  document.getElementById('filter-categoria').addEventListener('change', (e) => {
    puntosFilters.categoria = e.target.value;
    puntosPage = 1;
    loadPuntos();
  });
  
  // Search with debounce
  let searchTimeout;
  document.getElementById('filter-search').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      puntosFilters.search = e.target.value;
      puntosPage = 1;
      loadPuntos();
    }, 300);
  });
  
  // Pagination
  document.getElementById('puntos-prev').addEventListener('click', () => {
    if (puntosPage > 1) {
      puntosPage--;
      loadPuntos();
    }
  });
  
  document.getElementById('puntos-next').addEventListener('click', () => {
    puntosPage++;
    loadPuntos();
  });
}

// ==================== SOLICITUDES ====================
async function loadSolicitudes() {
  try {
    const result = await adminService.getSolicitudes(1, 50, true);
    renderSolicitudesTable(result.items);
  } catch (error) {
    console.error('Error loading solicitudes:', error);
    showToast('Error cargando solicitudes', 'error');
  }
}

function renderSolicitudesTable(solicitudes) {
  const tbody = document.getElementById('solicitudes-table');
  
  if (solicitudes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <p>No hay solicitudes pendientes</p>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = solicitudes.map(s => {
    const datos = typeof s.datos_brutos === 'string' ? JSON.parse(s.datos_brutos) : s.datos_brutos;
    const preview = JSON.stringify(datos).substring(0, 100) + '...';
    
    return `
      <tr>
        <td>${escapeHtml(s.origen || 'Desconocido')}</td>
        <td class="truncate" style="max-width: 300px;">${escapeHtml(preview)}</td>
        <td>${formatDate(s.created)}</td>
        <td class="actions-cell">
          <button class="btn-action btn-view" title="Ver detalle" onclick="window.adminActions.viewSolicitud('${s.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          <button class="btn-action btn-verify" title="Convertir a punto" onclick="window.adminActions.convertToPoint('${s.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </button>
          <button class="btn-action btn-delete" title="Descartar" onclick="window.adminActions.discardSolicitud('${s.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ==================== USUARIOS ====================
async function loadUsuarios() {
  if (!authService.isSuperAdmin()) {
    showToast('No tienes permisos para ver usuarios', 'error');
    navigateTo('dashboard');
    return;
  }
  
  try {
    const result = await adminService.getUsuarios(1, 50);
    renderUsuariosTable(result.items);
  } catch (error) {
    console.error('Error loading usuarios:', error);
    showToast('Error cargando usuarios', 'error');
  }
}

function renderUsuariosTable(usuarios) {
  const tbody = document.getElementById('usuarios-table');
  
  if (usuarios.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <p>No hay usuarios registrados</p>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = usuarios.map(u => `
    <tr>
      <td>${escapeHtml(u.name || '-')}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>${escapeHtml(u.organizacion || '-')}</td>
      <td>
        <select class="filter-select" onchange="window.adminActions.changeRole('${u.id}', this.value)" style="padding: 0.25rem 0.5rem;">
          <option value="" ${!u.rol ? 'selected' : ''}>Sin rol</option>
          <option value="verificador" ${u.rol === 'verificador' ? 'selected' : ''}>Verificador</option>
          <option value="admin" ${u.rol === 'admin' ? 'selected' : ''}>Admin</option>
          <option value="superadmin" ${u.rol === 'superadmin' ? 'selected' : ''}>Super Admin</option>
        </select>
      </td>
      <td>
        <span class="status-badge ${u.activo !== false ? 'publicado' : 'rechazado'}">
          ${u.activo !== false ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td class="actions-cell">
        <button class="btn-action ${u.activo !== false ? 'btn-delete' : 'btn-verify'}" 
                title="${u.activo !== false ? 'Desactivar' : 'Activar'}" 
                onclick="window.adminActions.toggleUserActive('${u.id}', ${u.activo === false})">
          ${u.activo !== false ? `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          ` : `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          `}
        </button>
      </td>
    </tr>
  `).join('');
}

// ==================== MODALS ====================
function setupModals() {
  // Edit modal
  document.getElementById('modal-close').addEventListener('click', closeEditModal);
  document.getElementById('modal-cancel').addEventListener('click', closeEditModal);
  document.getElementById('modal-edit').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeEditModal();
  });
  
  // View modal
  document.getElementById('modal-view-close').addEventListener('click', closeViewModal);
  document.getElementById('modal-view-cancel').addEventListener('click', closeViewModal);
  document.getElementById('modal-view').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeViewModal();
  });
  
  // Confirm modal
  document.getElementById('confirm-close').addEventListener('click', closeConfirmModal);
  document.getElementById('confirm-cancel').addEventListener('click', closeConfirmModal);
  document.getElementById('confirm-ok').addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    closeConfirmModal();
  });
  
  // Edit form
  document.getElementById('edit-form').addEventListener('submit', handleEditSubmit);
  
  // Add punto buttons
  document.getElementById('btn-add-punto').addEventListener('click', () => openEditModal(null));
  document.getElementById('btn-add-punto-2').addEventListener('click', () => openEditModal(null));
  
  // View modal edit button
  document.getElementById('modal-view-edit').addEventListener('click', () => {
    const id = document.getElementById('modal-view-edit').dataset.id;
    closeViewModal();
    openEditModal(id);
  });
}

async function openEditModal(id) {
  currentEditId = id;
  const modal = document.getElementById('modal-edit');
  const title = document.getElementById('modal-title');
  
  // Reset form
  document.getElementById('edit-form').reset();
  
  if (id) {
    title.textContent = 'Editar Punto';
    try {
      const punto = await adminService.getPunto(id);
      
      document.getElementById('edit-id').value = punto.id;
      document.getElementById('edit-nombre').value = punto.nombre || '';
      document.getElementById('edit-ciudad').value = punto.ciudad || '';
      document.getElementById('edit-direccion').value = punto.direccion || '';
      document.getElementById('edit-latitud').value = punto.latitud || '';
      document.getElementById('edit-longitud').value = punto.longitud || '';
      document.getElementById('edit-categoria').value = punto.categoria || 'informacion';
      document.getElementById('edit-subtipo').value = punto.subtipo || '';
      document.getElementById('edit-estado').value = punto.estado || 'revision';
      document.getElementById('edit-contacto').value = punto.contacto_principal || '';
      document.getElementById('edit-horario').value = punto.horario || '';
      document.getElementById('edit-necesidades').value = punto.necesidades_raw || '';
      document.getElementById('edit-notas').value = punto.notas_internas || '';
    } catch (error) {
      showToast('Error cargando punto', 'error');
      return;
    }
  } else {
    title.textContent = 'Agregar Nuevo Punto';
    document.getElementById('edit-estado').value = 'publicado';
  }
  
  modal.classList.add('show');
}

function closeEditModal() {
  document.getElementById('modal-edit').classList.remove('show');
  currentEditId = null;
}

async function openViewModal(id) {
  const modal = document.getElementById('modal-view');
  const content = document.getElementById('modal-view-content');
  
  try {
    const punto = await adminService.getPunto(id);
    
    content.innerHTML = `
      <div style="display: grid; gap: 1rem;">
        <div>
          <strong>Nombre:</strong> ${escapeHtml(punto.nombre)}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <strong>Ciudad:</strong> ${escapeHtml(punto.ciudad || '-')}
          </div>
          <div>
            <strong>Categoría:</strong> <span class="category-badge ${punto.categoria}">${punto.categoria}</span>
          </div>
        </div>
        <div>
          <strong>Dirección:</strong> ${escapeHtml(punto.direccion || '-')}
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <strong>Latitud:</strong> ${punto.latitud}
          </div>
          <div>
            <strong>Longitud:</strong> ${punto.longitud}
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <strong>Estado:</strong> <span class="status-badge ${punto.estado}">${punto.estado}</span>
          </div>
          <div>
            <strong>Subtipo:</strong> ${escapeHtml(punto.subtipo || '-')}
          </div>
        </div>
        <div>
          <strong>Contacto:</strong> ${escapeHtml(punto.contacto_principal || '-')}
        </div>
        <div>
          <strong>Horario:</strong> ${escapeHtml(punto.horario || '-')}
        </div>
        <div>
          <strong>Necesidades/Info:</strong><br>
          <p style="margin: 0.5rem 0; padding: 0.75rem; background: var(--gray-50); border-radius: 0.375rem;">
            ${escapeHtml(punto.necesidades_raw || 'Sin información')}
          </p>
        </div>
        <div>
          <strong>Verificador:</strong> ${escapeHtml(punto.entidad_verificadora || '-')}
        </div>
        <div>
          <strong>Fecha verificación:</strong> ${punto.fecha_verificacion ? formatDate(punto.fecha_verificacion) : '-'}
        </div>
        ${punto.notas_internas ? `
          <div>
            <strong>Notas Internas:</strong><br>
            <p style="margin: 0.5rem 0; padding: 0.75rem; background: #FEF3C7; border-radius: 0.375rem; font-size: 0.875rem;">
              ${escapeHtml(punto.notas_internas)}
            </p>
          </div>
        ` : ''}
      </div>
    `;
    
    document.getElementById('modal-view-edit').dataset.id = id;
    modal.classList.add('show');
  } catch (error) {
    showToast('Error cargando punto', 'error');
  }
}

function closeViewModal() {
  document.getElementById('modal-view').classList.remove('show');
}

function showConfirmModal(title, message, callback) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').textContent = message;
  confirmCallback = callback;
  document.getElementById('modal-confirm').classList.add('show');
}

function closeConfirmModal() {
  document.getElementById('modal-confirm').classList.remove('show');
  confirmCallback = null;
}

async function handleEditSubmit(e) {
  e.preventDefault();
  
  const data = {
    nombre: document.getElementById('edit-nombre').value,
    ciudad: document.getElementById('edit-ciudad').value,
    direccion: document.getElementById('edit-direccion').value,
    latitud: parseFloat(document.getElementById('edit-latitud').value),
    longitud: parseFloat(document.getElementById('edit-longitud').value),
    categoria: document.getElementById('edit-categoria').value,
    subtipo: document.getElementById('edit-subtipo').value,
    estado: document.getElementById('edit-estado').value,
    contacto_principal: document.getElementById('edit-contacto').value,
    horario: document.getElementById('edit-horario').value,
    necesidades_raw: document.getElementById('edit-necesidades').value,
    notas_internas: document.getElementById('edit-notas').value
  };
  
  try {
    if (currentEditId) {
      await adminService.updatePunto(currentEditId, data);
      showToast('Punto actualizado correctamente', 'success');
    } else {
      await adminService.createPunto(data);
      showToast('Punto creado correctamente', 'success');
    }
    
    closeEditModal();
    
    // Refresh current view
    if (currentView === 'puntos') {
      loadPuntos();
    } else if (currentView === 'dashboard') {
      loadDashboard();
    }
  } catch (error) {
    console.error('Error saving punto:', error);
    showToast('Error guardando punto: ' + error.message, 'error');
  }
}

// ==================== ACTIONS ====================
// Expose actions to window for onclick handlers
window.adminActions = {
  async view(id) {
    await openViewModal(id);
  },
  
  async edit(id) {
    await openEditModal(id);
  },
  
  async verify(id) {
    showConfirmModal(
      'Verificar Punto',
      '¿Estás seguro de que quieres verificar este punto y publicarlo?',
      async () => {
        try {
          await adminService.verificarPunto(id);
          showToast('Punto verificado y publicado', 'success');
          
          if (currentView === 'puntos') {
            loadPuntos();
          } else {
            loadDashboard();
          }
        } catch (error) {
          showToast('Error verificando punto', 'error');
        }
      }
    );
  },
  
  async delete(id) {
    showConfirmModal(
      'Eliminar Punto',
      '¿Estás seguro de que quieres eliminar este punto? Esta acción no se puede deshacer.',
      async () => {
        try {
          await adminService.deletePunto(id);
          showToast('Punto eliminado', 'success');
          loadPuntos();
        } catch (error) {
          showToast('Error eliminando punto', 'error');
        }
      }
    );
  },
  
  async viewSolicitud(id) {
    try {
      // Funcionalidad de solicitudes pendiente en el backend
      showToast('Esta funcionalidad estará disponible próximamente', 'warning');
      return;
      
      // TODO: Implementar cuando el backend tenga endpoint de solicitudes
      // const solicitud = await adminService.getSolicitud(id);
      // const datos = typeof solicitud.datos_brutos === 'string' 
      //   ? JSON.parse(solicitud.datos_brutos) 
      //   : solicitud.datos_brutos;
      // 
      // const content = document.getElementById('modal-view-content');
      // content.innerHTML = ...
      // document.getElementById('modal-view-edit').style.display = 'none';
      // document.getElementById('modal-view').classList.add('show');
    } catch (error) {
      showToast('Error cargando solicitud', 'error');
    }
  },
  
  async convertToPoint(id) {
    showConfirmModal(
      'Convertir a Punto',
      '¿Quieres crear un nuevo punto a partir de esta solicitud?',
      async () => {
        try {
          const punto = await adminService.convertirAPunto(id);
          showToast('Punto creado. ID: ' + punto.id, 'success');
          loadSolicitudes();
          
          // Open edit modal for the new punto
          setTimeout(() => openEditModal(punto.id), 500);
        } catch (error) {
          showToast('Error convirtiendo solicitud', 'error');
        }
      }
    );
  },
  
  async discardSolicitud(id) {
    showConfirmModal(
      'Descartar Solicitud',
      '¿Estás seguro de que quieres descartar esta solicitud?',
      async () => {
        try {
          await adminService.marcarProcesada(id);
          showToast('Solicitud descartada', 'success');
          loadSolicitudes();
        } catch (error) {
          showToast('Error descartando solicitud', 'error');
        }
      }
    );
  },
  
  async changeRole(userId, newRole) {
    try {
      await adminService.updateUsuarioRol(userId, newRole || null);
      showToast('Rol actualizado', 'success');
    } catch (error) {
      showToast('Error actualizando rol', 'error');
      loadUsuarios();
    }
  },
  
  async toggleUserActive(userId, activate) {
    try {
      await adminService.toggleUsuarioActivo(userId, activate);
      showToast(activate ? 'Usuario activado' : 'Usuario desactivado', 'success');
      loadUsuarios();
    } catch (error) {
      showToast('Error actualizando usuario', 'error');
    }
  }
};

// ==================== LOGOUT ====================
function setupLogout() {
  document.getElementById('btn-logout').addEventListener('click', async () => {
    await authService.logout();
    showLogin();
    showToast('Sesión cerrada', 'success');
  });
}

// ==================== MOBILE MENU ====================
function setupMobileMenu() {
  document.getElementById('mobile-menu-btn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
}

// ==================== UTILITIES ====================
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${type === 'success' ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>' :
        type === 'error' ? '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>' :
        '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
    </svg>
    <span>${escapeHtml(message)}</span>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
