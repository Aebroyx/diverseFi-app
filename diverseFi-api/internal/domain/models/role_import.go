package models

// RoleExportRow represents a role for export
type RoleExportRow struct {
	ID          uint   `json:"id"`
	Name        string `json:"name"`
	DisplayName string `json:"display_name"`
	Description string `json:"description"`
	IsDefault   bool   `json:"is_default"`
	IsActive    bool   `json:"is_active"`
}

// ExportRolesResponse represents the response for role export
type ExportRolesResponse struct {
	Roles []RoleExportRow `json:"roles"`
	Total int             `json:"total"`
}

// RoleImportRow represents a role row from import
type RoleImportRow struct {
	RowNumber   int    `json:"row_number"`
	Name        string `json:"name"`
	DisplayName string `json:"display_name"`
	Description string `json:"description"`
	IsDefault   bool   `json:"is_default"`
	IsActive    bool   `json:"is_active"`
}

// ValidateRoleImportRequest represents the request to validate role import data
type ValidateRoleImportRequest struct {
	Rows []RoleImportRow `json:"rows" validate:"required,min=1,dive"`
}

// ValidateRoleImportResponse represents the response for role import validation
type ValidateRoleImportResponse struct {
	IsValid    bool       `json:"is_valid"`
	TotalRows  int        `json:"total_rows"`
	ValidRows  int        `json:"valid_rows"`
	ErrorCount int        `json:"error_count"`
	Errors     []RowError `json:"errors"`
}

// BulkRoleImportRequest represents the request to bulk import roles
type BulkRoleImportRequest struct {
	Rows       []RoleImportRow `json:"rows" validate:"required,min=1,dive"`
	UpdateMode string          `json:"update_mode" validate:"required,oneof=skip update"`
}

// BulkRoleImportResponse represents the response for bulk role import
type BulkRoleImportResponse struct {
	TotalRows int               `json:"total_rows"`
	Created   int               `json:"created"`
	Updated   int               `json:"updated"`
	Skipped   int               `json:"skipped"`
	Failed    int               `json:"failed"`
	Results   []ImportRowResult `json:"results"`
}
