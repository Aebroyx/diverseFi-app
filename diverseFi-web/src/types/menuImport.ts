// Menu import row from Excel
export interface MenuImportRow {
  row_number: number;
  name: string;
  path: string;
  icon: string;
  order_index: number;
  parent_name: string; // Parent menu name reference
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
export interface ValidateMenuImportRequest {
  rows: MenuImportRow[];
}

// Validate import response
export interface ValidateMenuImportResponse {
  is_valid: boolean;
  total_rows: number;
  valid_rows: number;
  error_count: number;
  errors: RowError[];
}

// Bulk import request
export interface BulkMenuImportRequest {
  rows: MenuImportRow[];
  update_mode: 'skip' | 'update';
}

// Import row result
export interface ImportRowResult {
  row_number: number;
  username: string; // Used for menu name
  status: 'created' | 'updated' | 'skipped' | 'error';
  message?: string;
}

// Bulk import response
export interface BulkMenuImportResponse {
  total_rows: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  results: ImportRowResult[];
}

// Import step type for multi-step modal
export type ImportStep = 'upload' | 'preview' | 'validating' | 'validation_result' | 'importing' | 'import_result';
