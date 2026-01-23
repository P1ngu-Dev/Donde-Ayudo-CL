import './styles/main.css';
import { mapManager, createDetailContent } from './map.js';
import { registerSW } from 'virtual:pwa-register';

// Referencias DOM (cacheadas para rendimiento)
let elements = {};

// Registrar Service Worker para PWA
const updateSW = registerSW({
  onNeedRefresh() {
    // Mostrar notificación de actualización disponible
    showUpdateNotification();
  },
  onOfflineReady() {
    console.log('✅ App lista para funcionar offline');
  },
  immediate: true
});

/**
 * Muestra notificación de actualización disponible
 */
function showUpdateNotification() {
  const banner = document.createElement('div');
  banner.id = 'update-banner';
  banner.className = 'fixed top-20 left-4 right-4 z-[2000] bg-blue-600 text-white rounded-lg shadow-xl p-4 flex items-center justify-between animate-slide-down';
  banner.innerHTML = `
    <div class="flex items-center gap-3">
      <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
      </svg>
      <span class="text-sm font-medium">Nueva versión disponible</span>
    </div>
    <button id="update-btn" class="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 active:scale-95 transition-transform">
      Actualizar
    </button>
  `;
  
  document.body.appendChild(banner);
  
  document.getElementById('update-btn')?.addEventListener('click', () => {
    updateSW(true); // Forzar actualización
  });
  
  // Auto-cerrar después de 10 segundos
  setTimeout(() => {
    banner.style.opacity = '0';
    setTimeout(() => banner.remove(), 300);
  }, 10000);
}

/**
 * Inicialización de la aplicación
 */
async function initApp() {
  console.log('🚀 Iniciando Donde Ayudo CL...');
  
  // Cachear referencias DOM
  cacheElements();
  
  // Detectar estado offline
  setupOfflineDetection();
  
  // 1. Inicializar mapa
  mapManager.init();
  
  // 2. Configurar handler de clicks en puntos
  mapManager.setPointClickHandler(showPointDetail);
  
  // 3. Cargar puntos de datos
  try {
    const points = await mapManager.loadPoints();
    updateCounter(points.length);
    console.log(`✅ ${points.length} puntos cargados`);
  } catch (error) {
    console.error('❌ Error cargando puntos:', error);
    updateCounter(0);
  }
  
  // 4. Configurar controles de UI
  setupControls();
  
  // 5. Ocultar loading screen
  hideLoadingScreen();
}

/**
 * Cachea referencias a elementos DOM
 */
function cacheElements() {
  elements = {
    btnLocate: document.getElementById('btn-locate'),
    btnFilter: document.getElementById('btn-filter'),
    filterPanel: document.getElementById('filter-panel'),
    detailPanel: document.getElementById('detail-panel'),
    detailContent: document.getElementById('detail-content'),
    panelOverlay: document.getElementById('panel-overlay'),
    filterButtons: document.querySelectorAll('.filter-btn'),
    counterValue: document.getElementById('counter-value'),
    offlineBanner: document.getElementById('offline-banner'),
    loadingScreen: document.getElementById('loading-screen')
  };
}

/**
 * Actualiza el contador de puntos
 */
function updateCounter(count) {
  if (elements.counterValue) {
    elements.counterValue.textContent = count;
  }
}

/**
 * Oculta la pantalla de carga
 */
function hideLoadingScreen() {
  if (elements.loadingScreen) {
    elements.loadingScreen.classList.add('fade-out');
    setTimeout(() => {
      elements.loadingScreen.style.display = 'none';
    }, 300);
  }
}

/**
 * Detecta cambios en el estado de conexión
 */
function setupOfflineDetection() {
  const updateOnlineStatus = () => {
    if (elements.offlineBanner) {
      elements.offlineBanner.classList.toggle('hidden', navigator.onLine);
    }
  };
  
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
}

/**
 * Muestra el detalle de un punto en el Bottom Sheet
 */
function showPointDetail(point) {
  if (!elements.detailContent || !elements.detailPanel) return;
  
  // Generar contenido
  elements.detailContent.innerHTML = createDetailContent(point);
  
  // Cerrar solo el panel de filtros si está abierto
  closePanel(elements.filterPanel);
  
  // Mostrar panel de detalle
  showPanel(elements.detailPanel);
}

/**
 * Muestra un panel (Bottom Sheet)
 */
function showPanel(panel) {
  if (!panel) return;
  elements.panelOverlay?.classList.remove('hidden');
  
  // Usar requestAnimationFrame para asegurar la animación
  requestAnimationFrame(() => {
    panel.classList.add('show');
  });
}

/**
 * Cierra un panel específico
 */
function closePanel(panel) {
  if (!panel) return;
  panel.classList.remove('show');
}

/**
 * Cierra todos los paneles
 */
function closeAllPanels() {
  closePanel(elements.filterPanel);
  closePanel(elements.detailPanel);
  elements.panelOverlay?.classList.add('hidden');
}

/**
 * Configura los event listeners de los controles
 */
function setupControls() {
  // Botón "Mi ubicación"
  elements.btnLocate?.addEventListener('click', async () => {
    const btn = elements.btnLocate;
    const originalHTML = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = '<svg class="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" opacity="0.75"/></svg>';
    
    try {
      await mapManager.locateUser();
    } catch (error) {
      // Mostrar mensaje de error amigable
      alert('No se pudo obtener tu ubicación.\nVerifica los permisos del navegador.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }
  });

  // Toggle panel de filtros
  elements.btnFilter?.addEventListener('click', () => {
    if (elements.filterPanel?.classList.contains('show')) {
      closeAllPanels();
    } else {
      closeAllPanels();
      showPanel(elements.filterPanel);
    }
  });

  // Cerrar paneles al tocar overlay
  elements.panelOverlay?.addEventListener('click', closeAllPanels);

  // Filtros por tipo
  elements.filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.filter;
      
      // Actualizar estado visual de botones
      elements.filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Aplicar filtro y actualizar contador
      const count = mapManager.filterByType(type);
      updateCounter(count);
      
      // Cerrar panel
      closeAllPanels();
    });
  });

  // Cerrar con tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllPanels();
    }
  });

  // Swipe down para cerrar (básico)
  [elements.filterPanel, elements.detailPanel].forEach(panel => {
    if (!panel) return;
    
    let startY = 0;
    
    panel.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    }, { passive: true });
    
    panel.addEventListener('touchend', (e) => {
      const endY = e.changedTouches[0].clientY;
      if (endY - startY > 80) { // Swipe down > 80px
        closeAllPanels();
      }
    }, { passive: true });
  });
}

// Arrancar la app cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

