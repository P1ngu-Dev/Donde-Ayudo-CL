/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("puntos");
  
  const field = collection.fields.findByName("categoria");
  
  // Agregar 'sos' a las opciones existentes
  if (field) {
    const options = field.values;
    if (!options.includes("sos")) {
        options.push("sos");
        field.values = options;
        app.save(collection);
    }
  }

}, (app) => {
  const collection = app.findCollectionByNameOrId("puntos");
  const field = collection.fields.findByName("categoria");
  
  // Remover 'sos' (revertir)
  if (field) {
    const options = field.values;
    const index = options.indexOf("sos");
    if (index > -1) {
        options.splice(index, 1);
        field.values = options;
        app.save(collection);
    }
  }
})
