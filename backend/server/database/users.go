package database

import (
	"database/sql"
	"fmt"

	"github.com/P1ngu-Dev/donde-ayudo-cl/backend/models"
)

func GetUserByEmail(email string) (*models.User, error) {
	query := `
		SELECT id, email, name, rol, organizacion, avatar, 
		       emailVisibility, verified, activo, 
		       COALESCE(must_change_password, FALSE) as must_change_password,
		       created, updated
		FROM users 
		WHERE email = $1 AND activo = TRUE
		LIMIT 1
	`

	user := &models.User{}
	var organizacion, avatar sql.NullString

	err := DB.QueryRow(query, email).Scan(
		&user.ID, &user.Email, &user.Name, &user.Rol,
		&organizacion, &avatar, &user.EmailVisibility,
		&user.Verified, &user.Activo, &user.MustChangePassword,
		&user.Created, &user.Updated,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("error buscando usuario: %w", err)
	}

	if organizacion.Valid {
		user.Organizacion = organizacion.String
	}
	if avatar.Valid {
		user.Avatar = avatar.String
	}

	return user, nil
}

func GetUserByID(id string) (*models.User, error) {
	query := `
		SELECT id, email, name, rol, organizacion, avatar, 
		       emailVisibility, verified, activo,
		       COALESCE(must_change_password, FALSE) as must_change_password,
		       created, updated
		FROM users 
		WHERE id = $1
		LIMIT 1
	`

	user := &models.User{}
	var organizacion, avatar sql.NullString

	err := DB.QueryRow(query, id).Scan(
		&user.ID, &user.Email, &user.Name, &user.Rol,
		&organizacion, &avatar, &user.EmailVisibility,
		&user.Verified, &user.Activo, &user.MustChangePassword,
		&user.Created, &user.Updated,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("error buscando usuario: %w", err)
	}

	if organizacion.Valid {
		user.Organizacion = organizacion.String
	}
	if avatar.Valid {
		user.Avatar = avatar.String
	}

	return user, nil
}

func GetUserPasswordHash(email string) (string, error) {
	var passwordHash string
	query := `SELECT password FROM users WHERE email = $1 AND activo = TRUE LIMIT 1`
	err := DB.QueryRow(query, email).Scan(&passwordHash)

	if err == sql.ErrNoRows {
		return "", nil
	}
	if err != nil {
		return "", fmt.Errorf("error obteniendo password: %w", err)
	}

	return passwordHash, nil
}

func GetUsers() ([]models.User, error) {
	query := `
		SELECT id, email, name, rol, organizacion, avatar, 
		       emailVisibility, verified, activo,
		       COALESCE(must_change_password, FALSE) as must_change_password,
		       created, updated
		FROM users 
		ORDER BY created DESC
	`

	rows, err := DB.Query(query)
	if err != nil {
		return nil, fmt.Errorf("error listando usuarios: %w", err)
	}
	defer rows.Close()

	users := []models.User{}
	for rows.Next() {
		user := models.User{}
		var organizacion, avatar sql.NullString

		err := rows.Scan(
			&user.ID, &user.Email, &user.Name, &user.Rol,
			&organizacion, &avatar, &user.EmailVisibility,
			&user.Verified, &user.Activo, &user.MustChangePassword,
			&user.Created, &user.Updated,
		)
		if err != nil {
			return nil, fmt.Errorf("error escaneando usuario: %w", err)
		}

		if organizacion.Valid {
			user.Organizacion = organizacion.String
		}
		if avatar.Valid {
			user.Avatar = avatar.String
		}

		users = append(users, user)
	}

	return users, nil
}

func CreateUser(email, name, passwordHash, rol, organizacion string) (*models.User, error) {
	id := fmt.Sprintf("usr_%d", generateRandomID())

	query := `
		INSERT INTO users (id, email, name, password, rol, organizacion, 
		                   emailVisibility, verified, activo, must_change_password, created, updated, tokenKey)
		VALUES ($1, $2, $3, $4, $5, $6, FALSE, TRUE, TRUE, FALSE, NOW(), NOW(), $7)
	`

	tokenKey := fmt.Sprintf("tk_%d", generateRandomID())
	_, err := DB.Exec(query, id, email, name, passwordHash, rol, organizacion, tokenKey)
	if err != nil {
		return nil, fmt.Errorf("error creando usuario: %w", err)
	}

	return GetUserByID(id)
}

// CreateUserWithTempPassword crea un usuario que debe cambiar su contraseña en el primer login
func CreateUserWithTempPassword(email, name, passwordHash, rol, organizacion string) (*models.User, error) {
	id := fmt.Sprintf("usr_%d", generateRandomID())

	query := `
		INSERT INTO users (id, email, name, password, rol, organizacion, 
		                   emailVisibility, verified, activo, must_change_password, created, updated, tokenKey)
		VALUES ($1, $2, $3, $4, $5, $6, FALSE, TRUE, TRUE, TRUE, NOW(), NOW(), $7)
	`

	tokenKey := fmt.Sprintf("tk_%d", generateRandomID())
	_, err := DB.Exec(query, id, email, name, passwordHash, rol, organizacion, tokenKey)
	if err != nil {
		return nil, fmt.Errorf("error creando usuario: %w", err)
	}

	return GetUserByID(id)
}

// UpdateUserPassword actualiza la contraseña de un usuario
func UpdateUserPassword(userID, newPasswordHash string) error {
	query := `UPDATE users SET password = $1, updated = NOW() WHERE id = $2`
	_, err := DB.Exec(query, newPasswordHash, userID)
	return err
}

// ClearMustChangePassword quita el flag de cambio de contraseña obligatorio
func ClearMustChangePassword(userID string) error {
	query := `UPDATE users SET must_change_password = FALSE, updated = NOW() WHERE id = $1`
	_, err := DB.Exec(query, userID)
	return err
}

// UpdateUserRol actualiza el rol de un usuario
func UpdateUserRol(userID, rol string) error {
	query := `UPDATE users SET rol = $1, updated = NOW() WHERE id = $2`
	_, err := DB.Exec(query, rol, userID)
	return err
}

// ToggleUserActive activa o desactiva un usuario
func ToggleUserActive(userID string, activo bool) error {
	query := `UPDATE users SET activo = $1, updated = NOW() WHERE id = $2`
	_, err := DB.Exec(query, activo, userID)
	return err
}

// GetUserPasswordHashByID obtiene el hash de contraseña por ID
func GetUserPasswordHashByID(userID string) (string, error) {
	var passwordHash string
	query := `SELECT password FROM users WHERE id = $1 LIMIT 1`
	err := DB.QueryRow(query, userID).Scan(&passwordHash)

	if err == sql.ErrNoRows {
		return "", nil
	}
	if err != nil {
		return "", fmt.Errorf("error obteniendo password: %w", err)
	}

	return passwordHash, nil
}

func generateRandomID() int64 {
	return 100000000 + int64(len("random")*1000000)
}
