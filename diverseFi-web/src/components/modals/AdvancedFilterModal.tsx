'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, TrashIcon, Bars2Icon, PlusIcon } from '@heroicons/react/24/outline';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import Select from '@/components/ui/Select';

// Operator types for different field types
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

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (conditions: FilterCondition[]) => void;
  fields: FilterFieldOption[];
  initialConditions?: FilterCondition[];
}

// Get available operators based on field type
const getOperatorsForFieldType = (type: string): { value: string; label: string }[] => {
  const commonOperators = [
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' },
  ];

  switch (type) {
    case 'text':
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'notEquals', label: 'Not equals' },
        { value: 'contains', label: 'Contains' },
        { value: 'notContains', label: 'Not contains' },
        { value: 'startsWith', label: 'Starts with' },
        { value: 'endsWith', label: 'Ends with' },
        ...commonOperators,
      ];
    case 'number':
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'notEquals', label: 'Not equals' },
        { value: 'greaterThan', label: 'Greater than' },
        { value: 'lessThan', label: 'Less than' },
        { value: 'greaterThanOrEqual', label: 'Greater than or equal' },
        { value: 'lessThanOrEqual', label: 'Less than or equal' },
        ...commonOperators,
      ];
    case 'date':
      return [
        { value: 'equals', label: 'Is' },
        { value: 'notEquals', label: 'Is not' },
        { value: 'greaterThan', label: 'After' },
        { value: 'lessThan', label: 'Before' },
        { value: 'greaterThanOrEqual', label: 'On or after' },
        { value: 'lessThanOrEqual', label: 'On or before' },
        ...commonOperators,
      ];
    case 'select':
    case 'boolean':
      return [
        { value: 'is', label: 'Is' },
        { value: 'isNot', label: 'Is not' },
        ...commonOperators,
      ];
    default:
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'contains', label: 'Contains' },
        ...commonOperators,
      ];
  }
};

// Check if operator requires a value input
const operatorNeedsValue = (operator: FilterOperator): boolean => {
  return !['isEmpty', 'isNotEmpty'].includes(operator);
};

// Logic options for AND/OR selector
const logicOptions = [
  { value: 'and', label: 'and' },
  { value: 'or', label: 'or' },
];

