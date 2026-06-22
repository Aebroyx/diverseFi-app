package services

import (
	"fmt"
	"strings"

	"github.com/Aebroyx/diverseFi-api/internal/domain/models"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

type RoleImportService struct {
	db *gorm.DB
}

func NewRoleImportService(db *gorm.DB) *RoleImportService {
	return &RoleImportService{db: db}
}

// GetRolesForExport fetches all roles for export
func (s *RoleImportService) GetRolesForExport() (*models.ExportRolesResponse, error) {
	var roles []models.Role
	if err := s.db.Where("deleted_at IS NULL").Find(&roles).Error; err != nil {
		return nil, err
	}

	exportRows := make([]models.RoleExportRow, len(roles))
	for i, role := range roles {
		exportRows[i] = models.RoleExportRow{
			ID:          role.ID,
			Name:        role.Name,
			DisplayName: role.DisplayName,
			Description: role.Description,
			IsDefault:   role.IsDefault,
			IsActive:    role.IsActive,
		}
	}

	return &models.ExportRolesResponse{
		Roles: exportRows,
		Total: len(exportRows),
	}, nil
}

// GenerateRolesExcel creates an Excel file from role data
func (s *RoleImportService) GenerateRolesExcel(roles []models.RoleExportRow) (*excelize.File, error) {
	f := excelize.NewFile()

	// Create "Roles" sheet
	sheetName := "Roles"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		return nil, fmt.Errorf("failed to create sheet: %w", err)
	}
	f.SetActiveSheet(index)
	f.DeleteSheet("Sheet1")

	// Define headers
	headers := []string{"Name", "Display Name", "Description", "Is Default", "Is Active"}

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
		"A": 20, // Name
		"B": 30, // Display Name
		"C": 40, // Description
		"D": 12, // Is Default
		"E": 12, // Is Active
	}
	for col, width := range columnWidths {
		if err := f.SetColWidth(sheetName, col, col, width); err != nil {
			return nil, fmt.Errorf("failed to set column width: %w", err)
		}
	}

	// Add role data
	for i, role := range roles {
		row := i + 2
		if err := f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), role.Name); err != nil {
			return nil, fmt.Errorf("failed to set name: %w", err)
		}
		if err := f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), role.DisplayName); err != nil {
			return nil, fmt.Errorf("failed to set display name: %w", err)
		}
		if err := f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), role.Description); err != nil {
			return nil, fmt.Errorf("failed to set description: %w", err)
		}
		if err := f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), role.IsDefault); err != nil {
			return nil, fmt.Errorf("failed to set is_default: %w", err)
		}
		if err := f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), role.IsActive); err != nil {
			return nil, fmt.Errorf("failed to set is_active: %w", err)
		}
	}

	// Add data validation for boolean columns
	for _, col := range []string{"D", "E"} {
		dvRange := excelize.NewDataValidation(true)
		dvRange.Sqref = fmt.Sprintf("%s2:%s%d", col, col, len(roles)+1)
		dvRange.SetDropList([]string{"TRUE", "FALSE"})
		if err := f.AddDataValidation(sheetName, dvRange); err != nil {
			return nil, fmt.Errorf("failed to add data validation: %w", err)
		}
	}

	return f, nil
}

// GenerateRolesTemplateExcel creates an empty Excel template for role import
func (s *RoleImportService) GenerateRolesTemplateExcel() (*excelize.File, error) {
	f := excelize.NewFile()

	// Create "Roles" sheet
	sheetName := "Roles"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		return nil, fmt.Errorf("failed to create sheet: %w", err)
	}
	f.SetActiveSheet(index)
	f.DeleteSheet("Sheet1")

	// Define headers
	headers := []string{"Name", "Display Name", "Description", "Is Default", "Is Active"}
	headerComments := map[string]string{
		"A1": "Required. 2-50 characters, unique identifier for the role",
		"B1": "Required. 2-100 characters, human-readable role name",
		"C1": "Optional. Maximum 255 characters, role description",
		"D1": "Required. TRUE or FALSE - whether this is the default role for new users",
		"E1": "Required. TRUE or FALSE - whether this role is active",
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
		"A": 20, // Name
		"B": 30, // Display Name
		"C": 40, // Description
		"D": 12, // Is Default
		"E": 12, // Is Active
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

	exampleData := []string{"manager", "Manager", "Role for managers with elevated permissions", "FALSE", "TRUE"}
	for i, data := range exampleData {
		cell := fmt.Sprintf("%c2", 'A'+i)
		if err := f.SetCellValue(sheetName, cell, data); err != nil {
			return nil, fmt.Errorf("failed to set example value: %w", err)
		}
		if err := f.SetCellStyle(sheetName, cell, cell, exampleStyle); err != nil {
			return nil, fmt.Errorf("failed to set example style: %w", err)
		}
	}

	// Add data validation for boolean columns
	for _, col := range []string{"D", "E"} {
		dvRange := excelize.NewDataValidation(true)
		dvRange.Sqref = fmt.Sprintf("%s2:%s1000", col, col)
		dvRange.SetDropList([]string{"TRUE", "FALSE"})
		if err := f.AddDataValidation(sheetName, dvRange); err != nil {
			return nil, fmt.Errorf("failed to add data validation: %w", err)
		}
	}

	return f, nil
}

