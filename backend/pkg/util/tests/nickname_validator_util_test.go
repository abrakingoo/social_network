package test

import (
	validator "social/pkg/util"
	"testing"
)

func TestValidateNickname(t *testing.T) {
	// Valid usernames
	validUsernames := []string{"a", "A", "user_name", "UserName123", "a_b_c"}
	for _, username := range validUsernames {
		if err := validator.ValidateNickname(username); err != nil {
			t.Errorf("Expected valid username %s, but got error: %v", username, err)
		}
	}

	// Invalid usernames
	invalidUsernames := []string{
		"",           // empty string
		"1user",      // starts with number
		"user name",  // contains space
		"user@name",  // contains @
		"user-name",  // contains -
		"user..name", // contains ..
		"__user",     // starts with double underscore
		"user__name", // contains double underscore
		"admin",      // reserved
		"root",       // reserved
		"system",     // reserved
		"test",       // reserved
		"null",       // reserved
		"localhost",  // reserved
		"void",       // reserved
		"guest",      // reserved
	}

	for _, username := range invalidUsernames {
		err := validator.ValidateNickname(username)
		if err == nil {
			t.Errorf("Expected invalid username %s to return an error, but got nil", username)
		} else {
			t.Logf("Successfully detected invalid username %s with error: %v", username, err)
		}
	}
}
