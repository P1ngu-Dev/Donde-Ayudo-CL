/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("puntos");
  
  // Permitir la creación pública SOLO si el estado es 'revision'
  // Esto permite reportes SOS pero protege los puntos verificados
  collection.createRule = "estado = 'revision'";
  
  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("puntos");
  
  // Revertir a admin-only
  collection.createRule = null;
  
  app.save(collection);
})
