package util

import (
	"errors"
	"image"
	"image/jpeg"
	"os"
	"path/filepath"
)

// CompressJPEG reduces JPEG quality (1-100, lower = smaller size).
func CompressJPEG(path string, quality int) error {
	if quality < 1 || quality > 100 {
		return errors.New("quality must be between 1 and 100")
	}

	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()

	img, _, err := image.Decode(file)
	if err != nil {
		return err
	}

	out, err := os.Create("compressed_" + filepath.Base(path))
	if err != nil {
		return err
	}
	defer out.Close()

	return jpeg.Encode(out, img, &jpeg.Options{Quality: quality})
}
