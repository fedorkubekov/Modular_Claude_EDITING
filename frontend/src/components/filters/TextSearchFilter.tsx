interface TextSearchFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const TextSearchFilter = ({
  value,
  onChange,
  placeholder = 'Search...',
}: TextSearchFilterProps) => {
  return (
    <div className="space-y-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {value && (
        <p className="text-xs text-gray-600">
          Searching for: <span className="font-medium">{value}</span>
        </p>
      )}
    </div>
  );
};
