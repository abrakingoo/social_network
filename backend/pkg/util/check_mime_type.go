package util

import (
	"errors"
	"io"
	"mime"
	"net/http"
)

// allowedMIMETypes defines the set of MIME types we consider safe and acceptable.
// Only files with one of these types will be allowed to proceed.
var allowedMIMETypes = map[string]bool{
	"image/jpeg":      true,
	"image/png":       true,
	"image/gif":       true,
	"video/mp4":       true,
	"video/quicktime": true,
}

// IsValidMimeType checks whether the MIME type of the given file is among the allowed types.
// It reads the first 512 bytes from the file to determine the MIME type using http.DetectContentType.
// This function is commonly used during file upload validation to reject unsupported or potentially dangerous files.
func IsValidMimeType(file io.Reader) (string, error) {
	const maxMIMEHeaderSize = 512
	buf := make([]byte, maxMIMEHeaderSize)
	n, err := io.ReadFull(file, buf)
	if err != nil && err != io.ErrUnexpectedEOF {
		return "", errors.New("file is empty or too small to detect MIME type")
	}
	mimeType := http.DetectContentType(buf[:n])
	mimeType, _, _ = mime.ParseMediaType(mimeType)

	if !allowedMIMETypes[mimeType] {
		return "", errors.New("unsupported MIME type: " + mimeType)
	}
	return string(mimeType), nil
}
