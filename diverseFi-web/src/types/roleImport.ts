// Role import row from Excel
export interface RoleImportRow {
  row_number: number;
  name: string;
  display_name: string;
  description: string;
  is_default: boolean;
  is_active: boolean;
}

// Row-level validation error (reuse from userImport)
export interface RowError {
  row_number: number;
  field: string;
  message: string;
  value?: string;
}

// Validate import request
export interface ValidateRoleImportRequest {
  rows: RoleImportRow[];
}

// Validate import response
export interface ValidateRoleImportResponse {
  is_valid: boolean;
  total_rows: number;
  valid_rows: number;
  error_count: number;
  errors: RowError[];
}

// Bulk import request
export interface BulkRoleImportRequest {
  rows: RoleImportRow[];
  update_mode: 'skip' | 'update';
}

// Import row result
export interface ImportRowResult {
  row_number: number;
  username: string; // Used for role name
  status: 'created' | 'updated' | 'skipped' | 'error';
  message?: string;
}

// Bulk import response
export interface BulkRoleImportResponse {
  total_rows: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  results: ImportRowResult[];
}

// Import step type for multi-step modal
export type ImportStep = 'upload' | 'preview' | 'validating' | 'validation_result' | 'importing' | 'import_result';
