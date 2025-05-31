package model

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"social/pkg/util"
)

const maxFormSize = 32 << 20 // 32MB

// ValidateUserDetails validates user details during registration
func ValidateUserDetails(w http.ResponseWriter, r *http.Request, user *User) (int, map[string][]string, error) {
	formErrors := map[string][]string{}
	var avatarPath string

	if err := r.ParseMultipartForm(maxFormSize); err != nil {
		formErrors["form"] = []string{"Failed to parse form data."}
		return http.StatusBadRequest, formErrors, err
	}

	// Form values
	firstName := strings.TrimSpace(r.FormValue("first_name"))
	lastName := strings.TrimSpace(r.FormValue("last_name"))
	email := strings.TrimSpace(r.FormValue("email"))
	password := strings.TrimSpace(r.FormValue("password"))
	confirmPassword := strings.TrimSpace(r.FormValue("confirmed_password"))
	dobStr := strings.TrimSpace(r.FormValue("date_of_birth"))
	nickname := strings.TrimSpace(r.FormValue("nickname"))
	aboutMe := strings.TrimSpace(r.FormValue("about"))
	avatar := r.MultipartForm.File["avatar"]

	// Validate DOB
	dob, err := time.Parse("02/01/2006", dobStr)
	if err != nil && dobStr != "" {
		formErrors["date_of_birth"] = append(formErrors["date_of_birth"], "Invalid date format. Use DD/MM/YYYY.")
	} else if time.Since(dob).Hours() < 13*365.25*24 && dobStr != "" {
		formErrors["date_of_birth"] = append(formErrors["date_of_birth"], "Must be 13+ years.")
	}

	// Validate fields
	if firstName == "" {
		formErrors["first_name"] = append(formErrors["first_name"], "First name is required.")
	}
	if lastName == "" {
		formErrors["last_name"] = append(formErrors["last_name"], "Last name is required.")
	}
	if email == "" {
		formErrors["email"] = append(formErrors["email"], "Email address is required.")
	} else if !util.ValidateEmail(email) {
		formErrors["email"] = append(formErrors["email"], "Invalid email address.")
	}
	if nickname != "" {
		if err := util.ValidateNickname(nickname); err != nil {
			formErrors["nickname"] = append(formErrors["nickname"], err.Error())
		}
	}
	if password == "" {
		formErrors["password"] = append(formErrors["password"], "Password is required.")
	} else if len(password) < 8 {
		formErrors["password"] = append(formErrors["password"], "Password must be at least 8 characters.")
	} else if confirmPassword == "" {
		formErrors["confirmed_password"] = append(formErrors["confirmed_password"], "Confirm password is required.")
	} else if password != confirmPassword {
		formErrors["password"] = append(formErrors["password"], "Passwords do not match.")
	}

	if len(avatar) > 1 {
		formErrors["media"] = append(formErrors["media"], "Exactly one avatar image is required.")
	}

	// Handle avatar
	if len(formErrors) == 0 {
		// Check for avatar URL first
		avatarURL := strings.TrimSpace(r.FormValue("avatar_url"))
		if avatarURL != "" {
			avatarPath = avatarURL
		} else if len(avatar) == 1 {
			fileHeader := avatar[0]

			file, err := fileHeader.Open()
			if err != nil {
				formErrors["media"] = append(formErrors["media"], "Failed to open avatar file.")
				return http.StatusNotAcceptable, formErrors, fmt.Errorf("form errors")
			}
			defer file.Close()

			tempfile := filepath.Join("/tmp", fileHeader.Filename)
			out, err := os.Create(tempfile)
			if err != nil {
				formErrors["media"] = append(formErrors["media"], "Failed to save avatar file.")
				return http.StatusNotAcceptable, formErrors, fmt.Errorf("form errors")
			}
			defer out.Close()

			if _, err := io.Copy(out, file); err != nil {
				formErrors["media"] = append(formErrors["media"], "Failed to write avatar file.")
				return http.StatusNotAcceptable, formErrors, fmt.Errorf("form errors")
			}

			f, err := os.Open(tempfile)
			if err != nil {
				formErrors["media"] = append(formErrors["media"], "Failed to re-open temp file.")
				return http.StatusNotAcceptable, formErrors, fmt.Errorf("form errors")
			}
			defer f.Close()

			mimetype, err := util.IsValidMimeType(f)
			if err != nil {
				formErrors["media"] = append(formErrors["media"], "Not a valid image MIME type.")
				return http.StatusNotAcceptable, formErrors, fmt.Errorf("form errors")
			}

			switch mimetype {
			case "image/jpeg":
				avatarPath, err = util.CompressJPEG(tempfile, 70)
			case "image/png":
				avatarPath, err = util.CompressPNG(tempfile)
			case "image/gif":
				avatarPath, err = util.CompressGIF(tempfile, true)
			default:
				formErrors["media"] = append(formErrors["media"], "Unsupported image format.")
				return http.StatusNotAcceptable, formErrors, fmt.Errorf("form errors")
			}

			if err != nil {
				formErrors["media"] = append(formErrors["media"], "Failed to compress avatar.")
			}
		}
	}

	// Return errors if any
	if len(formErrors) > 0 {
		return http.StatusNotAcceptable, formErrors, fmt.Errorf("form errors")
	}

	// Populate user
	user.FirstName = firstName
	user.LastName = lastName
	user.Email = email
	user.Password = password
	user.DateOfBirth = dob
	user.Nickname = nickname
	user.AboutMe = aboutMe
	user.Avatar = avatarPath

	return http.StatusOK, nil, nil
}
