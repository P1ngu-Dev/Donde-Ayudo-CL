// Script temporal para limpiar el Service Worker y caché
// Ejecutar en la consola del navegador o como archivo temporal

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
      console.log('Service Worker desregistrado');
    }
  });
}

caches.keys().then(function(names) {
  for (let name of names) {
    caches.delete(name);
    console.log('Caché eliminado:', name);
  }
  console.log('Todos los cachés eliminados. Recarga la página.');
});
