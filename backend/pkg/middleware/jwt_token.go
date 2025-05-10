package middleware

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"social/pkg/utils"
	"time"
)

func GenerateJWTToken(email, userID string) (string, error) {
	secretKey, err := utils.GetEnvVal("SECRET_KEY")
	if err != nil {
		return "", err
	}
	header := map[string]string{
		"alg": "HS256",
		"typ": "JWT",
	}
	headerJSON, err := json.Marshal(header)
	if err != nil {
		return "", err
	}

	encodedHeader := base64.RawURLEncoding.EncodeToString(headerJSON)

	// Payload
	payload := map[string]interface{}{
		"sub":   userID,
		"email": email,
		"exp":   time.Now().Add(15 * time.Minute).Unix(),
		"iat":   time.Now().Unix(),
	}

	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	encodedPayload := base64.RawURLEncoding.EncodeToString(payloadJSON)

	// Signature
	signingInput := fmt.Sprintf("%s.%s", encodedHeader, encodedPayload)
	h := hmac.New(sha256.New, []byte(secretKey))
	h.Write([]byte(signingInput))
	signature := base64.RawURLEncoding.EncodeToString(h.Sum(nil))

	// Final JWT
	token := fmt.Sprintf("%s.%s.%s", encodedHeader, encodedPayload, signature)
	return token, nil
}
