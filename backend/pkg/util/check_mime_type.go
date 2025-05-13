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
	"image/jpeg": true,
	"image/png":  true,
	"video/mp4":  true,
}

// IsValidMimeType checks whether the MIME type of the given file is among the allowed types.
// It reads the first 512 bytes from the file to determine the MIME type using http.DetectContentType.
// This function is commonly used during file upload validation to reject unsupported or potentially dangerous files.
func IsValidMimeType(file io.Reader) (bool, error) {
	// maxMIMEHeaderSize defines the number of bytes to read from the file.
	// 512 bytes is the standard size used by http.DetectContentType to determine a file's MIME type.
	const maxMIMEHeaderSize = 512

	// Create a byte slice to hold the header bytes from the file.
	// We use make() to allocate 512 bytes.
	buf := make([]byte, maxMIMEHeaderSize)

	// Read up to 512 bytes from the file into the buffer.
	// io.ReadFull tries to fill the entire buffer; if fewer than 512 bytes are available,
	// it will return io.ErrUnexpectedEOF, which we allow since it's expected for small files.
	n, err := io.ReadFull(file, buf)
	if err != nil && err != io.ErrUnexpectedEOF {
		// Any error other than io.ErrUnexpectedEOF indicates a real read failure (e.g. broken stream).
		return false, err
	}

	// If no bytes were read at all, the file is either empty or unreadable.
	if n < 1 {
		return false, errors.New("file is empty or too small to detect MIME type")
	}

	// Use http.DetectContentType to infer the file's MIME type based on the first n bytes.
	// This function does not rely on file extensions and is safer for validation.
	mimeType := http.DetectContentType(buf[:n])

	// Clean up the MIME string using mime.ParseMediaType to remove parameters (like charset).
	// We don't use the returned params here, just the clean MIME type string.
	mimeType, _, _ = mime.ParseMediaType(mimeType)

	// Check if the detected MIME type is in our allowlist.
	if !allowedMIMETypes[mimeType] {
		return false, errors.New("unsupported MIME type: " + mimeType)
	}

	// If all checks pass, return true indicating a valid and allowed MIME type.
	return true, nil
}
