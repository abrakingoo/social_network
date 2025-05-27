// Author: Aaron Ochieng
// Created: 10 May 2025 9:48pm EAT
// Description: ValidateUserDetails is a mehtods which validates user datails upon user registration
// 				It returns an error, status code and map of form errors
// 				It will be used in conjustion with JSONResponse function to jsonify responses
//
// 				i.e
// 				....
// 					jsonResponse, err := json.Marshal(form_errors)
// 					if err != nil {
// 					JSONResponse(w, r, http.StatusInternalServerError, "Failed to generate json response")
// 						return
// 					}
// 					w.WriteHeader(http.StatusNotAcceptable)
// 					w.Write(jsonResponse)
// 				....
//

package model

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"social/pkg/util"
)

func ValidateUserDetails(w http.ResponseWriter, r *http.Request, user *User) (int, map[string][]string, error) {
	form_errors := map[string][]string{}
	first_name := strings.TrimSpace(r.FormValue("first_name"))
	last_name := strings.TrimSpace(r.FormValue("last_name"))
	email_address := strings.TrimSpace(r.FormValue("email"))
	password := strings.TrimSpace(r.FormValue("password"))
	confirm_password := strings.TrimSpace(r.FormValue("confirmed_password"))
	date_of_birth := strings.TrimSpace(r.FormValue("date_of_birth"))
	nickname := strings.TrimSpace(r.FormValue("nickname"))

	year_of_birth, err := strconv.Atoi(date_of_birth)
	if err != nil {
		form_errors["year_of_birth"] = append(form_errors["year_of_birth"], "Invalid year of birth")
	}

	// firstName validation
	if first_name == "" {
		form_errors["first_name"] = append(form_errors["first_name"], "firstname is required")
	}

	// LastName validation
	if last_name == "" {
		form_errors["last_name"] = append(form_errors["last_name"], "laststname is required")
	}

	// email address validation
	if email_address == "" {
		form_errors["email"] = append(form_errors["email"], "email address is required")
	} else if !util.ValidateEmail(email_address) {
		form_errors["email"] = append(form_errors["email"], "invalid email address")
	}

	// nickname validation
	if nickname != "" {
		if err := util.ValidateNickname(user.Nickname); err != nil {
			form_errors["nickname"] = append(form_errors["nickname"], err.Error())
		}
	}

	// Year of birth validation to ensure the user is 18+ years old
	current_year := time.Now().Year()
	if current_year-year_of_birth < 18 {
		form_errors["date_of_birth"] = append(form_errors["date_of_birth"], "Must be 18+ years")
	}

	// TODO password validation here
	if password == "" {
		form_errors["password"] = append(form_errors["password"], "Password is required")
	} else if confirm_password == "" {
		form_errors["confirmed_password"] = append(form_errors["confirmed_password"], "Confirm Password is required")
	} else if password != confirm_password {
		form_errors["password"] = append(form_errors["password"], "Passwords do not match")
	}

	if len(form_errors) != 0 {
		return http.StatusNotAcceptable, form_errors, fmt.Errorf("form errors")
	}

	return http.StatusOK, nil, nil
}
