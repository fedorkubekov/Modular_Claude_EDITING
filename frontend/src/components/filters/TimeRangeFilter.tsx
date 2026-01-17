interface TimeRangeFilterProps {
  fromTime: string;
  toTime: string;
  onFromChange: (time: string) => void;
  onToChange: (time: string) => void;
}

export const TimeRangeFilter = ({
  fromTime,
  toTime,
  onFromChange,
  onToChange,
}: TimeRangeFilterProps) => {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          From
        </label>
        <input
          type="time"
          value={fromTime}
          onChange={(e) => onFromChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Until
        </label>
        <input
          type="time"
          value={toTime}
          onChange={(e) => onToChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};
