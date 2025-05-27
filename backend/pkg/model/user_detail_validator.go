package model

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"social/pkg/util"
)

// ValidateUserDetails validates user details during registration
func ValidateUserDetails(w http.ResponseWriter, r *http.Request, user *User) (int, map[string][]string, error) {
	form_errors := map[string][]string{}
	path := ""
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		form_errors["form"] = []string{"Failed to parse form data"}
	}
	first_name := strings.TrimSpace(r.FormValue("first_name"))
	last_name := strings.TrimSpace(r.FormValue("last_name"))
	email_address := strings.TrimSpace(r.FormValue("email"))
	password := strings.TrimSpace(r.FormValue("password"))
	confirm_password := strings.TrimSpace(r.FormValue("confirmed_password"))
	date_of_birth := strings.TrimSpace(r.FormValue("date_of_birth"))
	nickname := strings.TrimSpace(r.FormValue("nickname"))
	about_me := strings.TrimSpace(r.FormValue("about"))
	avatar := r.MultipartForm.File["media"]

	dob, err := time.Parse("02/01/2006", date_of_birth)
	if err != nil && date_of_birth != "" {
		fmt.Println(err)
		form_errors["date_of_birth"] = append(form_errors["date_of_birth"], "Invalid date format. Use DD/MM/YYYY")
	} else if time.Since(dob).Hours() < 13*365.25*24 && date_of_birth != "" {
		form_errors["date_of_birth"] = append(form_errors["date_of_birth"], "Must be 13+ years")
	}

	if first_name == "" {
		form_errors["first_name"] = append(form_errors["first_name"], "firstname is required")
	}

	if last_name == "" {
		form_errors["last_name"] = append(form_errors["last_name"], "laststname is required")
	}

	if email_address == "" {
		form_errors["email"] = append(form_errors["email"], "email address is required")
	} else if !util.ValidateEmail(email_address) {
		form_errors["email"] = append(form_errors["email"], "invalid email address")
	}

	if nickname != "" {
		if err := util.ValidateNickname(nickname); err != nil {
			form_errors["nickname"] = append(form_errors["nickname"], err.Error())
		}
	}

	if password == "" {
		form_errors["password"] = append(form_errors["password"], "Password is required")
	} else if len(password) < 8 {
		form_errors["password"] = append(form_errors["password"], "Password must be at least 8 characters long")
	} else if confirm_password == "" {
		form_errors["confirmed_password"] = append(form_errors["confirmed_password"], "Confirm Password is required")
	} else if password != confirm_password {
		form_errors["password"] = append(form_errors["password"], "Passwords do not match")
	}

	if len(form_errors) != 0 {
		return http.StatusNotAcceptable, form_errors, fmt.Errorf("form errors")
	}

	if len(avatar) > 1 {
		form_errors["media"] = []string{"Exactly one avatar image is required"}
	}

	file, err := avatar[0].Open()
	if err != nil {
		form_errors["media"] = []string{"Failed to open avatar file"}
	}

	defer file.Close()

	tempfile := "/tmp/" + avatar[0].Filename
	out, err := os.Create(tempfile)
	if err != nil {
		form_errors["media"] = append(form_errors["media"], "Failed to save avatar file")
	}
	defer out.Close()

	_, err = io.Copy(out, file)
	if err != nil {
		form_errors["media"] = append(form_errors["media"], "Failed to write avatar file")
	}

	f, _ := os.Open(tempfile)
	defer f.Close()

	mimetype, err := util.IsValidMimeType(f)
	if err != nil {
		form_errors["media"] = append(form_errors["media"], "not a valid mimetype")
	}

	var errF error
	switch mimetype {
	case "image/jpeg":
		path, errF = util.CompressJPEG(tempfile, 70)
	case "image/png":
		path, errF = util.CompressPNG(tempfile)
	case "image/gif":
		path, errF = util.CompressGIF(tempfile, true)
	default:
		path = "pkg/db/media/" + avatar[0].Filename
	}

	if errF != nil {
		form_errors["media"] = append(form_errors["media"], "failed to compress file")
	}

	user.FirstName = first_name
	user.LastName = last_name
	user.Email = email_address
	user.Password = password
	user.DateOfBirth = dob
	user.Nickname = nickname
	user.AboutMe = about_me
	user.Avatar = path

	return http.StatusOK, nil, nil
}
