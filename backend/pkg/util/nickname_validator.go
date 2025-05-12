package util

import (
	"errors"
	"regexp"
)

func ValidateNickname(username string) error {
	// Ensure it starts with a letter
	if !regexp.MustCompile(`^[a-zA-Z]`).MatchString(username) {
		return errors.New("username must start with a letter")
	}

	// Allow only letters, numbers, and underscores
	if !regexp.MustCompile(`^[a-zA-Z0-9_]+$`).MatchString(username) {
		return errors.New("username can only contain letters, numbers, and underscores")
	}

	// Avoid consecutive underscores
	if regexp.MustCompile(`__+`).MatchString(username) {
		return errors.New("username cannot have consecutive underscores")
	}

	// Reserved usernames
	reserved := map[string]bool{"admin": true, "root": true, "system": true, "test": true, "null": true, "localhost": true, "void": true, "guest": true}
	if reserved[username] {
		return errors.New("username is reserved")
	}

	return nil
}
