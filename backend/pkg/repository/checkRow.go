package repository

import (
	"fmt"
	"strings"
)

// RowExists checks whether a row exists in the given table
// matching the specified column=value conditions.
//
// Parameters:
//   - table: Table name
//   - whereColumns: Slice of column names for the WHERE clause
//   - whereValues: Slice of corresponding values (must match column count)
//
// Returns true if a row exists, false otherwise.
func (q *Query) CheckRow(table string, whereColumns []string, whereValues []any) (bool, error) {
	if len(whereColumns) == 0 || len(whereColumns) != len(whereValues) {
		return false, fmt.Errorf("RowExists: whereColumns and whereValues must be non-empty and of equal length")
	}

	// Build WHERE clause
	whereClauses := make([]string, len(whereColumns))
	for i, col := range whereColumns {
		whereClauses[i] = fmt.Sprintf("%s = ?", col)
	}

	query := fmt.Sprintf(
		"SELECT EXISTS(SELECT 1 FROM %s WHERE %s LIMIT 1)",
		table,
		strings.Join(whereClauses, " AND "),
	)

	var exists bool
	err := q.Db.QueryRow(query, whereValues...).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("RowExists: failed to execute existence check on table '%s': %w", table, err)
	}

	return exists, nil
}
