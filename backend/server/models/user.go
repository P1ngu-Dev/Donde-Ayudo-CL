package models

type User struct {
	ID              string `json:"id"`
	Email           string `json:"email"`
	Name            string `json:"name"`
	Rol             string `json:"rol"`
	Organizacion    string `json:"organizacion"`
	Avatar          string `json:"avatar,omitempty"`
	EmailVisibility bool   `json:"email_visibility"`
	Verified        bool   `json:"verified"`
	Activo          bool   `json:"activo"`
	Created         string `json:"created,omitempty"`
	Updated         string `json:"updated,omitempty"`
}

type UserLogin struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type UserResponse struct {
	ID           string `json:"id"`
	Email        string `json:"email"`
	Name         string `json:"name"`
	Rol          string `json:"rol"`
	Organizacion string `json:"organizacion"`
	Avatar       string `json:"avatar,omitempty"`
	Verified     bool   `json:"verified"`
	Activo       bool   `json:"activo"`
	Created      string `json:"created,omitempty"`
}

type LoginResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

func (u *User) HasRole(allowedRoles ...string) bool {
	for _, role := range allowedRoles {
		if u.Rol == role {
			return true
		}
	}
	return false
}

func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:           u.ID,
		Email:        u.Email,
		Name:         u.Name,
		Rol:          u.Rol,
		Organizacion: u.Organizacion,
		Avatar:       u.Avatar,
		Verified:     u.Verified,
		Activo:       u.Activo,
		Created:      u.Created,
	}
}
