export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'is'
  | 'isNot'
  | 'isEmpty'
  | 'isNotEmpty';

export type FilterLogic = 'and' | 'or';

export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string;
  logic: FilterLogic;
}

export interface FilterFieldOption {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  options?: { value: string; label: string }[];
}
