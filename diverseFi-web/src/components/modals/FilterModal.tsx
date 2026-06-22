import { FunnelIcon } from "@heroicons/react/24/outline";
import React, { useState, useRef, useEffect } from "react";

interface FilterItem {
  field: string;
  value: string;
}

interface FieldOption {
  label: string;
  value: string;
  type: 'select' | 'text' | 'date';
  options?: { value: string; label: string }[];
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterItem[]) => void;
  fields: FieldOption[];
  filterButtonRef: React.RefObject<HTMLDivElement>;
}

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, onApply, fields, filterButtonRef }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<FilterItem[]>([]);
  const [selectedField, setSelectedField] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [isPositioned, setIsPositioned] = useState(false);
  const [modalPosition, setModalPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });

  const calculateModalPosition = () => {
    if (filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setModalPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
      setIsPositioned(true);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsPositioned(false);
      setTimeout(() => {
        calculateModalPosition();
      }, 0);
      window.addEventListener("resize", calculateModalPosition);
    }
    return () => {
      window.removeEventListener("resize", calculateModalPosition);
    };
  }, [isOpen]);

  const handleAddFilter = () => {
    if (!selectedField || !filterValue) return;
    const newFilters = [...filters, { field: selectedField, value: filterValue }];
    setFilters(newFilters);
    setFilterValue("");
    setSelectedField("");
    onApply(newFilters);
  };

  const handleRemoveFilter = (index: number) => {
    const newFilters = filters.filter((_, idx) => idx !== index);
    setFilters(newFilters);
    onApply(newFilters);
  };

  const handleReset = () => {
    setFilters([]);
    setFilterValue("");
    setSelectedField("");
    onApply([]);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedFieldType = fields.find(f => f.value === selectedField)?.type || 'text';

  return (
    <div
      className="fixed z-50 bg-opacity-30 transition-opacity duration-200"
      style={{
        top: modalPosition.top,
        left: modalPosition.left,
        position: "absolute",
        visibility: isPositioned ? "visible" : "hidden",
        opacity: isPositioned ? 1 : 0,
      }}
    >
      <div ref={modalRef} className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-md w-[350px] md:w-[500px] lg:w-[540px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center font-medium text-lg text-gray-900 dark:text-gray-100">
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filter
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 text-xl">
            ✕
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-2 mb-4">
          <select 
            value={selectedField} 
            onChange={(e) => setSelectedField(e.target.value)} 
            className="border dark:border-gray-600 px-2 py-1 rounded w-full sm:w-1/2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="" disabled>
              Select Field
            </option>
            {fields
              .filter((field) => !filters.some((f) => f.field === field.value))
              .map((field) => (
                <option key={field.value} value={field.value}>
                  {field.label}
                </option>
              ))}
          </select>

          {selectedFieldType === 'select' ? (
            <select 
              value={filterValue} 
              onChange={(e) => setFilterValue(e.target.value)} 
              className="border dark:border-gray-600 px-2 py-1 rounded w-full sm:w-2/3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="" disabled>
                Select Value
              </option>
              {fields.find(f => f.value === selectedField)?.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : selectedFieldType === 'date' ? (
            <input
              type="date"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="border dark:border-gray-600 px-2 py-1 rounded w-full sm:w-2/3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          ) : (
            <input
              type="text"
              placeholder="Filter Value"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="border dark:border-gray-600 px-2 py-1 rounded w-full sm:w-2/3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          )}

          <button
            onClick={handleAddFilter}
            className="bg-primary text-white px-3 py-1 rounded hover:bg-primary-dark flex items-center gap-1 w-full sm:w-auto justify-center"
          >
            <span>+</span>
            <span>Add</span>
          </button>
        </div>

        <ul className="my-6 space-y-2 h-36 overflow-y-auto">
          {filters.map((f, idx) => (
            <li key={idx} className="flex justify-between items-center border-b dark:border-gray-700 pb-1">
              <div className="text-gray-900 dark:text-gray-100">
                <span className="font-medium">
                  {fields.find((field) => field.value === f.field)?.label || f.field}
                </span>{" "}
                -{" "}
                <span className="italic text-primary">{f.value}</span>
              </div>
              <button 
                onClick={() => handleRemoveFilter(idx)} 
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </li>
          ))}

          {filters.length === 0 && (
            <li className="text-gray-500 dark:text-gray-400 italic text-center">
              No filters applied.
            </li>
          )}
        </ul>

        {filters.length > 0 && (
          <div className="text-center">
            <button 
              onClick={handleReset} 
              className="text-red-500 border border-red-500 px-4 py-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20"
            >
              ✕ Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterModal; 