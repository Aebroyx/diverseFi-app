package services

import (
	"errors"
	"fmt"
	"regexp"
	"strings"

	"github.com/Aebroyx/diverseFi-api/internal/domain/models"
	"github.com/xuri/excelize/v2"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserImportService struct {
	db *gorm.DB
}

func NewUserImportService(db *gorm.DB) *UserImportService {
	return &UserImportService{db: db}
}

// GetUsersForExport fetches all users with role names for export
func (s *UserImportService) GetUsersForExport() (*models.ExportUsersResponse, error) {
	var users []models.Users
	if err := s.db.Preload("Role").Where("is_deleted = ?", false).Find(&users).Error; err != nil {
		return nil, err
	}

	exportRows := make([]models.UserExportRow, len(users))
	for i, user := range users {
		exportRows[i] = models.UserExportRow{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
			Name:     user.Name,
			RoleName: user.Role.Name,
			IsActive: user.IsActive,
		}
	}

	return &models.ExportUsersResponse{
		Users: exportRows,
		Total: len(exportRows),
	}, nil
}

// ValidateImport validates each row of import data
func (s *UserImportService) ValidateImport(req *models.ValidateImportRequest) (*models.ValidateImportResponse, error) {
	var rowErrors []models.RowError
	validRows := 0

	// Get all existing usernames and emails for duplicate checking
	var existingUsers []models.Users
	if err := s.db.Select("username", "email").Where("is_deleted = ?", false).Find(&existingUsers).Error; err != nil {
		return nil, err
	}

	existingUsernames := make(map[string]bool)
	existingEmails := make(map[string]bool)
	for _, user := range existingUsers {
		existingUsernames[strings.ToLower(user.Username)] = true
		existingEmails[strings.ToLower(user.Email)] = true
	}

	// Get all valid role names
	var roles []models.Role
	if err := s.db.Select("name").Where("is_active = ?", true).Find(&roles).Error; err != nil {
		return nil, err
	}

	validRoles := make(map[string]bool)
	for _, role := range roles {
		validRoles[strings.ToLower(role.Name)] = true
	}

	// Track duplicates within the file
	fileUsernames := make(map[string]int) // username -> first row number
	fileEmails := make(map[string]int)    // email -> first row number

	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

	for _, row := range req.Rows {
		rowHasError := false

		// Field validation: Username
		if row.Username == "" {
			rowErrors = append(rowErrors, models.RowError{
				RowNumber: row.RowNumber,
				Field:     "username",
				Message:   "Username is required",
				Value:     row.Username,
			})
			rowHasError = true
		} else if len(row.Username) < 3 || len(row.Username) > 50 {
			rowErrors = append(rowErrors, models.RowError{
				RowNumber: row.RowNumber,
				Field:     "username",
				Message:   "Username must be between 3 and 50 characters",
				Value:     row.Username,
			})
			rowHasError = true
		}

		// Field validation: Email
		if row.Email == "" {
			rowErrors = append(rowErrors, models.RowError{
				RowNumber: row.RowNumber,
				Field:     "email",
				Message:   "Email is required",
				Value:     row.Email,
			})
			rowHasError = true
		} else if !emailRegex.MatchString(row.Email) {
			rowErrors = append(rowErrors, models.RowError{
				RowNumber: row.RowNumber,
				Field:     "email",
				Message:   "Invalid email format",
				Value:     row.Email,
			})
			rowHasError = true
		}

		// Field validation: Password (required for new users)
		usernameExists := existingUsernames[strings.ToLower(row.Username)]
		if !usernameExists && row.Password == "" {
			rowErrors = append(rowErrors, models.RowError{
				RowNumber: row.RowNumber,
				Field:     "password",
				Message:   "Password is required for new users",
				Value:     "",
			})
			rowHasError = true
		} else if row.Password != "" && len(row.Password) < 6 {
			rowErrors = append(rowErrors, models.RowError{
				RowNumber: row.RowNumber,
				Field:     "password",
				Message:   "Password must be at least 6 characters",
				Value:     "[hidden]",
			})
			rowHasError = true
		}

		// Field validation: Name
		if row.Name == "" {
			rowErrors = append(rowErrors, models.RowError{
				RowNumber: row.RowNumber,
				Field:     "name",
				Message:   "Name is required",
				Value:     row.Name,
			})
			rowHasError = true
		} else if len(row.Name) > 100 {
			rowErrors = append(rowErrors, models.RowError{
				RowNumber: row.RowNumber,
				Field:     "name",
				Message:   "Name must be at most 100 characters",
				Value:     row.Name,
			})
			rowHasError = true
		}

		// Field validation: Role name
		if row.RoleName == "" {
			rowErrors = append(rowErrors, models.RowError{
				RowNumber: row.RowNumber,
				Field:     "role_name",
				Message:   "Role name is required",
				Value:     row.RoleName,
			})
			rowHasError = true
		} else if !validRoles[strings.ToLower(row.RoleName)] {
			rowErrors = append(rowErrors, models.RowError{
				RowNumber: row.RowNumber,
				Field:     "role_name",
				Message:   fmt.Sprintf("Role '%s' does not exist", row.RoleName),
				Value:     row.RoleName,
			})
			rowHasError = true
		}

		// Check for duplicates within the file
		usernameLower := strings.ToLower(row.Username)
		emailLower := strings.ToLower(row.Email)

		if firstRow, exists := fileUsernames[usernameLower]; exists {
			rowErrors = append(rowErrors, models.RowError{
				RowNumber: row.RowNumber,
				Field:     "username",
				Message:   fmt.Sprintf("Duplicate username in file (same as row %d)", firstRow),
				Value:     row.Username,
			})
			rowHasError = true
		} else {
			fileUsernames[usernameLower] = row.RowNumber
		}

		if firstRow, exists := fileEmails[emailLower]; exists {
			rowErrors = append(rowErrors, models.RowError{
				RowNumber: row.RowNumber,
				Field:     "email",
				Message:   fmt.Sprintf("Duplicate email in file (same as row %d)", firstRow),
				Value:     row.Email,
			})
			rowHasError = true
		} else {
			fileEmails[emailLower] = row.RowNumber
		}

		// Note: We don't flag database duplicates as errors here since they can be handled by update_mode

		if !rowHasError {
			validRows++
		}
	}

	return &models.ValidateImportResponse{
		IsValid:    len(rowErrors) == 0,
		TotalRows:  len(req.Rows),
		ValidRows:  validRows,
		ErrorCount: len(rowErrors),
		Errors:     rowErrors,
	}, nil
}

// BulkImport executes the bulk import of users
func (s *UserImportService) BulkImport(req *models.BulkImportRequest) (*models.BulkImportResponse, error) {
	response := &models.BulkImportResponse{
		TotalRows: len(req.Rows),
		Results:   make([]models.ImportRowResult, 0, len(req.Rows)),
	}

	// Get role name to ID mapping
	var roles []models.Role
	if err := s.db.Where("is_active = ?", true).Find(&roles).Error; err != nil {
		return nil, err
	}

	roleNameToID := make(map[string]uint)
	for _, role := range roles {
		roleNameToID[strings.ToLower(role.Name)] = role.ID
	}

	// Process each row in a transaction
	err := s.db.Transaction(func(tx *gorm.DB) error {
		for _, row := range req.Rows {
			result := models.ImportRowResult{
				RowNumber: row.RowNumber,
				Username:  row.Username,
			}

			// Get role ID
			roleID, exists := roleNameToID[strings.ToLower(row.RoleName)]
			if !exists {
				result.Status = "error"
				result.Message = fmt.Sprintf("Role '%s' not found", row.RoleName)
				response.Results = append(response.Results, result)
				response.Failed++
				continue
			}

			// Check if user exists
			var existingUser models.Users
			err := tx.Where("username = ? AND is_deleted = ?", row.Username, false).First(&existingUser).Error

			if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
				result.Status = "error"
				result.Message = "Database error"
				response.Results = append(response.Results, result)
				response.Failed++
				continue
			}

			userExists := err == nil

			if userExists {
				if req.UpdateMode == "skip" {
					result.Status = "skipped"
					result.Message = "User already exists"
					response.Results = append(response.Results, result)
					response.Skipped++
					continue
				}

				// Update existing user
				existingUser.Email = row.Email
				existingUser.Name = row.Name
				existingUser.RoleID = roleID
				existingUser.IsActive = row.IsActive

				// Only update password if provided
				if row.Password != "" {
					hashedPassword, err := bcrypt.GenerateFromPassword([]byte(row.Password), bcrypt.DefaultCost)
					if err != nil {
						result.Status = "error"
						result.Message = "Failed to hash password"
						response.Results = append(response.Results, result)
						response.Failed++
						continue
					}
					existingUser.Password = string(hashedPassword)
				}

				if err := tx.Save(&existingUser).Error; err != nil {
					result.Status = "error"
					result.Message = "Failed to update user"
					response.Results = append(response.Results, result)
					response.Failed++
					continue
				}

				result.Status = "updated"
				result.Message = "User updated successfully"
				response.Results = append(response.Results, result)
				response.Updated++
			} else {
				// Create new user
				hashedPassword, err := bcrypt.GenerateFromPassword([]byte(row.Password), bcrypt.DefaultCost)
				if err != nil {
					result.Status = "error"
					result.Message = "Failed to hash password"
					response.Results = append(response.Results, result)
					response.Failed++
					continue
				}

				newUser := models.Users{
					Username: row.Username,
					Email:    row.Email,
					Password: string(hashedPassword),
					Name:     row.Name,
					RoleID:   roleID,
					IsActive: row.IsActive,
				}

				if err := tx.Create(&newUser).Error; err != nil {
					result.Status = "error"
					if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
						result.Message = "Username or email already exists"
					} else {
						result.Message = "Failed to create user"
					}
					response.Results = append(response.Results, result)
					response.Failed++
					continue
				}

				result.Status = "created"
				result.Message = "User created successfully"
				response.Results = append(response.Results, result)
				response.Created++
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return response, nil
}

// GenerateUsersExcel creates an Excel file from user data
func (s *UserImportService) GenerateUsersExcel(users []models.UserExportRow) (*excelize.File, error) {
	f := excelize.NewFile()

	// Create "Users" sheet
	sheetName := "Users"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		return nil, fmt.Errorf("failed to create sheet: %w", err)
	}
	f.SetActiveSheet(index)
	f.DeleteSheet("Sheet1") // Remove default sheet

	// Define headers
	headers := []string{"Username", "Email", "Password", "Name", "Role", "Active"}

	// Style header row
	headerStyle, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Bold:  true,
			Color: "FFFFFF",
		},
		Fill: excelize.Fill{
			Type:    "pattern",
			Color:   []string{"4F46E5"},
			Pattern: 1,
		},
		Alignment: &excelize.Alignment{
			Horizontal: "center",
			Vertical:   "center",
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create header style: %w", err)
	}

	// Set headers
	for i, header := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		if err := f.SetCellValue(sheetName, cell, header); err != nil {
			return nil, fmt.Errorf("failed to set header value: %w", err)
		}
		if err := f.SetCellStyle(sheetName, cell, cell, headerStyle); err != nil {
			return nil, fmt.Errorf("failed to set header style: %w", err)
		}
	}

	// Set column widths
	columnWidths := map[string]float64{
		"A": 20, // Username
		"B": 30, // Email
		"C": 15, // Password
		"D": 25, // Name
		"E": 15, // Role
		"F": 10, // Active
	}
	for col, width := range columnWidths {
		if err := f.SetColWidth(sheetName, col, col, width); err != nil {
			return nil, fmt.Errorf("failed to set column width: %w", err)
		}
	}

	// Add user data
	for i, user := range users {
		row := i + 2
		if err := f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), user.Username); err != nil {
			return nil, fmt.Errorf("failed to set username: %w", err)
		}
		if err := f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), user.Email); err != nil {
			return nil, fmt.Errorf("failed to set email: %w", err)
		}
		if err := f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), ""); err != nil {
			return nil, fmt.Errorf("failed to set password: %w", err)
		}
		if err := f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), user.Name); err != nil {
			return nil, fmt.Errorf("failed to set name: %w", err)
		}
		if err := f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), user.RoleName); err != nil {
			return nil, fmt.Errorf("failed to set role: %w", err)
		}
		if err := f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), user.IsActive); err != nil {
			return nil, fmt.Errorf("failed to set active status: %w", err)
		}
	}

	// Add data validation for Active column
	dvRange := excelize.NewDataValidation(true)
	dvRange.Sqref = fmt.Sprintf("F2:F%d", len(users)+1)
	dvRange.SetDropList([]string{"TRUE", "FALSE"})
	if err := f.AddDataValidation(sheetName, dvRange); err != nil {
		return nil, fmt.Errorf("failed to add data validation: %w", err)
	}

	return f, nil
}

