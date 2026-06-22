import { Fragment, useState } from "react";
import { Popover, Transition } from "@headlessui/react";
import { FunnelIcon } from "@heroicons/react/24/outline";
import { PrimaryButton, SecondaryButton } from "@/components/ui/buttons";

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
  onApply: (filters: FilterItem[]) => void;
  fields: FieldOption[];
  buttonClassName?: string;
}

const FilterModal: React.FC<FilterModalProps> = ({ onApply, fields, buttonClassName }) => {
  const [filters, setFilters] = useState<FilterItem[]>([]);
  const [selectedField, setSelectedField] = useState("");
  const [filterValue, setFilterValue] = useState("");

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

  const selectedFieldType = fields.find(f => f.value === selectedField)?.type || 'text';

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button
            className={`inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-border-dark bg-white dark:bg-card-bg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-hover-bg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${buttonClassName || ''}`}
          >
            <FunnelIcon className="h-5 w-5" />
            Filter
            {filters.length > 0 && (
              <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white">
                {filters.length}
              </span>
            )}
          </Popover.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute left-0 z-50 mt-2 w-[350px] md:w-[500px] lg:w-[540px] origin-top-left rounded-md bg-white dark:bg-card-bg p-4 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center font-medium text-lg text-gray-900 dark:text-gray-100">
                  <FunnelIcon className="h-5 w-5 mr-2" />
                  Filter
                </div>
                <Popover.Button className="text-gray-500 hover:text-red-500 text-xl">
                  ✕
                </Popover.Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-2 mb-4">
                <select
                  value={selectedField}
                  onChange={(e) => setSelectedField(e.target.value)}
                  className="border dark:border-border-dark px-2 py-1 rounded w-full sm:w-1/2 bg-white dark:bg-input-bg text-gray-900 dark:text-gray-100"
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
                    className="border dark:border-border-dark px-2 py-1 rounded w-full sm:w-2/3 bg-white dark:bg-input-bg text-gray-900 dark:text-gray-100"
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
                    className="border dark:border-border-dark px-2 py-1 rounded w-full sm:w-2/3 bg-white dark:bg-input-bg text-gray-900 dark:text-gray-100"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="Filter Value"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="border dark:border-border-dark px-2 py-1 rounded w-full sm:w-2/3 bg-white dark:bg-input-bg text-gray-900 dark:text-gray-100"
                  />
                )}

                <PrimaryButton
                  onClick={handleAddFilter}
                  className="w-full sm:w-auto"
                >
                  <span>+</span>
                  <span>Add</span>
                </PrimaryButton>
              </div>

              <ul className="my-6 space-y-2 h-36 overflow-y-auto">
                {filters.map((f, idx) => (
                  <li key={idx} className="flex justify-between items-center border-b dark:border-border-dark pb-1">
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
                  <SecondaryButton
                    onClick={handleReset}
                    variant="danger"
                  >
                    ✕ Clear All
                  </SecondaryButton>
                </div>
              )}
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
};

export default FilterModal;
