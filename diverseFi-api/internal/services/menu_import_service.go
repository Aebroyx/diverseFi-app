package services

import (
	"fmt"
	"strings"

	"github.com/Aebroyx/diverseFi-api/internal/domain/models"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

type MenuImportService struct {
	db *gorm.DB
}

func NewMenuImportService(db *gorm.DB) *MenuImportService {
	return &MenuImportService{db: db}
}

// GetMenusForExport fetches all menus for export
func (s *MenuImportService) GetMenusForExport() (*models.ExportMenusResponse, error) {
	var menus []models.Menu
	if err := s.db.Preload("Parent").Where("deleted_at IS NULL").Find(&menus).Error; err != nil {
		return nil, err
	}

	exportRows := make([]models.MenuExportRow, len(menus))
	for i, menu := range menus {
		parentName := ""
		if menu.Parent != nil {
			parentName = menu.Parent.Name
		}

		exportRows[i] = models.MenuExportRow{
			ID:         menu.ID,
			Name:       menu.Name,
			Path:       menu.Path,
			Icon:       menu.Icon,
			OrderIndex: menu.OrderIndex,
			ParentName: parentName,
			IsActive:   menu.IsActive,
		}
	}

	return &models.ExportMenusResponse{
		Menus: exportRows,
		Total: len(exportRows),
	}, nil
}

// GenerateMenusExcel creates an Excel file from menu data
func (s *MenuImportService) GenerateMenusExcel(menus []models.MenuExportRow) (*excelize.File, error) {
	f := excelize.NewFile()

	// Create "Menus" sheet
	sheetName := "Menus"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		return nil, fmt.Errorf("failed to create sheet: %w", err)
	}
	f.SetActiveSheet(index)
	f.DeleteSheet("Sheet1")

	// Define headers
	headers := []string{"Name", "Path", "Icon", "Order Index", "Parent Menu", "Is Active"}

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
		"A": 25, // Name
		"B": 30, // Path
		"C": 20, // Icon
		"D": 12, // Order Index
		"E": 25, // Parent Menu
		"F": 12, // Is Active
	}
	for col, width := range columnWidths {
		if err := f.SetColWidth(sheetName, col, col, width); err != nil {
			return nil, fmt.Errorf("failed to set column width: %w", err)
		}
	}

	// Add menu data
	for i, menu := range menus {
		row := i + 2
		if err := f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), menu.Name); err != nil {
			return nil, fmt.Errorf("failed to set name: %w", err)
		}
		if err := f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), menu.Path); err != nil {
			return nil, fmt.Errorf("failed to set path: %w", err)
		}
		if err := f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), menu.Icon); err != nil {
			return nil, fmt.Errorf("failed to set icon: %w", err)
		}
		if err := f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), menu.OrderIndex); err != nil {
			return nil, fmt.Errorf("failed to set order_index: %w", err)
		}
		if err := f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), menu.ParentName); err != nil {
			return nil, fmt.Errorf("failed to set parent_name: %w", err)
		}
		if err := f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), menu.IsActive); err != nil {
			return nil, fmt.Errorf("failed to set is_active: %w", err)
		}
	}

	// Add data validation for Is Active column
	dvRange := excelize.NewDataValidation(true)
	dvRange.Sqref = fmt.Sprintf("F2:F%d", len(menus)+1)
	dvRange.SetDropList([]string{"TRUE", "FALSE"})
	if err := f.AddDataValidation(sheetName, dvRange); err != nil {
		return nil, fmt.Errorf("failed to add data validation: %w", err)
	}

	return f, nil
}

