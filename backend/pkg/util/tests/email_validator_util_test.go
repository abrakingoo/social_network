package test

import (
	"social/pkg/util"
	"testing"
)

func TestValidateEmail(t *testing.T) {
	cases := []struct {
		email    string
		expected bool
	}{
		{"test@example.com", true},
		{"user.name+tag+sorting@example.com", true},
		{"user@subdomain.example.com", true},
		{"invalid-email", false},
		{"@missingusername.com", false},
		{"missingdomain@.com", false},
		{"missingatsign.com", false},
		{"user@domain.com.123", false},
		{"", false},
		{"user@domain..com", true},
	}

	for _, tc := range cases {
		t.Run(tc.email, func(t *testing.T) {
			result := util.ValidateEmail(tc.email)
			if result != tc.expected {
				t.Errorf("For email '%s', expected %v but got %v", tc.email, tc.expected, result)
			}
		})
	}
}
