interface DateRangeFilterProps {
  fromDate: string;
  toDate: string;
  onFromChange: (date: string) => void;
  onToChange: (date: string) => void;
  allowSingleDate?: boolean;
}

export const DateRangeFilter = ({
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  allowSingleDate = true,
}: DateRangeFilterProps) => {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          From
        </label>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => onFromChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Until {allowSingleDate && <span className="text-gray-500 font-normal">(optional)</span>}
        </label>
        <input
          type="date"
          value={toDate}
          onChange={(e) => onToChange(e.target.value)}
          min={fromDate || undefined}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {allowSingleDate && !toDate && fromDate && (
        <p className="text-xs text-gray-500 italic">
          Filtering for single day: {new Date(fromDate).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};
