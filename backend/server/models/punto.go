package models

// NecesidadesTags estructura compleja para necesidades detalladas
type NecesidadesTags struct {
	Medicamentos string   `json:"medicamentos,omitempty"`
	OllaComun    bool     `json:"olla_comun,omitempty"`
	Alimentos    []string `json:"alimentos,omitempty"`
	Herramientas []string `json:"herramientas,omitempty"`
	TechoAbrigo  []string `json:"techo_abrigo,omitempty"`
	Animales     []string `json:"animales,omitempty"`
}

type Punto struct {
	ID                   string   `json:"id"`
	Nombre               string   `json:"nombre"`
	Latitud              float64  `json:"latitud"`
	Longitud             float64  `json:"longitud"`
	Direccion            string   `json:"direccion"`
	Ciudad               string   `json:"ciudad"`
	Categoria            string   `json:"categoria"`
	Subtipo              string   `json:"subtipo"`
	CategoriasAyuda      []string `json:"categorias_ayuda,omitempty"`
	NivelUrgencia        string   `json:"nivel_urgencia,omitempty"`
	ContactoPrincipal    string   `json:"contacto_principal"`
	ContactoNombre       string   `json:"contacto_nombre"`
	Horario              string   `json:"horario"`
	Estado               string   `json:"estado"`
	EntidadVerificadora  string   `json:"entidad_verificadora"`
	FechaVerificacion    string   `json:"fecha_verificacion,omitempty"`
	NotasInternas        string   `json:"notas_internas,omitempty"`
	CapacidadEstado      string   `json:"capacidad_estado,omitempty"`
	NecesidadesRaw       string   `json:"necesidades_raw,omitempty"`
	NecesidadesTags      any      `json:"necesidades_tags,omitempty"` // Puede ser []string o NecesidadesTags
	NombreZona           string   `json:"nombre_zona,omitempty"`
	HabitadoActualmente  bool     `json:"habitado_actualmente"`
	CantidadNinos        int      `json:"cantidad_ninos"`
	CantidadAdolescentes int      `json:"cantidad_adolescentes"`
	CantidadAdultos      int      `json:"cantidad_adultos"`
	CantidadAncianos     int      `json:"cantidad_ancianos"`
	AnimalesDetalle      string   `json:"animales_detalle,omitempty"`
	RiesgoAsbesto        string   `json:"riesgo_asbesto,omitempty"`
	FotoAsbesto          string   `json:"foto_asbesto,omitempty"`
	LogisticaLlegada     string   `json:"logistica_llegada,omitempty"`
	TiposAcceso          []string `json:"tipos_acceso,omitempty"`
	RequiereVoluntarios  bool     `json:"requiere_voluntarios"`
	TieneBanos           bool     `json:"tiene_banos"`
	TieneElectricidad    bool     `json:"tiene_electricidad"`
	TieneSenal           bool     `json:"tiene_senal"`
	FallecidosReportados bool     `json:"fallecidos_reportados,omitempty"` // Campo privado
	EvidenciaFotos       []string `json:"evidencia_fotos,omitempty"`
	ArchivoKML           string   `json:"archivo_kml,omitempty"`
	Created              string   `json:"created,omitempty"`
	Updated              string   `json:"updated,omitempty"`
	CreatedBy            string   `json:"created_by,omitempty"`
}

