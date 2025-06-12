package repository

import (
	"fmt"
	"strings"
)

// UpdateData performs a conditional UPDATE operation on any table with dynamic WHERE and SET clauses.
// This generic function allows updating multiple columns based on multiple conditions.
//
// Parameters:
//   - table: The name of the table to update
//   - whereColumns: Column names for the WHERE clause conditions
//   - whereValues: Values corresponding to whereColumns (must match length)
//   - columns: Column names to be updated in the SET clause
//   - values: New values for the columns being updated (must match columns length)
//
// Example usage:
//   // Update user status from pending to accepted
//   err := q.UpdateData("follows", []string{"follower_id", "following_id"},
//                       []any{123, 456}, []string{"status"}, []any{"accepted"})
//
// Returns error if column/value length mismatches occur or if the database operation fails.

func (q *Query) UpdateData(table string, whereColumns []string, whereValues []any, columns []string, values []any) error {
	if len(columns) == 0 || len(columns) != len(values) {
		return fmt.Errorf("UpdateData: columns and values length mismatch")
	}
	if len(whereColumns) == 0 || len(whereColumns) != len(whereValues) {
		return fmt.Errorf("UpdateData: whereColumns and whereValues length mismatch")
	}

	// Build SET clause: col1 = ?, col2 = ?
	setClauses := make([]string, len(columns))
	for i, col := range columns {
		setClauses[i] = fmt.Sprintf("%s = ?", col)
	}

	// Build WHERE clause: col1 = ? AND col2 = ?
	whereClauses := make([]string, len(whereColumns))
	for i, col := range whereColumns {
		whereClauses[i] = fmt.Sprintf("%s = ?", col)
	}

	query := fmt.Sprintf(
		"UPDATE %s SET %s WHERE %s",
		table,
		strings.Join(setClauses, ", "),
		strings.Join(whereClauses, " AND "),
	)

	args := append(values, whereValues...)

	_, err := q.Db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("UpdateData failed: %w", err)
	}
	return nil
}
