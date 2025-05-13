package util

import (
	"errors"
	"image"
	"image/color"
	"image/color/palette"
	"image/gif"
	"image/jpeg"
	"image/png"
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

// CompressPNG compresses PNG with the best available compression.
func CompressPNG(path string) error {
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

	encoder := png.Encoder{CompressionLevel: png.BestCompression}
	return encoder.Encode(out, img)
}