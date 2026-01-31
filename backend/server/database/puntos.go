package database

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/P1ngu-Dev/donde-ayudo-cl/backend/models"
)

func GetPuntos(categoria, subtipo, ciudad, estado string, page, limit int) (*models.PuntosListResponse, error) {
	if estado == "" {
		estado = "activo"
	}

	query := `
		SELECT id, nombre, latitud, longitud, direccion, ciudad, categoria, subtipo,
		       categorias_ayuda, nivel_urgencia,
		       contacto_principal, contacto_nombre, horario, estado, entidad_verificadora,
		       fecha_verificacion, notas_internas, capacidad_estado,
		       necesidades_raw, necesidades_tags, nombre_zona, habitado_actualmente,
		       cantidad_ninos, cantidad_adolescentes, cantidad_adultos, cantidad_ancianos,
		       animales_detalle, riesgo_asbesto, foto_asbesto, logistica_llegada,
		       tipos_acceso, requiere_voluntarios, tiene_banos, tiene_electricidad,
		       tiene_senal, fallecidos_reportados, evidencia_fotos, archivo_kml,
		       created, updated, created_by
		FROM puntos
		WHERE 1=1
	`
	args := []interface{}{}
	placeholder := 1

	if estado != "" {
		query += fmt.Sprintf(" AND estado = $%d", placeholder)
		args = append(args, estado)
		placeholder++
	}
	if categoria != "" {
		query += fmt.Sprintf(" AND categoria = $%d", placeholder)
		args = append(args, categoria)
		placeholder++
	}
	if subtipo != "" {
		query += fmt.Sprintf(" AND subtipo = $%d", placeholder)
		args = append(args, subtipo)
		placeholder++
	}
	if ciudad != "" {
		query += fmt.Sprintf(" AND ciudad = $%d", placeholder)
		args = append(args, ciudad)
		placeholder++
	}

	// Contar total con los mismos filtros
	countQuery := "SELECT COUNT(*) FROM puntos WHERE 1=1"
	countArgs := []interface{}{}
	countPlaceholder := 1

	if estado != "" {
		countQuery += fmt.Sprintf(" AND estado = $%d", countPlaceholder)
		countArgs = append(countArgs, estado)
		countPlaceholder++
	}
	if categoria != "" {
		countQuery += fmt.Sprintf(" AND categoria = $%d", countPlaceholder)
		countArgs = append(countArgs, categoria)
		countPlaceholder++
	}
	if subtipo != "" {
		countQuery += fmt.Sprintf(" AND subtipo = $%d", countPlaceholder)
		countArgs = append(countArgs, subtipo)
		countPlaceholder++
	}
	if ciudad != "" {
		countQuery += fmt.Sprintf(" AND ciudad = $%d", countPlaceholder)
		countArgs = append(countArgs, ciudad)
		countPlaceholder++
	}

	var total int
	err := DB.QueryRow(countQuery, countArgs...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("error contando puntos: %w", err)
	}

	offset := (page - 1) * limit
	query += fmt.Sprintf(" ORDER BY created DESC LIMIT $%d OFFSET $%d", placeholder, placeholder+1)
	args = append(args, limit, offset)

	rows, err := DB.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("error listando puntos: %w", err)
	}
	defer rows.Close()

	puntos := []models.Punto{}
	for rows.Next() {
		punto, err := scanPunto(rows)
		if err != nil {
			return nil, err
		}
		puntos = append(puntos, *punto)
	}

	return &models.PuntosListResponse{
		Data:  puntos,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

func GetPuntoByID(id string) (*models.Punto, error) {
	query := `
		SELECT id, nombre, latitud, longitud, direccion, ciudad, categoria, subtipo,
		       categorias_ayuda, nivel_urgencia,
		       contacto_principal, contacto_nombre, horario, estado, entidad_verificadora,
		       fecha_verificacion, notas_internas, capacidad_estado,
		       necesidades_raw, necesidades_tags, nombre_zona, habitado_actualmente,
		       cantidad_ninos, cantidad_adolescentes, cantidad_adultos, cantidad_ancianos,
		       animales_detalle, riesgo_asbesto, foto_asbesto, logistica_llegada,
		       tipos_acceso, requiere_voluntarios, tiene_banos, tiene_electricidad,
		       tiene_senal, fallecidos_reportados, evidencia_fotos, archivo_kml,
		       created, updated, created_by
		FROM puntos
		WHERE id = $1
		LIMIT 1
	`

	rows, err := DB.Query(query, id)
	if err != nil {
		return nil, fmt.Errorf("error buscando punto: %w", err)
	}
	defer rows.Close()

	if rows.Next() {
		return scanPunto(rows)
	}

	return nil, sql.ErrNoRows
}

func CreatePunto(req models.PuntoCreateRequest, createdBy string) (*models.Punto, error) {
	id := fmt.Sprintf("pnt_%d", time.Now().UnixNano())

	necesidadesJSON, _ := json.Marshal(req.NecesidadesTags)
	categoriasJSON, _ := json.Marshal(req.CategoriasAyuda)
	tiposAccesoJSON, _ := json.Marshal(req.TiposAcceso)
	evidenciaJSON, _ := json.Marshal(req.EvidenciaFotos)

	query := `
		INSERT INTO puntos (
			id, nombre, latitud, longitud, direccion, ciudad, categoria, subtipo,
			categorias_ayuda, nivel_urgencia,
			contacto_principal, contacto_nombre, horario, estado, entidad_verificadora,
			fecha_verificacion, capacidad_estado, necesidades_raw, necesidades_tags,
			nombre_zona, habitado_actualmente, cantidad_ninos, cantidad_adolescentes,
			cantidad_adultos, cantidad_ancianos, animales_detalle, riesgo_asbesto,
			foto_asbesto, logistica_llegada, tipos_acceso, requiere_voluntarios,
			tiene_banos, tiene_electricidad, tiene_senal, fallecidos_reportados,
			evidencia_fotos, archivo_kml, created, updated, created_by
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), $16,
			$17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31,
			$32, $33, $34, $35, $36, NOW(), NOW(), $37
		)
	`

	_, err := DB.Exec(query,
		id, req.Nombre, req.Latitud, req.Longitud, req.Direccion, req.Ciudad,
		req.Categoria, req.Subtipo, string(categoriasJSON), req.NivelUrgencia,
		req.ContactoPrincipal, req.ContactoNombre, req.Horario, req.Estado,
		req.EntidadVerificadora, req.CapacidadEstado, req.NecesidadesRaw,
		string(necesidadesJSON), req.NombreZona, req.HabitadoActualmente,
		req.CantidadNinos, req.CantidadAdolescentes, req.CantidadAdultos,
		req.CantidadAncianos, req.AnimalesDetalle, req.RiesgoAsbesto,
		req.FotoAsbesto, req.LogisticaLlegada, string(tiposAccesoJSON),
		req.RequiereVoluntarios, req.TieneBanos, req.TieneElectricidad,
		req.TieneSenal, req.FallecidosReportados, string(evidenciaJSON),
		req.ArchivoKML, createdBy,
	)

	if err != nil {
		return nil, fmt.Errorf("error creando punto: %w", err)
	}

	return GetPuntoByID(id)
}

func UpdatePunto(id string, req models.PuntoUpdateRequest) (*models.Punto, error) {
	updates := []string{}
	args := []interface{}{}
	placeholder := 1

	if req.Nombre != nil {
		updates = append(updates, fmt.Sprintf("nombre = $%d", placeholder))
		args = append(args, *req.Nombre)
		placeholder++
	}
	if req.Latitud != nil {
		updates = append(updates, fmt.Sprintf("latitud = $%d", placeholder))
		args = append(args, *req.Latitud)
		placeholder++
	}
	if req.Longitud != nil {
		updates = append(updates, fmt.Sprintf("longitud = $%d", placeholder))
		args = append(args, *req.Longitud)
		placeholder++
	}
	if req.Direccion != nil {
		updates = append(updates, fmt.Sprintf("direccion = $%d", placeholder))
		args = append(args, *req.Direccion)
		placeholder++
	}
	if req.Ciudad != nil {
		updates = append(updates, fmt.Sprintf("ciudad = $%d", placeholder))
		args = append(args, *req.Ciudad)
		placeholder++
	}
	if req.Categoria != nil {
		updates = append(updates, fmt.Sprintf("categoria = $%d", placeholder))
		args = append(args, *req.Categoria)
		placeholder++
	}
	if req.Subtipo != nil {
		updates = append(updates, fmt.Sprintf("subtipo = $%d", placeholder))
		args = append(args, *req.Subtipo)
		placeholder++
	}
	if req.ContactoPrincipal != nil {
		updates = append(updates, fmt.Sprintf("contacto_principal = $%d", placeholder))
		args = append(args, *req.ContactoPrincipal)
		placeholder++
	}
	if req.ContactoNombre != nil {
		updates = append(updates, fmt.Sprintf("contacto_nombre = $%d", placeholder))
		args = append(args, *req.ContactoNombre)
		placeholder++
	}
	if req.Horario != nil {
		updates = append(updates, fmt.Sprintf("horario = $%d", placeholder))
		args = append(args, *req.Horario)
		placeholder++
	}
	if req.Estado != nil {
		updates = append(updates, fmt.Sprintf("estado = $%d", placeholder))
		args = append(args, *req.Estado)
		placeholder++
	}
	if req.EntidadVerificadora != nil {
		updates = append(updates, fmt.Sprintf("entidad_verificadora = $%d", placeholder))
		args = append(args, *req.EntidadVerificadora)
		placeholder++
	}
	if req.NotasInternas != nil {
		updates = append(updates, fmt.Sprintf("notas_internas = $%d", placeholder))
		args = append(args, *req.NotasInternas)
		placeholder++
	}
	if req.CapacidadEstado != nil {
		updates = append(updates, fmt.Sprintf("capacidad_estado = $%d", placeholder))
		args = append(args, *req.CapacidadEstado)
		placeholder++
	}
	if req.NecesidadesRaw != nil {
		updates = append(updates, fmt.Sprintf("necesidades_raw = $%d", placeholder))
		args = append(args, *req.NecesidadesRaw)
		placeholder++
	}
	if req.NecesidadesTags != nil {
		necesidadesJSON, _ := json.Marshal(*req.NecesidadesTags)
		updates = append(updates, fmt.Sprintf("necesidades_tags = $%d", placeholder))
		args = append(args, string(necesidadesJSON))
		placeholder++
	}

	if len(updates) == 0 {
		return GetPuntoByID(id)
	}

	updates = append(updates, "updated = NOW()")
	query := fmt.Sprintf("UPDATE puntos SET %s WHERE id = $%d", strings.Join(updates, ", "), placeholder)
	args = append(args, id)

	_, err := DB.Exec(query, args...)
	if err != nil {
		return nil, fmt.Errorf("error actualizando punto: %w", err)
	}

	return GetPuntoByID(id)
}

func UpdatePuntoEstado(id, estado, verificadoPor string) (*models.Punto, error) {
	query := `
		UPDATE puntos 
		SET estado = $1, 
		    fecha_verificacion = NOW(),
		    updated = NOW()
		WHERE id = $2
	`

	_, err := DB.Exec(query, estado, id)
	if err != nil {
		return nil, fmt.Errorf("error actualizando estado: %w", err)
	}

	return GetPuntoByID(id)
}

func DeletePunto(id string) error {
	query := `UPDATE puntos SET estado = 'oculto', updated = NOW() WHERE id = $1`
	_, err := DB.Exec(query, id)
	return err
}

func scanPunto(rows *sql.Rows) (*models.Punto, error) {
	punto := &models.Punto{}
	var necesidadesJSON sql.NullString
	var evidenciaJSON sql.NullString
	var categoriasJSON sql.NullString
	var tiposAccesoJSON sql.NullString
	var fechaVerif sql.NullString
	var created sql.NullString
	var updated sql.NullString
	var createdBy sql.NullString

	err := rows.Scan(
		&punto.ID, &punto.Nombre, &punto.Latitud, &punto.Longitud,
		&punto.Direccion, &punto.Ciudad, &punto.Categoria, &punto.Subtipo,
		&categoriasJSON, &punto.NivelUrgencia,
		&punto.ContactoPrincipal, &punto.ContactoNombre, &punto.Horario,
		&punto.Estado, &punto.EntidadVerificadora, &fechaVerif,
		&punto.NotasInternas, &punto.CapacidadEstado,
		&punto.NecesidadesRaw, &necesidadesJSON, &punto.NombreZona,
		&punto.HabitadoActualmente, &punto.CantidadNinos, &punto.CantidadAdolescentes,
		&punto.CantidadAdultos, &punto.CantidadAncianos, &punto.AnimalesDetalle,
		&punto.RiesgoAsbesto, &punto.FotoAsbesto, &punto.LogisticaLlegada,
		&tiposAccesoJSON, &punto.RequiereVoluntarios, &punto.TieneBanos,
		&punto.TieneElectricidad, &punto.TieneSenal, &punto.FallecidosReportados,
		&evidenciaJSON, &punto.ArchivoKML, &created, &updated, &createdBy,
	)

	if err != nil {
		return nil, fmt.Errorf("error escaneando punto: %w", err)
	}

	if fechaVerif.Valid && fechaVerif.String != "" {
		punto.FechaVerificacion = fechaVerif.String
	}

	if created.Valid {
		punto.Created = created.String
	}
	if updated.Valid {
		punto.Updated = updated.String
	}
	if createdBy.Valid {
		punto.CreatedBy = createdBy.String
	}

	// Parsear JSONB de categorias_ayuda
	if categoriasJSON.Valid && categoriasJSON.String != "" && categoriasJSON.String != "null" {
		json.Unmarshal([]byte(categoriasJSON.String), &punto.CategoriasAyuda)
	}

	// Parsear JSONB de tipos_acceso
	if tiposAccesoJSON.Valid && tiposAccesoJSON.String != "" && tiposAccesoJSON.String != "null" {
		json.Unmarshal([]byte(tiposAccesoJSON.String), &punto.TiposAcceso)
	}

	// Parsear JSONB de necesidades_tags (puede ser array simple o objeto complejo)
	if necesidadesJSON.Valid && necesidadesJSON.String != "" && necesidadesJSON.String != "null" {
		// Intentar parsear como objeto complejo primero
		var necTags interface{}
		json.Unmarshal([]byte(necesidadesJSON.String), &necTags)
		punto.NecesidadesTags = necTags
	}

	// Parsear JSONB de evidencia_fotos
	if evidenciaJSON.Valid && evidenciaJSON.String != "" && evidenciaJSON.String != "[]" && evidenciaJSON.String != "null" {
		json.Unmarshal([]byte(evidenciaJSON.String), &punto.EvidenciaFotos)
	}

	return punto, nil
}
