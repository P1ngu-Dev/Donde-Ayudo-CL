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
		estado = "publicado"
	}

	query := `
		SELECT id, nombre, latitud, longitud, direccion, ciudad, categoria, subtipo,
		       contacto_principal, contacto_nombre, horario, estado, entidad_verificadora,
		       fecha_verificacion, notas_internas, capacidad_estado,
		       necesidades_raw, necesidades_tags, nombre_zona, habitado_actualmente,
		       cantidad_ninos, cantidad_adultos, cantidad_ancianos, animales_detalle,
		       riesgo_asbesto, logistica_llegada, requiere_voluntarios, urgencia,
		       evidencia_fotos, created, updated
		FROM puntos
		WHERE 1=1
	`
	args := []interface{}{}

	if estado != "" {
		query += " AND estado = ?"
		args = append(args, estado)
	}
	if categoria != "" {
		query += " AND categoria = ?"
		args = append(args, categoria)
	}
	if subtipo != "" {
		query += " AND subtipo = ?"
		args = append(args, subtipo)
	}
	if ciudad != "" {
		query += " AND ciudad = ?"
		args = append(args, ciudad)
	}

	// Contar total con los mismos filtros
	countQuery := "SELECT COUNT(*) FROM puntos WHERE 1=1"
	countArgs := []interface{}{}

	if estado != "" {
		countQuery += " AND estado = ?"
		countArgs = append(countArgs, estado)
	}
	if categoria != "" {
		countQuery += " AND categoria = ?"
		countArgs = append(countArgs, categoria)
	}
	if subtipo != "" {
		countQuery += " AND subtipo = ?"
		countArgs = append(countArgs, subtipo)
	}
	if ciudad != "" {
		countQuery += " AND ciudad = ?"
		countArgs = append(countArgs, ciudad)
	}

	var total int
	err := DB.QueryRow(countQuery, countArgs...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("error contando puntos: %w", err)
	}

	offset := (page - 1) * limit
	query += " ORDER BY created DESC LIMIT ? OFFSET ?"
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
		       contacto_principal, contacto_nombre, horario, estado, entidad_verificadora,
		       fecha_verificacion, notas_internas, capacidad_estado,
		       necesidades_raw, necesidades_tags, nombre_zona, habitado_actualmente,
		       cantidad_ninos, cantidad_adultos, cantidad_ancianos, animales_detalle,
		       riesgo_asbesto, logistica_llegada, requiere_voluntarios, urgencia,
		       evidencia_fotos, created, updated
		FROM puntos
		WHERE id = ?
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

func CreatePunto(req models.PuntoCreateRequest, verificadoPor string) (*models.Punto, error) {
	id := fmt.Sprintf("pnt_%d", time.Now().UnixNano())

	necesidadesJSON, _ := json.Marshal(req.NecesidadesTags)

	query := `
		INSERT INTO puntos (
			id, nombre, latitud, longitud, direccion, ciudad, categoria, subtipo,
			contacto_principal, contacto_nombre, horario, estado, entidad_verificadora,
			fecha_verificacion, capacidad_estado, necesidades_raw,
			necesidades_tags, nombre_zona, habitado_actualmente, cantidad_ninos,
			cantidad_adultos, cantidad_ancianos, animales_detalle, riesgo_asbesto,
			logistica_llegada, requiere_voluntarios, urgencia, created, updated
		) VALUES (
			?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?,
			?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')
		)
	`

	_, err := DB.Exec(query,
		id, req.Nombre, req.Latitud, req.Longitud, req.Direccion, req.Ciudad,
		req.Categoria, req.Subtipo, req.ContactoPrincipal, req.ContactoNombre,
		req.Horario, req.Estado, req.EntidadVerificadora,
		req.CapacidadEstado, req.NecesidadesRaw, string(necesidadesJSON),
		req.NombreZona, req.HabitadoActualmente, req.CantidadNinos,
		req.CantidadAdultos, req.CantidadAncianos, req.AnimalesDetalle,
		req.RiesgoAsbesto, req.LogisticaLlegada, req.RequiereVoluntarios,
		req.Urgencia,
	)

	if err != nil {
		return nil, fmt.Errorf("error creando punto: %w", err)
	}

	return GetPuntoByID(id)
}

