import { useState, useRef, useEffect, ReactNode } from 'react';

interface FilterDropdownProps {
  label: string;
  isActive: boolean;
  onClear: () => void;
  children: ReactNode;
}

export const FilterDropdown = ({ label, isActive, onClear, children }: FilterDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1 text-sm font-semibold ${
          isActive ? 'text-blue-600' : 'text-gray-700'
        } hover:text-blue-600`}
      >
        {label}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[250px]">
          <div className="p-3">
            {children}
          </div>

          {isActive && (
            <div className="border-t border-gray-200 p-2">
              <button
                onClick={() => {
                  onClear();
                  setIsOpen(false);
                }}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
