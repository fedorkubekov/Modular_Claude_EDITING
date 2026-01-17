interface DurationFilterProps {
  minHours: number;
  minMinutes: number;
  maxHours: number;
  maxMinutes: number;
  onMinHoursChange: (hours: number) => void;
  onMinMinutesChange: (minutes: number) => void;
  onMaxHoursChange: (hours: number) => void;
  onMaxMinutesChange: (minutes: number) => void;
}

export const DurationFilter = ({
  minHours,
  minMinutes,
  maxHours,
  maxMinutes,
  onMinHoursChange,
  onMinMinutesChange,
  onMaxHoursChange,
  onMaxMinutesChange,
}: DurationFilterProps) => {
  const handleNumberInput = (
    value: string,
    max: number,
    onChange: (val: number) => void
  ) => {
    const num = parseInt(value) || 0;
    onChange(Math.min(Math.max(0, num), max));
  };

  return (
    <div className="space-y-3">
      {/* Minimum Duration */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Minimum Duration
        </label>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Hours (0-23)</label>
            <input
              type="number"
              min="0"
              max="23"
              value={minHours}
              onChange={(e) => handleNumberInput(e.target.value, 23, onMinHoursChange)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Minutes (0-59)</label>
            <input
              type="number"
              min="0"
              max="59"
              value={minMinutes}
              onChange={(e) => handleNumberInput(e.target.value, 59, onMinMinutesChange)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Maximum Duration */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Maximum Duration
        </label>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Hours (0-23)</label>
            <input
              type="number"
              min="0"
              max="23"
              value={maxHours}
              onChange={(e) => handleNumberInput(e.target.value, 23, onMaxHoursChange)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Minutes (0-59)</label>
            <input
              type="number"
              min="0"
              max="59"
              value={maxMinutes}
              onChange={(e) => handleNumberInput(e.target.value, 59, onMaxMinutesChange)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Display formatted duration */}
      <div className="pt-2 border-t border-gray-200 text-xs text-gray-600">
        <p>
          Min: {minHours}h {minMinutes}m - Max: {maxHours}h {maxMinutes}m
        </p>
      </div>
    </div>
  );
};