type PuntoCreateRequest struct {
	Nombre               string   `json:"nombre"`
	Latitud              float64  `json:"latitud"`
	Longitud             float64  `json:"longitud"`
	Direccion            string   `json:"direccion"`
	Ciudad               string   `json:"ciudad"`
	Categoria            string   `json:"categoria"`
	Subtipo              string   `json:"subtipo"`
	CategoriasAyuda      []string `json:"categorias_ayuda"`
	NivelUrgencia        string   `json:"nivel_urgencia"`
	ContactoPrincipal    string   `json:"contacto_principal"`
	ContactoNombre       string   `json:"contacto_nombre"`
	Horario              string   `json:"horario"`
	Estado               string   `json:"estado"`
	EntidadVerificadora  string   `json:"entidad_verificadora"`
	CapacidadEstado      string   `json:"capacidad_estado"`
	NecesidadesRaw       string   `json:"necesidades_raw"`
	NecesidadesTags      any      `json:"necesidades_tags"`
	NombreZona           string   `json:"nombre_zona"`
	HabitadoActualmente  bool     `json:"habitado_actualmente"`
	CantidadNinos        int      `json:"cantidad_ninos"`
	CantidadAdolescentes int      `json:"cantidad_adolescentes"`
	CantidadAdultos      int      `json:"cantidad_adultos"`
	CantidadAncianos     int      `json:"cantidad_ancianos"`
	AnimalesDetalle      string   `json:"animales_detalle"`
	RiesgoAsbesto        string   `json:"riesgo_asbesto"`
	FotoAsbesto          string   `json:"foto_asbesto"`
	LogisticaLlegada     string   `json:"logistica_llegada"`
	TiposAcceso          []string `json:"tipos_acceso"`
	RequiereVoluntarios  bool     `json:"requiere_voluntarios"`
	TieneBanos           bool     `json:"tiene_banos"`
	TieneElectricidad    bool     `json:"tiene_electricidad"`
	TieneSenal           bool     `json:"tiene_senal"`
	FallecidosReportados bool     `json:"fallecidos_reportados"`
	EvidenciaFotos       []string `json:"evidencia_fotos"`
	ArchivoKML           string   `json:"archivo_kml"`
}

type PuntoUpdateRequest struct {
	Nombre               *string   `json:"nombre,omitempty"`
	Latitud              *float64  `json:"latitud,omitempty"`
	Longitud             *float64  `json:"longitud,omitempty"`
	Direccion            *string   `json:"direccion,omitempty"`
	Ciudad               *string   `json:"ciudad,omitempty"`
	Categoria            *string   `json:"categoria,omitempty"`
	Subtipo              *string   `json:"subtipo,omitempty"`
	CategoriasAyuda      *[]string `json:"categorias_ayuda,omitempty"`
	NivelUrgencia        *string   `json:"nivel_urgencia,omitempty"`
	ContactoPrincipal    *string   `json:"contacto_principal,omitempty"`
	ContactoNombre       *string   `json:"contacto_nombre,omitempty"`
	Horario              *string   `json:"horario,omitempty"`
	Estado               *string   `json:"estado,omitempty"`
	EntidadVerificadora  *string   `json:"entidad_verificadora,omitempty"`
	NotasInternas        *string   `json:"notas_internas,omitempty"`
	CapacidadEstado      *string   `json:"capacidad_estado,omitempty"`
	NecesidadesRaw       *string   `json:"necesidades_raw,omitempty"`
	NecesidadesTags      any       `json:"necesidades_tags,omitempty"`
	AnimalesDetalle      *string   `json:"animales_detalle,omitempty"`
	RiesgoAsbesto        *string   `json:"riesgo_asbesto,omitempty"`
	FotoAsbesto          *string   `json:"foto_asbesto,omitempty"`
	LogisticaLlegada     *string   `json:"logistica_llegada,omitempty"`
	TiposAcceso          *[]string `json:"tipos_acceso,omitempty"`
	TieneBanos           *bool     `json:"tiene_banos,omitempty"`
	TieneElectricidad    *bool     `json:"tiene_electricidad,omitempty"`
	TieneSenal           *bool     `json:"tiene_senal,omitempty"`
	FallecidosReportados *bool     `json:"fallecidos_reportados,omitempty"`
	ArchivoKML           *string   `json:"archivo_kml,omitempty"`
}

type EstadoUpdateRequest struct {
	Estado string `json:"estado"`
}

type PuntosListResponse struct {
	Data  []Punto `json:"data"`
	Total int     `json:"total"`
	Page  int     `json:"page"`
	Limit int     `json:"limit"`
}

// CSVImportRequest para importación de CSV
type CSVImportRequest struct {
	Data []PuntoCreateRequest `json:"data"`
}

type CSVImportResponse struct {
	Imported int      `json:"imported"`
	Skipped  int      `json:"skipped"`
	Errors   []string `json:"errors,omitempty"`
}
