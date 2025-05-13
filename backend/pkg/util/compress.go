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

const mediaPath = "backend/pkg/db/media"

// CompressJPEG reduces JPEG quality (1-100, lower = smaller size).
// Returns the path to the compressed file.
func CompressJPEG(path string, quality int) (string, error) {
	if quality < 1 || quality > 100 {
		return "", errors.New("quality must be between 1 and 100")
	}

	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()

	img, _, err := image.Decode(file)
	if err != nil {
		return "", err
	}

	// Ensure output directory exists
	if err := os.MkdirAll(mediaPath, 0o755); err != nil {
		return "", err
	}

	outPath := filepath.Join(mediaPath, "compressed_"+filepath.Base(path))
	out, err := os.Create(outPath)
	if err != nil {
		return outPath, err
	}
	defer out.Close()

	err = jpeg.Encode(out, img, &jpeg.Options{Quality: quality})
	return outPath, err
}

// CompressPNG compresses PNG with the best available compression.
// Returns the path to the compressed file.
func CompressPNG(path string) (string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()

	img, _, err := image.Decode(file)
	if err != nil {
		return "", err
	}

	// Ensure output directory exists
	if err := os.MkdirAll(mediaPath, 0o755); err != nil {
		return "", err
	}

	outPath := filepath.Join(mediaPath, "compressed_"+filepath.Base(path))
	out, err := os.Create(outPath)
	if err != nil {
		return outPath, err
	}
	defer out.Close()

	encoder := png.Encoder{CompressionLevel: png.BestCompression}
	return outPath, encoder.Encode(out, img)
}

// CompressGIF reduces color depth using a basic palette.
// Returns the path to the compressed file.
func CompressGIF(path string, useWebSafe bool) (string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()

	gifImg, err := gif.DecodeAll(file)
	if err != nil {
		return "", err
	}

	// Choose a built-in palette
	var pal color.Palette
	if useWebSafe {
		pal = palette.WebSafe
	} else {
		pal = palette.Plan9
	}

	for i, frame := range gifImg.Image {
		bounds := frame.Bounds()
		palettedImg := image.NewPaletted(bounds, pal)
		drawImage(palettedImg, frame)
		gifImg.Image[i] = palettedImg
	}

	// Ensure output directory exists
	if err := os.MkdirAll(mediaPath, 0o755); err != nil {
		return "", err
	}

	outPath := filepath.Join(mediaPath, "compressed_"+filepath.Base(path))
	out, err := os.Create(outPath)
	if err != nil {
		return outPath, err
	}
	defer out.Close()

	return outPath, gif.EncodeAll(out, gifImg)
}

// drawImage copies an image onto a paletted image
func drawImage(dst *image.Paletted, src image.Image) {
	b := src.Bounds()
	for y := b.Min.Y; y < b.Max.Y; y++ {
		for x := b.Min.X; x < b.Max.X; x++ {
			dst.Set(x, y, src.At(x, y))
		}
	}
}
