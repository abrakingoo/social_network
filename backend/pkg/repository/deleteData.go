package repository

import (
	"fmt"
	"strings"
)

// DeleteData performs a conditional DELETE operation on any table with dynamic WHERE clauses.
// This generic function allows deleting records based on multiple column conditions.
//
// Parameters:
//   - table: The name of the table to delete from
//   - whereColumns: Column names for the WHERE clause conditions
//   - whereValues: Values corresponding to whereColumns (must match length)
//
// Example usage:
//   // Delete a specific follow relationship
//   err := q.DeleteData("follows", []string{"follower_id", "following_id"}, []any{123, 456})
//   
//   // Delete all pending requests for a user
//   err := q.DeleteData("follows", []string{"follower_id", "status"}, []any{123, "pending"})
//
// Returns error if column/value length mismatches occur or if the database operation fails.
// WARNING: This will permanently delete matching records. Ensure WHERE conditions are specific enough.


func (q *Query) DeleteData(table string, whereColumns []string, whereValues []any) error {
	if len(whereColumns) == 0 || len(whereColumns) != len(whereValues) {
		return fmt.Errorf("DeleteData: whereColumns and whereValues length mismatch")
	}

	// Build WHERE clause: col1 = ? AND col2 = ? ...
	whereClauses := make([]string, len(whereColumns))
	for i, col := range whereColumns {
		whereClauses[i] = fmt.Sprintf("%s = ?", col)
	}

	query := fmt.Sprintf(
		"DELETE FROM %s WHERE %s",
		table,
		strings.Join(whereClauses, " AND "),
	)

	_, err := q.Db.Exec(query, whereValues...)
	if err != nil {
		return fmt.Errorf("DeleteData failed: %w", err)
	}
	return nil
}
