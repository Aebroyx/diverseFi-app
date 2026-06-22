package models

// MenuExportRow represents a menu for export
type MenuExportRow struct {
	ID         uint   `json:"id"`
	Name       string `json:"name"`
	Path       string `json:"path"`
	Icon       string `json:"icon"`
	OrderIndex int    `json:"order_index"`
	ParentName string `json:"parent_name"` // Parent menu name (more user-friendly than ID)
	IsActive   bool   `json:"is_active"`
}

// ExportMenusResponse represents the response for menu export
type ExportMenusResponse struct {
	Menus []MenuExportRow `json:"menus"`
	Total int             `json:"total"`
}

// MenuImportRow represents a menu row from import
type MenuImportRow struct {
	RowNumber  int    `json:"row_number"`
	Name       string `json:"name"`
	Path       string `json:"path"`
	Icon       string `json:"icon"`
	OrderIndex int    `json:"order_index"`
	ParentName string `json:"parent_name"` // Parent menu name reference
	IsActive   bool   `json:"is_active"`
}

// ValidateMenuImportRequest represents the request to validate menu import data
type ValidateMenuImportRequest struct {
	Rows []MenuImportRow `json:"rows" validate:"required,min=1,dive"`
}

// ValidateMenuImportResponse represents the response for menu import validation
type ValidateMenuImportResponse struct {
	IsValid    bool       `json:"is_valid"`
	TotalRows  int        `json:"total_rows"`
	ValidRows  int        `json:"valid_rows"`
	ErrorCount int        `json:"error_count"`
	Errors     []RowError `json:"errors"`
}

// BulkMenuImportRequest represents the request to bulk import menus
type BulkMenuImportRequest struct {
	Rows       []MenuImportRow `json:"rows" validate:"required,min=1,dive"`
	UpdateMode string          `json:"update_mode" validate:"required,oneof=skip update"`
}

// BulkMenuImportResponse represents the response for bulk menu import
type BulkMenuImportResponse struct {
	TotalRows int               `json:"total_rows"`
	Created   int               `json:"created"`
	Updated   int               `json:"updated"`
	Skipped   int               `json:"skipped"`
	Failed    int               `json:"failed"`
	Results   []ImportRowResult `json:"results"`
}
