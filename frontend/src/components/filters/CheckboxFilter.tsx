interface CheckboxFilterProps {
  options: string[];
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
}

export const CheckboxFilter = ({
  options,
  selectedValues,
  onChange,
}: CheckboxFilterProps) => {
  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const handleSelectAll = () => {
    onChange([...options]);
  };

  const handleDeselectAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-2">
      {/* Select All / Deselect All */}
      <div className="flex gap-2 pb-2 border-b border-gray-200">
        <button
          onClick={handleSelectAll}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Select All
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={handleDeselectAll}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Deselect All
        </button>
      </div>

      {/* Options list */}
      <div className="space-y-1">
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedValues.includes(option)}
              onChange={() => handleToggle(option)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 capitalize">{option}</span>
          </label>
        ))}
      </div>

      {/* Selected count */}
      {selectedValues.length > 0 && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            {selectedValues.length} selected
          </p>
        </div>
      )}
    </div>
  );
};