// ValidateRoleImport validates each row of role import data
func (s *RoleImportService) ValidateRoleImport(req *models.ValidateRoleImportRequest) (*models.ValidateRoleImportResponse, error) {
	var rowErrors []models.RowError
	validRows := 0

	// Get all existing role names for duplicate checking
	var existingRoles []models.Role
	if err := s.db.Select("name").Where("deleted_at IS NULL").Find(&existingRoles).Error; err != nil {
		return nil, err
	}

	existingNames := make(map[string]bool)
	for _, role := range existingRoles {
		existingNames[strings.ToLower(role.Name)] = true
	}

	// Track duplicates within the file
	fileNames := make(map[string]int) // name -> first row number

	for _, row := range req.Rows {
		rowHasError := false

		// Field validation: Name
		if row.Name == "" {
			rowErrors = append(rowErrors, models.RowError{
				RowNumber: row.RowNumber,
				Field:     "name",
				Message:   "Name is required",
				Value:     row.Name,
			})
			rowHasError = true
		} else if len(row.Name) < 2 || len(row.Name) > 50 {
			rowErrors = append(rowErrors, models.RowError{
				RowNumber: row.RowNumber,
				Field:     "name",
				Message:   "Name must be between 2 and 50 characters",
				Value:     row.Name,
			})
			rowHasError = true
		}

		// Field validation: Display Name
		if row.DisplayName == "" {
			rowErrors = append(rowErrors, models.RowError{
				RowNumber: row.RowNumber,
				Field:     "display_name",
				Message:   "Display name is required",
				Value:     row.DisplayName,
			})
			rowHasError = true
		} else if len(row.DisplayName) < 2 || len(row.DisplayName) > 100 {
			rowErrors = append(rowErrors, models.RowError{
				RowNumber: row.RowNumber,
				Field:     "display_name",
				Message:   "Display name must be between 2 and 100 characters",
				Value:     row.DisplayName,
			})
			rowHasError = true
		}

		// Field validation: Description
		if len(row.Description) > 255 {
			rowErrors = append(rowErrors, models.RowError{
				RowNumber: row.RowNumber,
				Field:     "description",
				Message:   "Description must be at most 255 characters",
				Value:     row.Description,
			})
			rowHasError = true
		}

		// Check for duplicates within the file
		nameLower := strings.ToLower(row.Name)
		if firstRow, exists := fileNames[nameLower]; exists {
			rowErrors = append(rowErrors, models.RowError{
				RowNumber: row.RowNumber,
				Field:     "name",
				Message:   fmt.Sprintf("Duplicate role name in file (same as row %d)", firstRow),
				Value:     row.Name,
			})
			rowHasError = true
		} else {
			fileNames[nameLower] = row.RowNumber
		}

		if !rowHasError {
			validRows++
		}
	}

	return &models.ValidateRoleImportResponse{
		IsValid:    len(rowErrors) == 0,
		TotalRows:  len(req.Rows),
		ValidRows:  validRows,
		ErrorCount: len(rowErrors),
		Errors:     rowErrors,
	}, nil
}

// BulkRoleImport executes the bulk import of roles
func (s *RoleImportService) BulkRoleImport(req *models.BulkRoleImportRequest) (*models.BulkRoleImportResponse, error) {
	response := &models.BulkRoleImportResponse{
		TotalRows: len(req.Rows),
		Results:   make([]models.ImportRowResult, 0, len(req.Rows)),
	}

	// Process each row in a transaction
	err := s.db.Transaction(func(tx *gorm.DB) error {
		for _, row := range req.Rows {
			result := models.ImportRowResult{
				RowNumber: row.RowNumber,
				Username:  row.Name, // Reusing Username field for role name
			}

			// Check if role exists
			var existingRole models.Role
			err := tx.Where("name = ? AND deleted_at IS NULL", row.Name).First(&existingRole).Error

			if err != nil && err != gorm.ErrRecordNotFound {
				result.Status = "error"
				result.Message = "Database error"
				response.Results = append(response.Results, result)
				response.Failed++
				continue
			}

			roleExists := err == nil

			if roleExists {
				if req.UpdateMode == "skip" {
					result.Status = "skipped"
					result.Message = "Role already exists"
					response.Results = append(response.Results, result)
					response.Skipped++
					continue
				}

				// Update existing role
				existingRole.DisplayName = row.DisplayName
				existingRole.Description = row.Description
				existingRole.IsDefault = row.IsDefault
				existingRole.IsActive = row.IsActive

				if err := tx.Save(&existingRole).Error; err != nil {
					result.Status = "error"
					result.Message = "Failed to update role"
					response.Results = append(response.Results, result)
					response.Failed++
					continue
				}

				result.Status = "updated"
				result.Message = "Role updated successfully"
				response.Results = append(response.Results, result)
				response.Updated++
			} else {
				// Create new role
				newRole := models.Role{
					Name:        row.Name,
					DisplayName: row.DisplayName,
					Description: row.Description,
					IsDefault:   row.IsDefault,
					IsActive:    row.IsActive,
				}

				if err := tx.Create(&newRole).Error; err != nil {
					result.Status = "error"
					if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
						result.Message = "Role name already exists"
					} else {
						result.Message = "Failed to create role"
					}
					response.Results = append(response.Results, result)
					response.Failed++
					continue
				}

				result.Status = "created"
				result.Message = "Role created successfully"
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
