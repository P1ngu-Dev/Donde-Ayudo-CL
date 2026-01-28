package database

import (
	"database/sql"
	"fmt"
	"log"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

func Connect(dbPath string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("error abriendo base de datos: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("error conectando a base de datos: %w", err)
	}

	DB = db
	log.Printf("✅ Conectado a SQLite: %s\n", dbPath)
	return db, nil
}

func Close() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}
