package pkg

import (
	"database/sql"
	"os"
	"path/filepath"

	"social/pkg/db/sqlite"
)

func DBInstance() (*sql.DB, error) {
	currentDir, err := os.Getwd()
	if err != nil {
		return nil, err
	}

	dbPath := filepath.Join(currentDir, "pkg", "db", "backend.db")
	migrationsPath := filepath.Join(currentDir, "pkg", "db", "sqlite")

	db, err := sqlite.InitDB(dbPath, migrationsPath)
	return db, err
}
