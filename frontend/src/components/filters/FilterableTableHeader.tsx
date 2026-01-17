import { ReactNode } from 'react';
import { FilterDropdown } from './FilterDropdown';

interface FilterableTableHeaderProps {
  label: string;
  isActive: boolean;
  onClear: () => void;
  children: ReactNode;
  className?: string;
}

export const FilterableTableHeader = ({
  label,
  isActive,
  onClear,
  children,
  className = '',
}: FilterableTableHeaderProps) => {
  return (
    <th className={`text-left py-3 px-4 ${className}`}>
      <FilterDropdown label={label} isActive={isActive} onClear={onClear}>
        {children}
      </FilterDropdown>
    </th>
  );
};
