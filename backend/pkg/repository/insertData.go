package repository

import (
	"database/sql"
	"fmt"
	"strings"
)

func InsertData(db *sql.DB, table string, columns []string, values []any) error {
	// Validate input
	if len(columns) == 0 {
		return fmt.Errorf("no columns provided")
	}
	if len(columns) != len(values) {
		return fmt.Errorf("number of columns (%d) does not match number of values (%d)", len(columns), len(values))
	}

	// Prepare placeholders for the query
	placeholders := make([]string, len(columns))
	for i := range placeholders {
		placeholders[i] = "?"
	}

	// Build the query
	query := fmt.Sprintf(
		"INSERT INTO %s (%s) VALUES (%s)",
		table,
		strings.Join(columns, ", "),
		strings.Join(placeholders, ", "),
	)

	// Execute the query
	_, err := db.Exec(query, values...)
	if err != nil {
		return fmt.Errorf("failed to insert data: %w", err)
	}

	return nil
}