export default function AdvancedFilterModal({
  isOpen,
  onClose,
  onApply,
  fields,
  initialConditions = [],
}: AdvancedFilterModalProps) {
  const [conditions, setConditions] = useState<FilterCondition[]>([]);

  // Convert fields to Select options format
  const fieldOptions = [
    { value: '', label: 'Select field' },
    ...fields.map((f) => ({ value: f.key, label: f.label })),
  ];

  // Initialize conditions when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialConditions.length > 0) {
        setConditions(initialConditions);
      } else {
        // Start with one empty condition
        setConditions([
          {
            id: crypto.randomUUID(),
            field: '',
            operator: 'equals',
            value: '',
            logic: 'and',
          },
        ]);
      }
    }
  }, [isOpen, initialConditions]);

  const handleAddCondition = () => {
    setConditions([
      ...conditions,
      {
        id: crypto.randomUUID(),
        field: '',
        operator: 'equals',
        value: '',
        logic: 'and',
      },
    ]);
  };

  const handleRemoveCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id));
  };

  const handleUpdateCondition = (id: string, updates: Partial<FilterCondition>) => {
    setConditions(
      conditions.map((c) => {
        if (c.id === id) {
          const updatedCondition = { ...c, ...updates };

          // Reset operator if field type changes
          if (updates.field !== undefined && updates.field !== c.field) {
            const field = fields.find((f) => f.key === updates.field);
            if (field) {
              const availableOperators = getOperatorsForFieldType(field.type);
              updatedCondition.operator = availableOperators[0].value as FilterOperator;
              updatedCondition.value = '';
            }
          }

          return updatedCondition;
        }
        return c;
      })
    );
  };

  const handleApply = () => {
    // Filter out incomplete conditions
    const validConditions = conditions.filter(
      (c) => c.field && c.operator && (operatorNeedsValue(c.operator) ? c.value : true)
    );
    onApply(validConditions);
    onClose();
  };

  const handleReset = () => {
    setConditions([
      {
        id: crypto.randomUUID(),
        field: '',
        operator: 'equals',
        value: '',
        logic: 'and',
      },
    ]);
    onApply([]);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl max-h-[90vh] overflow-y-auto transform rounded-lg bg-white dark:bg-card-bg shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-border-dark px-6 py-4">
                  <Dialog.Title as="h2" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Customize table
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Body */}
                <div className="px-6 py-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Select and add conditions
                  </p>

                  {/* Conditions */}
                  <div className="space-y-3">
                    {conditions.map((condition, index) => {
                      const selectedField = fields.find((f) => f.key === condition.field);
                      const availableOperators = selectedField
                        ? getOperatorsForFieldType(selectedField.type)
                        : [{ value: 'equals', label: 'Equals' }];
                      const needsValue = operatorNeedsValue(condition.operator);

                      // Value options for select/boolean fields
                      const valueOptions = selectedField?.options
                        ? [{ value: '', label: 'Select value' }, ...selectedField.options]
                        : [];

                      return (
                        <div key={condition.id}>
                          {/* Show AND/OR selector for conditions after the first */}
                          {index > 0 && (
                            <div className="flex items-center gap-2 mb-2">
                              <Bars2Icon className="h-5 w-5 text-gray-400" />
                              <div className="w-24">
                                <Select
                                  label="Logic"
                                  hideLabel
                                  options={logicOptions}
                                  value={condition.logic}
                                  onChange={(value) =>
                                    handleUpdateCondition(condition.id, {
                                      logic: value as FilterLogic,
                                    })
                                  }
                                  placeholder="Logic"
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            {/* Drag handle */}
                            <div className="flex-shrink-0">
                              <Bars2Icon className="h-5 w-5 text-gray-400 cursor-move" />
                            </div>

                            {/* Where label */}
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Where
                            </div>

                            {/* Field selector */}
                            <div className="flex-1">
                              <Select
                                label="Field"
                                hideLabel
                                options={fieldOptions}
                                value={condition.field}
                                onChange={(value) =>
                                  handleUpdateCondition(condition.id, { field: value })
                                }
                                placeholder="Select field"
                              />
                            </div>

                            {/* Operator selector */}
                            <div className="flex-1">
                              <Select
                                label="Operator"
                                hideLabel
                                options={availableOperators}
                                value={condition.operator}
                                onChange={(value) =>
                                  handleUpdateCondition(condition.id, {
                                    operator: value as FilterOperator,
                                  })
                                }
                                disabled={!condition.field}
                                placeholder="Select operator"
                              />
                            </div>

                            {/* Value input */}
                            {needsValue && (
                              <>
                                {selectedField?.type === 'select' || selectedField?.type === 'boolean' ? (
                                  <div className="flex-1">
                                    <Select
                                      label="Value"
                                      hideLabel
                                      options={valueOptions}
                                      value={condition.value}
                                      onChange={(value) =>
                                        handleUpdateCondition(condition.id, { value })
                                      }
                                      disabled={!condition.field}
                                      placeholder="Select value"
                                    />
                                  </div>
                                ) : selectedField?.type === 'date' ? (
                                  <input
                                    type="date"
                                    value={condition.value}
                                    onChange={(e) =>
                                      handleUpdateCondition(condition.id, { value: e.target.value })
                                    }
                                    disabled={!condition.field}
                                    className="flex-1 rounded-md border border-gray-300 dark:border-border-dark bg-white dark:bg-input-bg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                ) : selectedField?.type === 'number' ? (
                                  <input
                                    type="number"
                                    value={condition.value}
                                    onChange={(e) =>
                                      handleUpdateCondition(condition.id, { value: e.target.value })
                                    }
                                    disabled={!condition.field}
                                    placeholder="Enter value"
                                    className="flex-1 rounded-md border border-gray-300 dark:border-border-dark bg-white dark:bg-input-bg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={condition.value}
                                    onChange={(e) =>
                                      handleUpdateCondition(condition.id, { value: e.target.value })
                                    }
                                    disabled={!condition.field}
                                    placeholder="Enter value"
                                    className="flex-1 rounded-md border border-gray-300 dark:border-border-dark bg-white dark:bg-input-bg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                )}
                              </>
                            )}

                            {/* Delete button */}
                            <button
                              onClick={() => handleRemoveCondition(condition.id)}
                              disabled={conditions.length === 1}
                              className="flex-shrink-0 rounded-lg p-2 text-gray-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add condition button */}
                  <button
                    onClick={handleAddCondition}
                    className="mt-4 flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Add conditions
                  </button>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-gray-200 dark:border-border-dark px-6 py-4">
                  <SecondaryButton onClick={handleReset} variant="danger">
                    Clear all
                  </SecondaryButton>
                  <PrimaryButton onClick={handleApply}>Apply</PrimaryButton>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
