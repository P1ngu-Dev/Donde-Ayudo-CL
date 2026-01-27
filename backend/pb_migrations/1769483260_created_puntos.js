/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text982552870",
        "max": 0,
        "min": 0,
        "name": "nombre",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "number331428840",
        "max": null,
        "min": null,
        "name": "latitud",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number2335556369",
        "max": null,
        "min": null,
        "name": "longitud",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text4085563029",
        "max": 0,
        "min": 0,
        "name": "direccion",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text2391147934",
        "max": 0,
        "min": 0,
        "name": "ciudad",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select1309676077",
        "maxSelect": 1,
        "name": "categoria",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "informacion",
          "acopio",
          "solicitud_ayuda"
        ]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text2845339596",
        "max": 0,
        "min": 0,
        "name": "subtipo",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text2196717517",
        "max": 0,
        "min": 0,
        "name": "contacto_principal",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text3695248473",
        "max": 0,
        "min": 0,
        "name": "contacto_nombre",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text3797439395",
        "max": 0,
        "min": 0,
        "name": "horario",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select643686883",
        "maxSelect": 1,
        "name": "estado",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "publicado",
          "revision",
          "oculto",
          "rechazado"
        ]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text2472821505",
        "max": 0,
        "min": 0,
        "name": "entidad_verificadora",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "date1192972370",
        "max": "",
        "min": "",
        "name": "fecha_verificacion",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "convertURLs": false,
        "hidden": false,
        "id": "editor1512317141",
        "maxSize": 0,
        "name": "notas_internas",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "editor"
      },
      {
        "hidden": false,
        "id": "select3474918466",
        "maxSelect": 1,
        "name": "capacidad_estado",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "abierto",
          "por_llenar",
          "colapsado",
          "cerrado"
        ]
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text3422161099",
        "max": 0,
        "min": 0,
        "name": "necesidades_raw",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "json2027578294",
        "maxSize": 0,
        "name": "necesidades_tags",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1768181481",
        "max": 0,
        "min": 0,
        "name": "nombre_zona",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "bool448623843",
        "name": "habitado_actualmente",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "number3337290507",
        "max": null,
        "min": null,
        "name": "cantidad_ninos",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number1515288388",
        "max": null,
        "min": null,
        "name": "cantidad_adultos",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number1401469578",
        "max": null,
        "min": null,
        "name": "cantidad_ancianos",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text956405252",
        "max": 0,
        "min": 0,
        "name": "animales_detalle",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "bool933121141",
        "name": "riesgo_asbesto",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "file2410512476",
        "maxSelect": 10,
        "maxSize": 5242880,
        "mimeTypes": [
          "image/jpeg",
          "image/png",
          "image/webp"
        ],
        "name": "evidencia_fotos",
        "presentable": false,
        "protected": false,
        "required": false,
        "system": false,
        "thumbs": null,
        "type": "file"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text588928768",
        "max": 0,
        "min": 0,
        "name": "logistica_llegada",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "bool14926285",
        "name": "requiere_voluntarios",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "select2711892521",
        "maxSelect": 1,
        "name": "urgencia",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "baja",
          "media",
          "alta",
          "critica"
        ]
      }
    ],
    "id": "pbc_531212737",
    "indexes": [],
    "listRule": "",
    "name": "puntos",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": ""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_531212737");

  return app.delete(collection);
})