// GenerateMenusTemplateExcel creates an empty Excel template for menu import
func (s *MenuImportService) GenerateMenusTemplateExcel() (*excelize.File, error) {
	f := excelize.NewFile()

	// Create "Menus" sheet
	sheetName := "Menus"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		return nil, fmt.Errorf("failed to create sheet: %w", err)
	}
	f.SetActiveSheet(index)
	f.DeleteSheet("Sheet1")

	// Define headers
	headers := []string{"Name", "Path", "Icon", "Order Index", "Parent Menu", "Is Active"}
	headerComments := map[string]string{
		"A1": "Required. Maximum 100 characters, menu item name",
		"B1": "Optional. Maximum 255 characters, navigation path (e.g., /dashboard)",
		"C1": "Optional. Maximum 100 characters, icon identifier",
		"D1": "Required. Integer value for menu ordering",
		"E1": "Optional. Parent menu name for hierarchical structure (leave empty for top-level menu)",
		"F1": "Required. TRUE or FALSE - whether this menu is active",
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
		"A": 25, // Name
		"B": 30, // Path
		"C": 20, // Icon
		"D": 12, // Order Index
		"E": 25, // Parent Menu
		"F": 12, // Is Active
	}
	for col, width := range columnWidths {
		if err := f.SetColWidth(sheetName, col, col, width); err != nil {
			return nil, fmt.Errorf("failed to set column width: %w", err)
		}
	}

	// Add example rows
	exampleStyle, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{
			Italic: true,
			Color:  "666666",
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create example style: %w", err)
	}

	examples := [][]interface{}{
		{"Dashboard", "/dashboard", "HomeIcon", 1, "", "TRUE"}, // Top-level menu
		{"Settings", "/settings", "CogIcon", 10, "", "TRUE"},   // Top-level menu
		{"User Settings", "/settings/users", "UserIcon", 11, "Settings", "TRUE"}, // Sub-menu
	}

	for i, example := range examples {
		row := i + 2
		for j, data := range example {
			cell := fmt.Sprintf("%c%d", 'A'+j, row)
			if err := f.SetCellValue(sheetName, cell, data); err != nil {
				return nil, fmt.Errorf("failed to set example value: %w", err)
			}
			if err := f.SetCellStyle(sheetName, cell, cell, exampleStyle); err != nil {
				return nil, fmt.Errorf("failed to set example style: %w", err)
			}
		}
	}

	// Add data validation for Is Active column
	dvRange := excelize.NewDataValidation(true)
	dvRange.Sqref = "F2:F1000"
	dvRange.SetDropList([]string{"TRUE", "FALSE"})
	if err := f.AddDataValidation(sheetName, dvRange); err != nil {
		return nil, fmt.Errorf("failed to add data validation: %w", err)
	}

	return f, nil
}

// ValidateMenuImport validates each row of menu import data
func (s *MenuImportService) ValidateMenuImport(req *models.ValidateMenuImportRequest) (*models.ValidateMenuImportResponse, error) {
	var rowErrors []models.RowError
	validRows := 0

	// Get all existing menu names for validation
	var existingMenus []models.Menu
	if err := s.db.Select("name").Where("deleted_at IS NULL").Find(&existingMenus).Error; err != nil {
		return nil, err
	}

	existingNames := make(map[string]bool)
	for _, menu := range existingMenus {
		existingNames[strings.ToLower(menu.Name)] = true
	}

	// Track all menu names in the file (for validating parent references)
	fileMenuNames := make(map[string]bool)
	for _, row := range req.Rows {
		fileMenuNames[strings.ToLower(row.Name)] = true
	}

	// Track duplicates within the file
	fileDuplicates := make(map[string]int) // name -> first row number

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
		} else if len(row.Name) > 100 {
			rowErrors = append(rowErrors, models.RowError{
				RowNumber: row.RowNumber,
				Field:     "name",
				Message:   "Name must be at most 100 characters",
				Value:     row.Name,
			})
			rowHasError = true
		}

		// Field validation: Path
		if len(row.Path) > 255 {
			rowErrors = append(rowErrors, models.RowError{
				RowNumber: row.RowNumber,
				Field:     "path",
				Message:   "Path must be at most 255 characters",
				Value:     row.Path,
			})
			rowHasError = true
		}

		// Field validation: Icon
		if len(row.Icon) > 100 {
			rowErrors = append(rowErrors, models.RowError{
				RowNumber: row.RowNumber,
				Field:     "icon",
				Message:   "Icon must be at most 100 characters",
				Value:     row.Icon,
			})
			rowHasError = true
		}

		// Validate parent menu reference (if specified)
		if row.ParentName != "" {
			parentLower := strings.ToLower(row.ParentName)
			// Check if parent exists in DB or will be created in this import
			if !existingNames[parentLower] && !fileMenuNames[parentLower] {
				rowErrors = append(rowErrors, models.RowError{
					RowNumber: row.RowNumber,
					Field:     "parent_name",
					Message:   fmt.Sprintf("Parent menu '%s' does not exist", row.ParentName),
					Value:     row.ParentName,
				})
				rowHasError = true
			}

			// Check for self-reference
			if strings.ToLower(row.Name) == parentLower {
				rowErrors = append(rowErrors, models.RowError{
					RowNumber: row.RowNumber,
					Field:     "parent_name",
					Message:   "Menu cannot be its own parent",
					Value:     row.ParentName,
				})
				rowHasError = true
			}
		}

		// Check for duplicates within the file
		nameLower := strings.ToLower(row.Name)
		if firstRow, exists := fileDuplicates[nameLower]; exists {
			rowErrors = append(rowErrors, models.RowError{
				RowNumber: row.RowNumber,
				Field:     "name",
				Message:   fmt.Sprintf("Duplicate menu name in file (same as row %d)", firstRow),
				Value:     row.Name,
			})
			rowHasError = true
		} else {
			fileDuplicates[nameLower] = row.RowNumber
		}

		if !rowHasError {
			validRows++
		}
	}

	return &models.ValidateMenuImportResponse{
		IsValid:    len(rowErrors) == 0,
		TotalRows:  len(req.Rows),
		ValidRows:  validRows,
		ErrorCount: len(rowErrors),
		Errors:     rowErrors,
	}, nil
}

