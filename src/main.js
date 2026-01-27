import './styles/main.css';
import { mapManager, createDetailContent, getColorForType, getTypeLabel, normalizeType } from './map.js';
import { repository } from './services/DataRepository.js';
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
    // App lista para funcionar offline
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
    updateLegend(points); // Generar leyenda dinámica
  } catch (error) {
    // Error cargando puntos
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
    btnMenu: document.getElementById('btn-menu'),
    btnCloseMenu: document.getElementById('btn-close-menu'),
    legendToggle: document.getElementById('legend-toggle'),
    legendContent: document.getElementById('legend-content'),
    legendChevron: document.getElementById('legend-chevron'),
    filterPanel: document.getElementById('filter-panel'),
    detailPanel: document.getElementById('detail-panel'),
    detailContent: document.getElementById('detail-content'),
    sideMenu: document.getElementById('side-menu'),
    
    // Modals & Forms
    btnOpenSOS: document.getElementById('btn-open-sos'),
    btnOpenCollaborate: document.getElementById('btn-open-collaborate'),
    modalSOS: document.getElementById('modal-sos'),
    modalCollaborate: document.getElementById('modal-collaborate'),
    formSOS: document.getElementById('form-sos'),
    formCollaborate: document.getElementById('form-collaborate'),
    sosCoordsInput: document.getElementById('sos-coords'),
    btnGetLoc: document.getElementById('btn-get-loc'),
    closeModalButtons: document.querySelectorAll('.btn-close-modal'),
    
    panelOverlay: document.getElementById('panel-overlay'),
    filterButtons: document.querySelectorAll('.filter-btn'),
    counterValue: document.getElementById('counter-value'),
    offlineBanner: document.getElementById('offline-banner'),
    loadingScreen: document.getElementById('loading-screen'),
    statsTotal: document.getElementById('stats-total'),
    statsActive: document.getElementById('stats-active')
  };
}

/**
 * Actualiza el contador de puntos
 */
function updateCounter(count) {
  if (elements.counterValue) {
    elements.counterValue.textContent = count;
  }
  // Actualizar también las estadísticas del menú
  updateStats(count);
}

/**
 * Actualiza las estadísticas en el menú lateral
 */
