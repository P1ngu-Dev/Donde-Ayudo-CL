package database

import (
	"fmt"
	"strings"
)

// ConvertToPostgres convierte una query SQLite con ? a PostgreSQL con $1, $2, etc.
func ConvertToPostgres(query string) string {
	result := ""
	placeholder := 1
	for i := 0; i < len(query); i++ {
		if query[i] == '?' {
			result += fmt.Sprintf("$%d", placeholder)
			placeholder++
		} else {
			result += string(query[i])
		}
	}
	// Reemplazar datetime('now') con NOW()
	result = strings.ReplaceAll(result, "datetime('now')", "NOW()")
	return result
}
