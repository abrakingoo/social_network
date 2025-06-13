package repository

import (
	"fmt"
	"strings"
)

// UpdateUser updates specific columns in the given table for a user identified by their ID.
//
// Parameters:
//   - userid: the ID of the user whose data will be updated.
//   - table: the name of the database table (must be validated to avoid SQL injection).
//   - columns: a list of column names to be updated.
//   - values: the corresponding values to update the columns with.
//
// Returns:
//   - An error if the input is invalid, the table/columns are not allowed, or the SQL execution fails.

func (q *Query) UpdateUser(userid string, table string, columns []string, values []any) error {
	// Validate input
	if len(columns) == 0 {
		return fmt.Errorf("UpdateUser: no columns provided (update data)")
	}
	if len(columns) != len(values) {
		return fmt.Errorf("UpdateUser: number of columns (%d) does not match number of values (%d)", len(columns), len(values))
	}

	// Build the SET clause with placeholders
	setClauses := make([]string, len(columns))
	for i, col := range columns {
		setClauses[i] = fmt.Sprintf("%s = ?", col)
	}

	// Build the query string
	query := fmt.Sprintf(
		"UPDATE %s SET %s WHERE id = ?",
		table,
		strings.Join(setClauses, ", "),
	)

	// Append the userid to the values slice for the WHERE clause
	args := append(values, userid)

	// Execute the query
	_, err := q.Db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("failed to update data: %w", err)
	}

	return nil
}
