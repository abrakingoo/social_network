package test

import (
	"social/pkg/util"
	"testing"

	"golang.org/x/crypto/bcrypt"
)

func TestEncryptPassword(t *testing.T) {
	password := "myTestPassword123"

	hashedPassword, err := util.EncryptPassword(password)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if hashedPassword == "" {
		t.Fatal("Expected a hashed password, got empty string")
	}

	err = bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	if err != nil {
		t.Fatalf("Password does not match hashed password: %v", err)
	}
}
