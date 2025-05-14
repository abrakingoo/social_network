package test

import (
	"os"
	"social/pkg/util"
	"testing"
)

func TestIsValidMimeType(t *testing.T) {
	tests := []struct {
		filename       string
		expectedResult string
		expectedError  string
	}{
		{"testdata/thunderbolts.jpeg", "image/jpeg", ""},
		{"testdata/test_image.jpeg", "", "file is empty or too small to detect MIME type"},
		{"testdata/test_file.exe", "", "file is empty or too small to detect MIME type"},
		{"testdata/gif_test.gif", "image/gif", ""},
	}

	// Loop through the test cases
	for _, tt := range tests {
		t.Run(tt.filename, func(t *testing.T) {
			// Open the test file
			file, err := os.Open(tt.filename)
			if err != nil {
				t.Fatalf("failed to open file %s: %v", tt.filename, err)
			}
			defer file.Close()

			// Call the function to test
			isValid, err := util.IsValidMimeType(file)

			// Check if the result matches the expected result
			if isValid != tt.expectedResult {
				t.Errorf("IsValidMimeType() for file %s = %v, want %v", tt.filename, isValid, tt.expectedResult)
			}

			// Check if the error matches the expected error message
			if err != nil && err.Error() != tt.expectedError {
				t.Errorf("IsValidMimeType() error for file %s = %v, want %v", tt.filename, err.Error(), tt.expectedError)
			} else if err == nil && tt.expectedError != "" {
				t.Errorf("IsValidMimeType() error for file %s = nil, want %v", tt.filename, tt.expectedError)
			}
		})
	}
}
