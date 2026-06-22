package validators

import (
	"regexp"
	"unicode"

	"github.com/go-playground/validator/v10"
)

// PasswordValidator validates password complexity
// Requirements:
// - Minimum 8 characters
// - At least 1 capital letter
// - At least 1 number
// - At least 1 special character
func PasswordValidator(fl validator.FieldLevel) bool {
	password := fl.Field().String()

	// Minimum length check
	if len(password) < 8 {
		return false
	}

	// Check for at least one capital letter
	hasCapital := false
	for _, char := range password {
		if unicode.IsUpper(char) {
			hasCapital = true
			break
		}
	}
	if !hasCapital {
		return false
	}

	// Check for at least one number
	hasNumber := false
	for _, char := range password {
		if unicode.IsNumber(char) {
			hasNumber = true
			break
		}
	}
	if !hasNumber {
		return false
	}

	// Check for at least one special character
	specialCharPattern := regexp.MustCompile(`[!@#$%^&*(),.?":{}|<>]`)
	if !specialCharPattern.MatchString(password) {
		return false
	}

	return true
}

// RegisterCustomValidators registers all custom validators
func RegisterCustomValidators(v *validator.Validate) error {
	return v.RegisterValidation("password", PasswordValidator)
}
