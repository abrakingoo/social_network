package repository

import(
	"database/sql"
	"errors"
)

// this function takes in either a nickname or email and returns the userid & password, and an error if non are found
// it checks for the email first then the nickname if you did not pass the email.

func (q *Query) GetUserCredentials(identifier string) (userID string, password string, err error) {
    // Try as email first
    row := q.Db.QueryRow("SELECT id, password FROM users WHERE email = ?", identifier)
    err = row.Scan(&userID, &password)
    if err == nil {
        return userID, password, nil
    }
    if err != sql.ErrNoRows {
        return "", "", err
    }

    // Try as nickname next
    row = q.Db.QueryRow("SELECT id, password FROM users WHERE nickname = ?", identifier)
    err = row.Scan(&userID, &password)
    if err == nil {
        return userID, password, nil
    }
    if err == sql.ErrNoRows {
        return "", "", errors.New("user not found by username or nickname")
    }

    return "", "", err
}