func UpdatePunto(id string, req models.PuntoUpdateRequest) (*models.Punto, error) {
	updates := []string{}
	args := []interface{}{}

	if req.Nombre != nil {
		updates = append(updates, "nombre = ?")
		args = append(args, *req.Nombre)
	}
	if req.Latitud != nil {
		updates = append(updates, "latitud = ?")
		args = append(args, *req.Latitud)
	}
	if req.Longitud != nil {
		updates = append(updates, "longitud = ?")
		args = append(args, *req.Longitud)
	}
	if req.Direccion != nil {
		updates = append(updates, "direccion = ?")
		args = append(args, *req.Direccion)
	}
	if req.Ciudad != nil {
		updates = append(updates, "ciudad = ?")
		args = append(args, *req.Ciudad)
	}
	if req.Categoria != nil {
		updates = append(updates, "categoria = ?")
		args = append(args, *req.Categoria)
	}
	if req.Subtipo != nil {
		updates = append(updates, "subtipo = ?")
		args = append(args, *req.Subtipo)
	}
	if req.ContactoPrincipal != nil {
		updates = append(updates, "contacto_principal = ?")
		args = append(args, *req.ContactoPrincipal)
	}
	if req.ContactoNombre != nil {
		updates = append(updates, "contacto_nombre = ?")
		args = append(args, *req.ContactoNombre)
	}
	if req.Horario != nil {
		updates = append(updates, "horario = ?")
		args = append(args, *req.Horario)
	}
	if req.Estado != nil {
		updates = append(updates, "estado = ?")
		args = append(args, *req.Estado)
	}
	if req.EntidadVerificadora != nil {
		updates = append(updates, "entidad_verificadora = ?")
		args = append(args, *req.EntidadVerificadora)
	}
	if req.NotasInternas != nil {
		updates = append(updates, "notas_internas = ?")
		args = append(args, *req.NotasInternas)
	}
	if req.CapacidadEstado != nil {
		updates = append(updates, "capacidad_estado = ?")
		args = append(args, *req.CapacidadEstado)
	}
	if req.NecesidadesRaw != nil {
		updates = append(updates, "necesidades_raw = ?")
		args = append(args, *req.NecesidadesRaw)
	}
	if req.NecesidadesTags != nil {
		necesidadesJSON, _ := json.Marshal(*req.NecesidadesTags)
		updates = append(updates, "necesidades_tags = ?")
		args = append(args, string(necesidadesJSON))
	}

	if len(updates) == 0 {
		return GetPuntoByID(id)
	}

	updates = append(updates, "updated = datetime('now')")
	query := "UPDATE puntos SET " + strings.Join(updates, ", ") + " WHERE id = ?"
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
		SET estado = ?, 
		    fecha_verificacion = datetime('now'),
		    updated = datetime('now')
		WHERE id = ?
	`

	_, err := DB.Exec(query, estado, id)
	if err != nil {
		return nil, fmt.Errorf("error actualizando estado: %w", err)
	}

	return GetPuntoByID(id)
}

func DeletePunto(id string) error {
	query := `UPDATE puntos SET estado = 'oculto', updated = datetime('now') WHERE id = ?`
	_, err := DB.Exec(query, id)
	return err
}

func scanPunto(rows *sql.Rows) (*models.Punto, error) {
	punto := &models.Punto{}
	var necesidadesJSON sql.NullString
	var evidenciaJSON sql.NullString
	var fechaVerif sql.NullString
	var created sql.NullString
	var updated sql.NullString

	err := rows.Scan(
		&punto.ID, &punto.Nombre, &punto.Latitud, &punto.Longitud,
		&punto.Direccion, &punto.Ciudad, &punto.Categoria, &punto.Subtipo,
		&punto.ContactoPrincipal, &punto.ContactoNombre, &punto.Horario,
		&punto.Estado, &punto.EntidadVerificadora, &fechaVerif,
		&punto.NotasInternas, &punto.CapacidadEstado,
		&punto.NecesidadesRaw, &necesidadesJSON, &punto.NombreZona,
		&punto.HabitadoActualmente, &punto.CantidadNinos, &punto.CantidadAdultos,
		&punto.CantidadAncianos, &punto.AnimalesDetalle, &punto.RiesgoAsbesto,
		&punto.LogisticaLlegada, &punto.RequiereVoluntarios, &punto.Urgencia,
		&evidenciaJSON, &created, &updated,
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

	if necesidadesJSON.Valid && necesidadesJSON.String != "" && necesidadesJSON.String != "null" {
		json.Unmarshal([]byte(necesidadesJSON.String), &punto.NecesidadesTags)
	}

	if evidenciaJSON.Valid && evidenciaJSON.String != "" && evidenciaJSON.String != "[]" && evidenciaJSON.String != "null" {
		json.Unmarshal([]byte(evidenciaJSON.String), &punto.EvidenciaFotos)
	}

	return punto, nil
}
