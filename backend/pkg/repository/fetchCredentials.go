package repository

import(
	"database/sql"
	"errors"
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
        return "", "", errors.New("user not found by email or nickname")
    }
    if err != nil {
        return "", "", err
    }

    return userID, password, nil
}
