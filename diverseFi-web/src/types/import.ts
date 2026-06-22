// Shared types for import/export functionality across all modules

// Row-level validation error
export interface RowError {
  row_number: number;
  field: string;
  message: string;
  value?: string;
}

// Import row result
export interface ImportRowResult {
  row_number: number;
  username: string; // Generic field used for entity name (user, role, menu, etc.)
  status: 'created' | 'updated' | 'skipped' | 'error';
  message?: string;
}

// Import step type for multi-step modal
export type ImportStep = 'upload' | 'preview' | 'validating' | 'validation_result' | 'importing' | 'import_result';
