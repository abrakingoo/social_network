package test

import (
	"testing"

	"golang.org/x/crypto/bcrypt"
	"social/pkg/util"
)

func TestValidatePassword(t *testing.T) {
	// Arrange
	password := "my_secure_password"
	wrongPassword := "wrong_password"

	// Generate hashed password using bcrypt
	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	// Act & Assert
	t.Run("valid password", func(t *testing.T) {
		err := util.ValidatePassword(password, string(hashed))
		if err != nil {
			t.Errorf("expected password to be valid, got error: %v", err)
		}
	})

	t.Run("invalid password", func(t *testing.T) {
		err := util.ValidatePassword(wrongPassword, string(hashed))
		if err == nil {
			t.Errorf("expected error for wrong password, got nil")
		}
	})
}
