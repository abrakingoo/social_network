package main

import (
	"log"
	"os"
	"path/filepath"
	"social/pkg/sqlite"


)

func main() {
    currentDir, err := os.Getwd()
    if err != nil {
        log.Fatalf("Failed to get current directory: %v", err)
    }

    dbPath := filepath.Join(currentDir, "backend.db")
    migrationsPath := filepath.Join(currentDir, "pkg","sqlite")

    db, err := sqlite.InitDB(dbPath, migrationsPath)
    if err != nil {
        log.Fatalf("Failed to initialize database: %v", err)
    }
    defer db.Close()

    log.Println("Database successfully initialized and migrated.")
}
