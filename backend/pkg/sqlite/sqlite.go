package sqlite

import (
	"database/sql"

    "github.com/golang-migrate/migrate/v4/database/sqlite3"
	"github.com/golang-migrate/migrate/v4"
	_ "github.com/mattn/go-sqlite3"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func InitDB(dbPath string, migrationsPath string) (*sql.DB, error) {
    db, err := sql.Open("sqlite3", dbPath)
    if err != nil {
        return nil, err
    }

    driver, err := sqlite3.WithInstance(db, &sqlite3.Config{})
    if err != nil {
        return nil, err
    }

    m, err := migrate.NewWithDatabaseInstance(
        "file://"+migrationsPath,
        "sqlite3", driver,
    )
    if err != nil {
        return nil, err
    }

    if err := m.Up(); err != nil && err != migrate.ErrNoChange {
        return nil, err
    }

    return db, nil
}
