package repository

import(
	"database/sql"
	"errors"
	"fmt"
	"log"
)

// GetUserCredentials takes in either a nickname or email and returns the userid & password, and an error if non are found
// it checks for the email first then the nickname if you did not pass the email.
func (q *Query) GetUserCredentials(identifier string) (userID, password string, err error) {
    row := q.Db.QueryRow(`
        SELECT id, password 
        FROM users 
        WHERE email = ? OR nickname = ?
        LIMIT 1
    `, identifier, identifier)

    err = row.Scan(&userID, &password)
    if err == sql.ErrNoRows {
        log.Printf("Login failed: user not found by identifier '%s'", identifier)
        return "", "", errors.New("user not found by email or nickname")
    }
    if err != nil {
        log.Printf("Database error when retrieving credentials for '%s': %v", identifier, err)
        return "", "", fmt.Errorf("database error: %w", err)
    }
    
    log.Printf("User found: %s successfully authenticated", userID)

    return userID, password, nil
}
