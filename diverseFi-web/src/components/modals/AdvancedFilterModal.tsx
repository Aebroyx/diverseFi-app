'use client';

import { useState, useEffect } from 'react';
import { GripVertical, Plus, Trash2, X } from 'lucide-react';
import { PrimaryButton, SecondaryButton } from '@/components/ui/buttons';
import Select from '@/components/ui/Select';
import { Input as ShadcnInput } from '@/components/ui/shadcn/input';
import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import type {
  FilterCondition,
  FilterFieldOption,
  FilterLogic,
  FilterOperator,
} from '@/types/filter';

export type { FilterCondition, FilterFieldOption, FilterLogic, FilterOperator };

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

  // Convert fields to Select options format (placeholder handled by Select, not as empty value)
  const fieldOptions = fields.map((f) => ({ value: f.key, label: f.label }));

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
      >
        <DialogHeader className="flex-row items-center justify-between space-y-0 border-b border-border px-6 py-4">
          <DialogTitle>Customize table</DialogTitle>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        <div className="overflow-y-auto px-6 py-4">
          <p className="mb-4 text-sm text-muted-foreground">Select and add conditions</p>

          <div className="space-y-4">
            {conditions.map((condition, index) => {
              const selectedField = fields.find((f) => f.key === condition.field);
              const availableOperators = selectedField
                ? getOperatorsForFieldType(selectedField.type)
                : [{ value: 'equals', label: 'Equals' }];
              const needsValue = operatorNeedsValue(condition.operator);
              const valueOptions = selectedField?.options ?? [];

              return (
                <div key={condition.id} className="space-y-2">
                  {index > 0 && (
                    <div className="flex items-center gap-2 pl-1">
                      <GripVertical className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <div className="w-28">
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
                          size="sm"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[auto_auto_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <GripVertical className="mb-2 hidden h-5 w-5 shrink-0 cursor-move text-muted-foreground md:block" />
                    <span className="mb-2 hidden text-sm text-muted-foreground md:block">Where</span>

                    <Select
                      label="Field"
                      hideLabel
                      options={fieldOptions}
                      value={condition.field}
                      onChange={(value) =>
                        handleUpdateCondition(condition.id, { field: value })
                      }
                      placeholder="Select field"
                      className="min-w-0"
                    />

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
                      className="min-w-0"
                    />

                    {needsValue ? (
                      selectedField?.type === 'select' || selectedField?.type === 'boolean' ? (
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
                          className="min-w-0"
                        />
                      ) : (
                        <ShadcnInput
                          type={
                            selectedField?.type === 'date'
                              ? 'date'
                              : selectedField?.type === 'number'
                                ? 'number'
                                : 'text'
                          }
                          value={condition.value}
                          onChange={(e) =>
                            handleUpdateCondition(condition.id, { value: e.target.value })
                          }
                          disabled={!condition.field}
                          placeholder="Enter value"
                          className="h-10 w-full min-w-0"
                        />
                      )
                    ) : (
                      <div className="hidden md:block" />
                    )}

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveCondition(condition.id)}
                      disabled={conditions.length === 1}
                      className="mb-0.5 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label="Remove condition"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            variant="ghost"
            onClick={handleAddCondition}
            className="mt-4 gap-2 px-0 text-primary hover:bg-primary/10 hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            Add conditions
          </Button>
        </div>

        <DialogFooter className="mx-0 mb-0 flex-row items-center justify-between gap-3 rounded-none border-t border-border bg-transparent px-6 py-4 sm:justify-between">
          <SecondaryButton onClick={handleReset} variant="danger">
            Clear all
          </SecondaryButton>
          <PrimaryButton onClick={handleApply}>Apply</PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
