package util

import "golang.org/x/crypto/bcrypt"

func ValidatePassword(password string, hashedPassword string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}