function updateStats(totalPoints = 0) {
  if (elements.statsTotal) {
    elements.statsTotal.textContent = totalPoints;
  }
  if (elements.statsActive) {
    elements.statsActive.textContent = totalPoints;
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
 * Abre el menú lateral
 */
function openSideMenu() {
  if (!elements.sideMenu) return;
  elements.panelOverlay?.classList.remove('hidden');
  elements.sideMenu.classList.remove('translate-x-full');
}

/**
 * Cierra el menú lateral
 */
function closeSideMenu() {
  if (!elements.sideMenu) return;
  elements.sideMenu.classList.add('translate-x-full');
  // Solo ocultar overlay si no hay otros paneles abiertos
  if (!elements.filterPanel?.classList.contains('show') && 
      !elements.detailPanel?.classList.contains('show')) {
    elements.panelOverlay?.classList.add('hidden');
  }
}

/**
 * Cierra todos los paneles
 */
function closeAllPanels() {
  closePanel(elements.filterPanel);
  closePanel(elements.detailPanel);
  closeSideMenu();
  elements.panelOverlay?.classList.add('hidden');
}

/**
 * Actualiza la leyenda con los tipos de puntos disponibles
 */
function updateLegend(points) {
  if (!elements.legendToggle || !elements.legendContent) return;
  
  // Obtener tipos únicos normalizados (agrupa tipos similares)
  const rawTypes = points.map(p => p.type).filter(Boolean);
  const normalizedTypesSet = new Set(rawTypes.map(t => normalizeType(t)));
  const types = [...normalizedTypesSet];
  
  if (types.length === 0) return;
  
  // Actualizar botón colapsado con texto e icono de leyenda
  const toggleButton = elements.legendToggle;
  toggleButton.innerHTML = `
    <svg class="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
    <span class="text-sm font-medium text-gray-700">Leyenda</span>
    <svg id="legend-chevron" class="w-4 h-4 text-gray-600 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  `;
  
  // Actualizar referencia al chevron después de reconstruir el HTML
  elements.legendChevron = document.getElementById('legend-chevron');
  
  // Generar contenido expandido
  const itemsHTML = types.map(type => {
    const color = getColorForType(type);
    const label = getTypeLabel(type);
    return `
      <div class="flex items-center gap-2">
        <div class="w-4 h-4 rounded-full" style="background: ${color};"></div>
        <span class="text-xs text-gray-700">${label}</span>
      </div>
    `;
  }).join('');
  
  // Actualizar contenido expandido
  elements.legendContent.innerHTML = itemsHTML;
}

/**
 * Toggle de la leyenda colapsable
 */
function toggleLegend() {
  const content = elements.legendContent;
  const chevron = elements.legendChevron;
  
  if (content?.classList.contains('hidden')) {
    content.classList.remove('hidden');
    chevron?.classList.add('rotate-180');
  } else {
    content?.classList.add('hidden');
    chevron?.classList.remove('rotate-180');
  }
}

/**
 * Configura los event listeners de los controles
 */
function setupControls() {
  // Toggle de leyenda
  elements.legendToggle?.addEventListener('click', toggleLegend);
  
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

  // Abrir menú lateral
  elements.btnMenu?.addEventListener('click', () => {
    // Cerrar otros paneles primero
    closePanel(elements.filterPanel);
    closePanel(elements.detailPanel);
    openSideMenu();
  });

  // Cerrar menú lateral
  elements.btnCloseMenu?.addEventListener('click', () => {
    closeSideMenu();
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

  // Configuración de modales de formularios
  setupModals();
}

/**
 * Lógica para modales de reporte y colaboración
 */
function setupModals() {
  const { 
    btnOpenSOS, btnOpenCollaborate, 
    modalSOS, modalCollaborate, 
    closeModalButtons, 
    formSOS, formCollaborate,
    sosCoordsInput, btnGetLoc
  } = elements;

  // Abrir SOS
  btnOpenSOS?.addEventListener('click', () => {
    closeSideMenu();
    closeAllPanels();
    modalSOS?.classList.remove('hidden');
    
    // Intentar obtener ubicación automáticamente si es seguro
    if (navigator.geolocation && sosCoordsInput && !sosCoordsInput.value) {
       getSOSLocation();
    }
  });

  // Abrir Colaborar
  btnOpenCollaborate?.addEventListener('click', () => {
    closeSideMenu();
    closeAllPanels();
    modalCollaborate?.classList.remove('hidden');
  });

  // Cerrar modales
  closeModalButtons?.forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });
  
  // Cerrar al clickear fuera (overlays o fondos)
  [modalSOS, modalCollaborate].forEach(modal => {
    modal?.addEventListener('click', (e) => {
      if (e.target === modal || e.target.id.includes('-bg')) {
        closeAllModals();
      }
    });
  });

  // Botón "Aquí" en SOS
  btnGetLoc?.addEventListener('click', getSOSLocation);

  // Submit SOS
  formSOS?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = formSOS.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    
    // Validar coords
    if (!sosCoordsInput.value) {
      alert('Por favor indica la ubicación (usa el botón "Aquí")');
      return;
    }

    try {
      btn.disabled = true;
      btn.innerText = 'Enviando...';
      
      const formData = new FormData(formSOS);
      const [lat, lng] = sosCoordsInput.value.split(',').map(n => parseFloat(n.trim()));
      
      const data = {
        lat, lng,
        type: formData.get('type'),
        descripcion: formData.get('descripcion'),
        contacto: formData.get('contacto'),
        nombre: 'SOS Ciudadano'
      };

      console.log('Submitting SOS using repo:', repository);
      if (typeof repository.submitSOS !== 'function') {
        alert('CRITICAL ERROR: submitSOS not found on repository. Try clearing cache.');
        console.error('Repository prototype:', Object.getPrototypeOf(repository));
      }

      const result = await repository.submitSOS(data);
      
      if (result.success) {
        alert('¡Alerta enviada! Aparecerá en el mapa en breve.');
        closeAllModals();
        formSOS.reset();
        
        // Recargar mapa
        // Nota: mapManager debe exponer un método reload o addPoints limpio
        // Como addPoints agrega, primero podríamos limpiar, pero repository.refresh() trae todo de nuevo.
        // mapManager.loadPoints() llama a repository.initialize().
        // Forzamos un reload completo por simplicidad:
        window.location.reload(); 
        
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      alert('Error al enviar: ' + error.message);
    } finally {
      btn.disabled = false;
      btn.innerText = originalText;
    }
  });

  // Submit Colaborar
  formCollaborate?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = formCollaborate.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    
    try {
      btn.disabled = true;
      btn.innerText = 'Enviando...';
      
      const formData = new FormData(formCollaborate);
      const data = {
        nombre: formData.get('origen'),
        contacto: formData.get('contacto'),
        mensaje: formData.get('datos')
      };

      const result = await repository.submitExternalRequest(data, 'web-collaborate');
      
      if (result.success) {
        alert('¡Gracias! Tus datos han sido recibidos y serán verificados.');
        closeAllModals();
        formCollaborate.reset();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      alert('Error al enviar: ' + error.message);
    } finally {
      btn.disabled = false;
      btn.innerText = originalText;
    }
  });
}

function closeAllModals() {
  elements.modalSOS?.classList.add('hidden');
  elements.modalCollaborate?.classList.add('hidden');
}

function getSOSLocation() {
  const btn = elements.btnGetLoc;
  if(!btn) return;
  
  btn.disabled = true;
  btn.innerText = '📍 Buscando...';
  
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      elements.sosCoordsInput.value = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
      btn.innerText = '✅ Listo';
      // Restaurar después de un momento
      setTimeout(() => { btn.innerText = '📍 Aquí'; btn.disabled = false; }, 2000);
    },
    (err) => {
      console.error(err);
      alert('No pudimos obtener tu ubicación. Por favor escríbela o activa el GPS.');
      btn.innerText = '❌ Error';
      btn.disabled = false;
    },
    { enableHighAccuracy: true, timeout: 5000 }
  );
}

// Arrancar la app cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

