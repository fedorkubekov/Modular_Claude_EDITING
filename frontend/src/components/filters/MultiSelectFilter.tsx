import { useState, useMemo } from 'react';

interface Option {
  id: number;
  label: string;
}

interface MultiSelectFilterProps {
  options: Option[];
  selectedIds: number[];
  onChange: (selectedIds: number[]) => void;
  searchPlaceholder?: string;
}

export const MultiSelectFilter = ({
  options,
  selectedIds,
  onChange,
  searchPlaceholder = 'Search...',
}: MultiSelectFilterProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const term = searchTerm.toLowerCase();
    return options.filter((option) =>
      option.label.toLowerCase().includes(term)
    );
  }, [options, searchTerm]);

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    onChange(filteredOptions.map((option) => option.id));
  };

  const handleDeselectAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-2">
      {/* Search input */}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={searchPlaceholder}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

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
      <div className="max-h-[200px] overflow-y-auto space-y-1">
        {filteredOptions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">No options found</p>
        ) : (
          filteredOptions.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(option.id)}
                onChange={() => handleToggle(option.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))
        )}
      </div>

      {/* Selected count */}
      {selectedIds.length > 0 && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            {selectedIds.length} selected
          </p>
        </div>
      )}
    </div>
  );
};
