package models

// UserImportRow represents a single row from the Excel file
type UserImportRow struct {
	RowNumber int    `json:"row_number"` // Excel row (2+, since row 1 is header)
	Username  string `json:"username"`
	Email     string `json:"email"`
	Password  string `json:"password,omitempty"`
	Name      string `json:"name"`
	RoleName  string `json:"role_name"`
	IsActive  bool   `json:"is_active"`
}

// RowError represents a validation error for a specific row
type RowError struct {
	RowNumber int    `json:"row_number"` // Excel row (2+, since row 1 is header)
	Field     string `json:"field"`      // "username", "email", "role_name", etc.
	Message   string `json:"message"`    // "Username already exists in database"
	Value     string `json:"value,omitempty"`
}

// ValidateImportRequest represents the request to validate import data
type ValidateImportRequest struct {
	Rows []UserImportRow `json:"rows" validate:"required,min=1"`
}

// ValidateImportResponse represents the validation result
type ValidateImportResponse struct {
	IsValid    bool       `json:"is_valid"`
	TotalRows  int        `json:"total_rows"`
	ValidRows  int        `json:"valid_rows"`
	ErrorCount int        `json:"error_count"`
	Errors     []RowError `json:"errors"`
}

// BulkImportRequest represents the request to execute bulk import
type BulkImportRequest struct {
	Rows       []UserImportRow `json:"rows" validate:"required,min=1"`
	UpdateMode string          `json:"update_mode" validate:"required,oneof=skip update"` // "skip" or "update"
}

// ImportRowResult represents the result for a single imported row
type ImportRowResult struct {
	RowNumber int    `json:"row_number"`
	Username  string `json:"username"`
	Status    string `json:"status"` // "created", "updated", "skipped", "error"
	Message   string `json:"message,omitempty"`
}

// BulkImportResponse represents the bulk import result
type BulkImportResponse struct {
	TotalRows   int               `json:"total_rows"`
	Created     int               `json:"created"`
	Updated     int               `json:"updated"`
	Skipped     int               `json:"skipped"`
	Failed      int               `json:"failed"`
	Results     []ImportRowResult `json:"results"`
}

// UserExportRow represents a user row for Excel export
type UserExportRow struct {
	ID        uint   `json:"id"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	Name      string `json:"name"`
	RoleName  string `json:"role_name"`
	IsActive  bool   `json:"is_active"`
}

// ExportUsersResponse represents the export response
type ExportUsersResponse struct {
	Users []UserExportRow `json:"users"`
	Total int             `json:"total"`
}
