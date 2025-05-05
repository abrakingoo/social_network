package pkg

import (
	"database/sql"
	"os"
	"path/filepath"
	"social/pkg/sqlite"
)


func DBInstance () (*sql.DB ,error ){
	currentDir, err := os.Getwd()
    if err != nil {
        return nil,err
    }

    dbPath := filepath.Join(currentDir, "backend.db")
    migrationsPath := filepath.Join(currentDir,"pkg","sqlite")

    db, err := sqlite.InitDB(dbPath, migrationsPath)
    return db,err
}