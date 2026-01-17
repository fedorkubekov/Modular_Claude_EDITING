import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import type { Shift, ShiftFilters } from '@/types';
import { formatDateTime, formatTime, calculateDuration } from '@/utils/format';
import { FilterableTableHeader } from '@/components/filters/FilterableTableHeader';
import { DateRangeFilter } from '@/components/filters/DateRangeFilter';
import { TimeRangeFilter } from '@/components/filters/TimeRangeFilter';
import { DurationFilter } from '@/components/filters/DurationFilter';
import { CheckboxFilter } from '@/components/filters/CheckboxFilter';

export const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter state
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [clockInFrom, setClockInFrom] = useState('');
  const [clockInTo, setClockInTo] = useState('');
  const [clockOutFrom, setClockOutFrom] = useState('');
  const [clockOutTo, setClockOutTo] = useState('');
  const [durationMinHours, setDurationMinHours] = useState(0);
  const [durationMinMins, setDurationMinMins] = useState(0);
  const [durationMaxHours, setDurationMaxHours] = useState(23);
  const [durationMaxMins, setDurationMaxMins] = useState(59);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const statusOptions = ['assigned', 'in_progress', 'completed'];

  useEffect(() => {
    loadActiveShift();
    loadShiftHistory();

    // Reload active shift when page becomes visible (after sleep/tab switch)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible - reload to sync state
        loadActiveShift();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also reload on window focus (backup for some browsers)
    window.addEventListener('focus', loadActiveShift);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', loadActiveShift);
    };
  }, []);

  // Reload shifts when filters change
  useEffect(() => {
    loadShiftHistory();
  }, [
    dateFrom,
    dateTo,
    clockInFrom,
    clockInTo,
    clockOutFrom,
    clockOutTo,
    durationMinHours,
    durationMinMins,
    durationMaxHours,
    durationMaxMins,
    selectedStatuses,
  ]);

  const loadActiveShift = async () => {
    try {
      const response = await api.getActiveShift();
      setActiveShift(response.shift);
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Failed to load active shift:', err);
      setError('Failed to load active shift: ' + api.getErrorMessage(err));
    }
  };

  const loadShiftHistory = async () => {
    try {
      const filters: ShiftFilters = {};

      // Build filters object
      if (selectedStatuses.length > 0) {
        filters.statuses = selectedStatuses;
      }

      // Date filters - combine date and time
      if (dateFrom) {
        const fromDateTime = clockInFrom
          ? `${dateFrom}T${clockInFrom}:00Z`
          : `${dateFrom}T00:00:00Z`;
        filters.clockInFrom = fromDateTime;
      }
      if (dateTo) {
        const toDateTime = clockInTo
          ? `${dateTo}T${clockInTo}:00Z`
          : `${dateTo}T23:59:59Z`;
        filters.clockInTo = toDateTime;
      } else if (dateFrom && !dateTo) {
        // Single day filter
        const toDateTime = clockInTo
          ? `${dateFrom}T${clockInTo}:00Z`
          : `${dateFrom}T23:59:59Z`;
        filters.clockInTo = toDateTime;
      }

      // Clock out filters
      if (clockOutFrom) {
        const fromDate = dateFrom || new Date().toISOString().split('T')[0];
        filters.clockOutFrom = `${fromDate}T${clockOutFrom}:00Z`;
      }
      if (clockOutTo) {
        const toDate = dateTo || dateFrom || new Date().toISOString().split('T')[0];
        filters.clockOutTo = `${toDate}T${clockOutTo}:00Z`;
      }

      // Duration filters (only if not default values)
      if (durationMinHours > 0 || durationMinMins > 0) {
        filters.durationMinHours = durationMinHours;
        filters.durationMinMins = durationMinMins;
      }
      if (durationMaxHours < 23 || durationMaxMins < 59) {
        filters.durationMaxHours = durationMaxHours;
        filters.durationMaxMins = durationMaxMins;
      }

      const response = await api.getMyShifts(50, 0, filters);
      setShifts(response.shifts || []);
    } catch (err) {
      console.error('Failed to load shift history:', err);
      setError('Failed to load shift history: ' + api.getErrorMessage(err));
    }
  };

  // Check if filters are active
  const isDateFilterActive = dateFrom !== '';
  const isClockInFilterActive = clockInFrom !== '' || clockInTo !== '';
  const isClockOutFilterActive = clockOutFrom !== '' || clockOutTo !== '';
  const isDurationFilterActive = durationMinHours > 0 || durationMinMins > 0 ||
                                   durationMaxHours < 23 || durationMaxMins < 59;
  const isStatusFilterActive = selectedStatuses.length > 0;

  // Clear filter functions
  const clearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
  };

  const clearClockInFilter = () => {
    setClockInFrom('');
    setClockInTo('');
  };

  const clearClockOutFilter = () => {
    setClockOutFrom('');
    setClockOutTo('');
  };

  const clearDurationFilter = () => {
    setDurationMinHours(0);
    setDurationMinMins(0);
    setDurationMaxHours(23);
    setDurationMaxMins(59);
  };

  const clearStatusFilter = () => {
    setSelectedStatuses([]);
  };

  const handleClockIn = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.clockIn();
      setActiveShift(response.shift);
      setSuccess('Successfully clocked in!');
      loadShiftHistory();
    } catch (err) {
      setError(api.getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.clockOut({ notes });
      setActiveShift(null);
      setNotes('');
      setSuccess('Successfully clocked out!');
      loadShiftHistory();
    } catch (err) {
      setError(api.getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.full_name}!
        </h1>
        <p className="text-gray-600">Employee Dashboard</p>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Active Shift Card */}
      <Card
        title="Current Shift"
        action={
          <button
            onClick={loadActiveShift}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            title="Refresh shift status"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        }
      >
        {activeShift ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">Clocked In</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatTime(activeShift.clock_in)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-lg font-semibold text-green-600">
                    {calculateDuration(activeShift.clock_in)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about your shift (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />

                <Button
                  onClick={handleClockOut}
                  variant="danger"
                  fullWidth
                  isLoading={isLoading}
                >
                  Clock Out
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You are not currently clocked in</p>
            <Button
              onClick={handleClockIn}
              variant="success"
              size="lg"
              isLoading={isLoading}
            >
              Clock In
            </Button>
          </div>
        )}
      </Card>

      {/* Shift History */}
      <Card title="Recent Shifts">
        {shifts.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No shift history yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <FilterableTableHeader
                    label="Date"
                    isActive={isDateFilterActive}
                    onClear={clearDateFilter}
                    className="text-sm font-semibold text-gray-700"
                  >
                    <DateRangeFilter
                      fromDate={dateFrom}
                      toDate={dateTo}
                      onFromChange={setDateFrom}
                      onToChange={setDateTo}
                      allowSingleDate={true}
                    />
                  </FilterableTableHeader>

                  <FilterableTableHeader
                    label="Clock In"
                    isActive={isClockInFilterActive}
                    onClear={clearClockInFilter}
                    className="text-sm font-semibold text-gray-700"
                  >
                    <TimeRangeFilter
                      fromTime={clockInFrom}
                      toTime={clockInTo}
                      onFromChange={setClockInFrom}
                      onToChange={setClockInTo}
                    />
                  </FilterableTableHeader>

                  <FilterableTableHeader
                    label="Clock Out"
                    isActive={isClockOutFilterActive}
                    onClear={clearClockOutFilter}
                    className="text-sm font-semibold text-gray-700"
                  >
                    <TimeRangeFilter
                      fromTime={clockOutFrom}
                      toTime={clockOutTo}
                      onFromChange={setClockOutFrom}
                      onToChange={setClockOutTo}
                    />
                  </FilterableTableHeader>

                  <FilterableTableHeader
                    label="Duration"
                    isActive={isDurationFilterActive}
                    onClear={clearDurationFilter}
                    className="text-sm font-semibold text-gray-700"
                  >
                    <DurationFilter
                      minHours={durationMinHours}
                      minMinutes={durationMinMins}
                      maxHours={durationMaxHours}
                      maxMinutes={durationMaxMins}
                      onMinHoursChange={setDurationMinHours}
                      onMinMinutesChange={setDurationMinMins}
                      onMaxHoursChange={setDurationMaxHours}
                      onMaxMinutesChange={setDurationMaxMins}
                    />
                  </FilterableTableHeader>

                  <FilterableTableHeader
                    label="Status"
                    isActive={isStatusFilterActive}
                    onClear={clearStatusFilter}
                    className="text-sm font-semibold text-gray-700"
                  >
                    <CheckboxFilter
                      options={statusOptions}
                      selectedValues={selectedStatuses}
                      onChange={setSelectedStatuses}
                    />
                  </FilterableTableHeader>
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift) => (
                  <tr key={shift.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {formatDateTime(shift.clock_in).split(' ')[0]}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {formatTime(shift.clock_in)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {shift.clock_out ? formatTime(shift.clock_out) : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {shift.clock_out ? calculateDuration(shift.clock_in, shift.clock_out) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          shift.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : shift.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {shift.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