// GenerateTemplateExcel creates an empty Excel template for user import
func (s *UserImportService) GenerateTemplateExcel() (*excelize.File, error) {
	f := excelize.NewFile()

	// Create "Users" sheet
	sheetName := "Users"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		return nil, fmt.Errorf("failed to create sheet: %w", err)
	}
	f.SetActiveSheet(index)
	f.DeleteSheet("Sheet1") // Remove default sheet

	// Define headers
	headers := []string{"Username", "Email", "Password", "Name", "Role", "Active"}
	headerComments := map[string]string{
		"A1": "Required. 3-50 characters, must be unique",
		"B1": "Required. Valid email format, must be unique",
		"C1": "Required for new users. Minimum 6 characters. Leave empty for existing users to keep password",
		"D1": "Required. Maximum 100 characters",
		"E1": "Required. Must match an existing role name (e.g., admin, user)",
		"F1": "Required. TRUE or FALSE",
	}

	// Style header row
	headerStyle, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Bold:  true,
			Color: "FFFFFF",
		},
		Fill: excelize.Fill{
			Type:    "pattern",
			Color:   []string{"4F46E5"},
			Pattern: 1,
		},
		Alignment: &excelize.Alignment{
			Horizontal: "center",
			Vertical:   "center",
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create header style: %w", err)
	}

	// Set headers with comments
	for i, header := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		if err := f.SetCellValue(sheetName, cell, header); err != nil {
			return nil, fmt.Errorf("failed to set header value: %w", err)
		}
		if err := f.SetCellStyle(sheetName, cell, cell, headerStyle); err != nil {
			return nil, fmt.Errorf("failed to set header style: %w", err)
		}

		// Add comment
		if comment, exists := headerComments[cell]; exists {
			if err := f.AddComment(sheetName, excelize.Comment{
				Cell:   cell,
				Author: "System",
				Paragraph: []excelize.RichTextRun{
					{Text: comment},
				},
			}); err != nil {
				return nil, fmt.Errorf("failed to add comment: %w", err)
			}
		}
	}

	// Set column widths
	columnWidths := map[string]float64{
		"A": 20, // Username
		"B": 30, // Email
		"C": 15, // Password
		"D": 25, // Name
		"E": 15, // Role
		"F": 10, // Active
	}
	for col, width := range columnWidths {
		if err := f.SetColWidth(sheetName, col, col, width); err != nil {
			return nil, fmt.Errorf("failed to set column width: %w", err)
		}
	}

	// Add example row
	exampleStyle, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Italic: true,
			Color:  "666666",
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create example style: %w", err)
	}

	exampleData := []string{"john.doe", "john.doe@example.com", "password123", "John Doe", "user", "TRUE"}
	for i, data := range exampleData {
		cell := fmt.Sprintf("%c2", 'A'+i)
		if err := f.SetCellValue(sheetName, cell, data); err != nil {
			return nil, fmt.Errorf("failed to set example value: %w", err)
		}
		if err := f.SetCellStyle(sheetName, cell, cell, exampleStyle); err != nil {
			return nil, fmt.Errorf("failed to set example style: %w", err)
		}
	}

	// Add data validation for Active column (for future rows)
	dvRange := excelize.NewDataValidation(true)
	dvRange.Sqref = "F2:F1000" // Apply to many rows
	dvRange.SetDropList([]string{"TRUE", "FALSE"})
	if err := f.AddDataValidation(sheetName, dvRange); err != nil {
		return nil, fmt.Errorf("failed to add data validation: %w", err)
	}

	return f, nil
}
