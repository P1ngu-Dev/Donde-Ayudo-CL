package models

type Punto struct {
	ID                  string   `json:"id"`
	Nombre              string   `json:"nombre"`
	Latitud             float64  `json:"latitud"`
	Longitud            float64  `json:"longitud"`
	Direccion           string   `json:"direccion"`
	Ciudad              string   `json:"ciudad"`
	Categoria           string   `json:"categoria"`
	Subtipo             string   `json:"subtipo"`
	ContactoPrincipal   string   `json:"contacto_principal"`
	ContactoNombre      string   `json:"contacto_nombre"`
	Horario             string   `json:"horario"`
	Estado              string   `json:"estado"`
	EntidadVerificadora string   `json:"entidad_verificadora"`
	FechaVerificacion   string   `json:"fecha_verificacion,omitempty"`
	NotasInternas       string   `json:"notas_internas,omitempty"`
	CapacidadEstado     string   `json:"capacidad_estado,omitempty"`
	NecesidadesRaw      string   `json:"necesidades_raw,omitempty"`
	NecesidadesTags     []string `json:"necesidades_tags,omitempty"`
	NombreZona          string   `json:"nombre_zona,omitempty"`
	HabitadoActualmente bool     `json:"habitado_actualmente"`
	CantidadNinos       int      `json:"cantidad_ninos"`
	CantidadAdultos     int      `json:"cantidad_adultos"`
	CantidadAncianos    int      `json:"cantidad_ancianos"`
	AnimalesDetalle     string   `json:"animales_detalle,omitempty"`
	RiesgoAsbesto       bool     `json:"riesgo_asbesto"`
	LogisticaLlegada    string   `json:"logistica_llegada,omitempty"`
	RequiereVoluntarios bool     `json:"requiere_voluntarios"`
	Urgencia            string   `json:"urgencia,omitempty"`
	EvidenciaFotos      []string `json:"evidencia_fotos,omitempty"`
	Created             string   `json:"created,omitempty"`
	Updated             string   `json:"updated,omitempty"`
}

type PuntoCreateRequest struct {
	Nombre              string   `json:"nombre"`
	Latitud             float64  `json:"latitud"`
	Longitud            float64  `json:"longitud"`
	Direccion           string   `json:"direccion"`
	Ciudad              string   `json:"ciudad"`
	Categoria           string   `json:"categoria"`
	Subtipo             string   `json:"subtipo"`
	ContactoPrincipal   string   `json:"contacto_principal"`
	ContactoNombre      string   `json:"contacto_nombre"`
	Horario             string   `json:"horario"`
	Estado              string   `json:"estado"`
	EntidadVerificadora string   `json:"entidad_verificadora"`
	CapacidadEstado     string   `json:"capacidad_estado"`
	NecesidadesRaw      string   `json:"necesidades_raw"`
	NecesidadesTags     []string `json:"necesidades_tags"`
	NombreZona          string   `json:"nombre_zona"`
	HabitadoActualmente bool     `json:"habitado_actualmente"`
	CantidadNinos       int      `json:"cantidad_ninos"`
	CantidadAdultos     int      `json:"cantidad_adultos"`
	CantidadAncianos    int      `json:"cantidad_ancianos"`
	AnimalesDetalle     string   `json:"animales_detalle"`
	RiesgoAsbesto       bool     `json:"riesgo_asbesto"`
	LogisticaLlegada    string   `json:"logistica_llegada"`
	RequiereVoluntarios bool     `json:"requiere_voluntarios"`
	Urgencia            string   `json:"urgencia"`
}

type PuntoUpdateRequest struct {
	Nombre              *string   `json:"nombre,omitempty"`
	Latitud             *float64  `json:"latitud,omitempty"`
	Longitud            *float64  `json:"longitud,omitempty"`
	Direccion           *string   `json:"direccion,omitempty"`
	Ciudad              *string   `json:"ciudad,omitempty"`
	Categoria           *string   `json:"categoria,omitempty"`
	Subtipo             *string   `json:"subtipo,omitempty"`
	ContactoPrincipal   *string   `json:"contacto_principal,omitempty"`
	ContactoNombre      *string   `json:"contacto_nombre,omitempty"`
	Horario             *string   `json:"horario,omitempty"`
	Estado              *string   `json:"estado,omitempty"`
	EntidadVerificadora *string   `json:"entidad_verificadora,omitempty"`
	NotasInternas       *string   `json:"notas_internas,omitempty"`
	CapacidadEstado     *string   `json:"capacidad_estado,omitempty"`
	NecesidadesRaw      *string   `json:"necesidades_raw,omitempty"`
	NecesidadesTags     *[]string `json:"necesidades_tags,omitempty"`
	AnimalesDetalle     *string   `json:"animales_detalle,omitempty"`
	LogisticaLlegada    *string   `json:"logistica_llegada,omitempty"`
	Urgencia            *string   `json:"urgencia,omitempty"`
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
