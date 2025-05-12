package util

import "github.com/gofrs/uuid"

func UUIDGen() string {
	u2, _ := uuid.NewV4()
	return u2.String()
}
