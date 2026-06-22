// User import row from Excel
export interface UserImportRow {
  row_number: number; // Excel row (2+, since row 1 is header)
  username: string;
  email: string;
  password?: string;
  name: string;
  role_name: string;
  is_active: boolean;
}

// Row-level validation error
export interface RowError {
  row_number: number;
  field: string;
  message: string;
  value?: string;
}

// Validate import request
export interface ValidateImportRequest {
  rows: UserImportRow[];
}

// Validate import response
export interface ValidateImportResponse {
  is_valid: boolean;
  total_rows: number;
  valid_rows: number;
  error_count: number;
  errors: RowError[];
}

// Bulk import request
export interface BulkImportRequest {
  rows: UserImportRow[];
  update_mode: 'skip' | 'update';
}

// Import row result
export interface ImportRowResult {
  row_number: number;
  username: string;
  status: 'created' | 'updated' | 'skipped' | 'error';
  message?: string;
}

// Bulk import response
export interface BulkImportResponse {
  total_rows: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  results: ImportRowResult[];
}

// User export row
export interface UserExportRow {
  id: number;
  username: string;
  email: string;
  name: string;
  role_name: string;
  is_active: boolean;
}

// Export users response
export interface ExportUsersResponse {
  users: UserExportRow[];
  total: number;
}

// Import step type for multi-step modal
export type ImportStep = 'upload' | 'preview' | 'validating' | 'validation_result' | 'importing' | 'import_result';
