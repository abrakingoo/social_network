package middleware

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"social/pkg/util"
	"strings"
	"time"
)

func GenerateJWTToken(email, userID string) (string, error) {
	secretKey, err := util.GetEnvVal("SECRET_KEY")
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
	payload := map[string]any{
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

func ValidateJWTToken(jwtToken string) (map[string]interface{}, error) {
	secretKey, err := util.GetEnvVal("SECRET_KEY")
	if err != nil {
		return nil, err
	}
	parts := strings.Split(jwtToken, ".")
	if len(parts) != 3 {
		return nil, errors.New("invalid token format")
	}

	// Decode Header
	decodedHeader, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return nil, errors.New("invalid header encoding")
	}

	var header map[string]string
	if err := json.Unmarshal(decodedHeader, &header); err != nil {
		return nil, errors.New("invalid header JSON")
	}

	// Decode Payload
	decodedPayload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, errors.New("invalid payload encoding")
	}

	var payload map[string]any
	if err := json.Unmarshal(decodedPayload, &payload); err != nil {
		return nil, errors.New("invalid payload JSON")
	}

	// Check Expiry
	if exp, ok := payload["exp"].(float64); ok {
		if time.Now().Unix() > int64(exp) {
			return nil, errors.New("token has expired")
		}
	} else {
		return nil, errors.New("no expiry in token")
	}

	// Verify Signature
	signingInput := fmt.Sprintf("%s.%s", parts[0], parts[1])
	h := hmac.New(sha256.New, []byte(secretKey))
	h.Write([]byte(signingInput))
	expectedSignature := base64.RawURLEncoding.EncodeToString(h.Sum(nil))

	if parts[2] != expectedSignature {
		return nil, errors.New("invalid signature")
	}

	return payload, nil
}
