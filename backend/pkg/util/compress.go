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

// CompressGIF reduces color depth using a basic palette (WebSafe or Plan9).
func CompressGIF(path string, useWebSafe bool) error {
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()

	gifImg, err := gif.DecodeAll(file)
	if err != nil {
		return err
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

	out, err := os.Create("compressed_" + filepath.Base(path))
	if err != nil {
		return err
	}
	defer out.Close()

	return gif.EncodeAll(out, gifImg)
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