// BulkMenuImport executes the bulk import of menus
func (s *MenuImportService) BulkMenuImport(req *models.BulkMenuImportRequest) (*models.BulkMenuImportResponse, error) {
	response := &models.BulkMenuImportResponse{
		TotalRows: len(req.Rows),
		Results:   make([]models.ImportRowResult, 0, len(req.Rows)),
	}

	// Process each row in a transaction
	err := s.db.Transaction(func(tx *gorm.DB) error {
		// First pass: Create/update all menus without parent relationships
		// Second pass: Update parent relationships

		// Build a map of menu names to their import data
		menuMap := make(map[string]*models.MenuImportRow)
		for i := range req.Rows {
			menuMap[strings.ToLower(req.Rows[i].Name)] = &req.Rows[i]
		}

		// Get all existing menus for reference
		var existingMenus []models.Menu
		if err := tx.Where("deleted_at IS NULL").Find(&existingMenus).Error; err != nil {
			return err
		}

		existingMenuMap := make(map[string]*models.Menu)
		for i := range existingMenus {
			existingMenuMap[strings.ToLower(existingMenus[i].Name)] = &existingMenus[i]
		}

		// First pass: Create or update menus (without parent)
		createdMenus := make(map[string]*models.Menu) // Track newly created menus

		for _, row := range req.Rows {
			result := models.ImportRowResult{
				RowNumber: row.RowNumber,
				Username:  row.Name, // Reusing Username field for menu name
			}

			nameLower := strings.ToLower(row.Name)
			existingMenu := existingMenuMap[nameLower]

			if existingMenu != nil {
				if req.UpdateMode == "skip" {
					result.Status = "skipped"
					result.Message = "Menu already exists"
					response.Results = append(response.Results, result)
					response.Skipped++
					continue
				}

				// Update existing menu (don't update parent yet)
				existingMenu.Path = row.Path
				existingMenu.Icon = row.Icon
				existingMenu.OrderIndex = row.OrderIndex
				existingMenu.IsActive = row.IsActive

				if err := tx.Save(existingMenu).Error; err != nil {
					result.Status = "error"
					result.Message = "Failed to update menu"
					response.Results = append(response.Results, result)
					response.Failed++
					continue
				}

				result.Status = "updated"
				result.Message = "Menu updated successfully"
				response.Results = append(response.Results, result)
				response.Updated++
			} else {
				// Create new menu (without parent)
				newMenu := models.Menu{
					Name:       row.Name,
					Path:       row.Path,
					Icon:       row.Icon,
					OrderIndex: row.OrderIndex,
					IsActive:   row.IsActive,
				}

				if err := tx.Create(&newMenu).Error; err != nil {
					result.Status = "error"
					if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
						result.Message = "Menu name already exists"
					} else {
						result.Message = "Failed to create menu"
					}
					response.Results = append(response.Results, result)
					response.Failed++
					continue
				}

				createdMenus[nameLower] = &newMenu

				result.Status = "created"
				result.Message = "Menu created successfully"
				response.Results = append(response.Results, result)
				response.Created++
			}
		}

		// Second pass: Update parent relationships
		for _, row := range req.Rows {
			if row.ParentName == "" {
				continue // No parent to set
			}

			nameLower := strings.ToLower(row.Name)
			parentLower := strings.ToLower(row.ParentName)

			// Find the menu (either existing or newly created)
			var menu *models.Menu
			if existing := existingMenuMap[nameLower]; existing != nil {
				menu = existing
			} else if created := createdMenus[nameLower]; created != nil {
				menu = created
			} else {
				continue // Menu not found (should not happen if validation passed)
			}

			// Find the parent menu
			var parentMenu *models.Menu
			if existing := existingMenuMap[parentLower]; existing != nil {
				parentMenu = existing
			} else if created := createdMenus[parentLower]; created != nil {
				parentMenu = created
			}

			if parentMenu != nil {
				menu.ParentID = &parentMenu.ID
				if err := tx.Save(menu).Error; err != nil {
					// Log error but don't fail the entire import
					continue
				}
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return response, nil
}
