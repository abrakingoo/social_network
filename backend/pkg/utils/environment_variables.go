package utils

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func GetEnvVal(s string) (string, error) {
	currentDir, err := os.Getwd()
	if err != nil {
		return "nil", err
	}

	environment_file := filepath.Join(currentDir, ".env")
	file, err := os.Open(environment_file)
	if err != nil {
		return "", err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "#") || strings.TrimSpace(line) == "" {
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			return "", fmt.Errorf("invalid line: %s", line)
		}

		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])
		if key == s {
			return value, nil
		}
	}
	return "", fmt.Errorf("environment variable with that value is not yet set.")
}
