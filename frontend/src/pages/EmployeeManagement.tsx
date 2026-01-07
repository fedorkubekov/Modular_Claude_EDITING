import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { EmployeeList } from '@/components/EmployeeList';
import { WeeklyCalendar } from '@/components/WeeklyCalendar';
import { ShiftModal } from '@/components/ShiftModal';
import type { ShiftWithUserInfo, EmployeeWithStats, ShiftFilters } from '@/types';
import { formatDateTime, formatTime, calculateDuration } from '@/utils/format';
import { format, subDays, startOfWeek, addWeeks } from 'date-fns';
import { FilterableTableHeader } from '@/components/filters/FilterableTableHeader';
import { MultiSelectFilter } from '@/components/filters/MultiSelectFilter';
import { CheckboxFilter } from '@/components/filters/CheckboxFilter';
import { DateRangeFilter } from '@/components/filters/DateRangeFilter';
import { TimeRangeFilter } from '@/components/filters/TimeRangeFilter';
import { DurationFilter } from '@/components/filters/DurationFilter';
import { TextSearchFilter } from '@/components/filters/TextSearchFilter';

export const EmployeeManagement = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<ShiftWithUserInfo[]>([]);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Calendar state
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [weekShifts, setWeekShifts] = useState<ShiftWithUserInfo[]>([]);
  const [employees, setEmployees] = useState<EmployeeWithStats[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState<Date | undefined>();
  const [modalInitialHour, setModalInitialHour] = useState<number>(9);
  const [modalInitialMinute, setModalInitialMinute] = useState<number>(0);
  const [selectedShift, setSelectedShift] = useState<ShiftWithUserInfo | undefined>();

  // Filter state
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
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
  const [notesSearch, setNotesSearch] = useState('');

  const roleOptions = ['employee', 'manager', 'admin'];
  const statusOptions = ['assigned', 'in_progress', 'completed'];

  // Prepare employee options for multi-select filter
  const employeeOptions = useMemo(() => {
    return employees.map((emp) => ({
      id: emp.id,
      label: `${emp.full_name} (@${emp.username})`,
    }));
  }, [employees]);

  useEffect(() => {
    loadShifts();
    loadEmployees();
  }, []);

  useEffect(() => {
    loadWeekShifts();
  }, [currentWeekStart]);

  const loadShifts = async () => {
    setIsLoading(true);
    setError('');

    try {
      const filters: ShiftFilters = {};

      // Employee filter
      if (selectedEmployeeIds.length > 0) {
        filters.userIds = selectedEmployeeIds;
      }

      // Role filter
      if (selectedRoles.length > 0) {
        filters.roles = selectedRoles;
      }

      // Status filter
      if (selectedStatuses.length > 0) {
        filters.statuses = selectedStatuses;
      }

      // Notes search
      if (notesSearch.trim()) {
        filters.notesSearch = notesSearch.trim();
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
        const fromDate = dateFrom || startDate;
        filters.clockOutFrom = `${fromDate}T${clockOutFrom}:00Z`;
      }
      if (clockOutTo) {
        const toDate = dateTo || dateFrom || endDate;
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

      const response = await api.getAllShifts(startDate, endDate, 100, 0, filters);
      setShifts(response.shifts || []);
    } catch (err) {
      setError(api.getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await api.getEmployees();
      setEmployees(response.employees || []);
    } catch (err) {
      setError(api.getErrorMessage(err));
    }
  };

  const loadWeekShifts = async () => {
    try {
      const weekStart = format(currentWeekStart, 'yyyy-MM-dd');
      const response = await api.getWeekShifts(weekStart);
      setWeekShifts(response.shifts || []);
    } catch (err) {
      setError(api.getErrorMessage(err));
    }
  };

  const handleFilterChange = () => {
    loadShifts();
  };

  // Reload shifts when filters change
  useEffect(() => {
    loadShifts();
  }, [
    selectedEmployeeIds,
    selectedRoles,
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
    notesSearch,
  ]);

  // Check if filters are active
  const isEmployeeFilterActive = selectedEmployeeIds.length > 0;
  const isRoleFilterActive = selectedRoles.length > 0;
  const isDateFilterActive = dateFrom !== '';
  const isClockInFilterActive = clockInFrom !== '' || clockInTo !== '';
  const isClockOutFilterActive = clockOutFrom !== '' || clockOutTo !== '';
  const isDurationFilterActive = durationMinHours > 0 || durationMinMins > 0 ||
                                   durationMaxHours < 23 || durationMaxMins < 59;
  const isStatusFilterActive = selectedStatuses.length > 0;
  const isNotesFilterActive = notesSearch.trim() !== '';

  // Clear filter functions
  const clearEmployeeFilter = () => setSelectedEmployeeIds([]);
  const clearRoleFilter = () => setSelectedRoles([]);
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
  const clearStatusFilter = () => setSelectedStatuses([]);
  const clearNotesFilter = () => setNotesSearch('');

  const handlePreviousWeek = () => {
    setCurrentWeekStart((prev) => addWeeks(prev, -1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => addWeeks(prev, 1));
  };

  const handleTimeSlotClick = (date: Date, hour: number, minute: number) => {
    setSelectedShift(undefined);
    setModalInitialDate(date);
    setModalInitialHour(hour);
    setModalInitialMinute(minute);
    setIsModalOpen(true);
  };

  const handleShiftClick = (shift: ShiftWithUserInfo) => {
    setSelectedShift(shift);
    setModalInitialDate(undefined);
    setIsModalOpen(true);
  };

  const handleCreateParallelShift = () => {
    if (!selectedShift) return;

    // Extract date and time from the selected shift
    const clockInDate = new Date(selectedShift.clock_in);

    setSelectedShift(undefined);
    setModalInitialDate(clockInDate);
    setModalInitialHour(clockInDate.getHours());
    setModalInitialMinute(clockInDate.getMinutes());
    setIsModalOpen(true);
  };

  const handleSaveShift = async (data: {
    userId: number;
    clockIn: string;
    clockOut: string;
  }) => {
    if (selectedShift) {
      // Update existing shift
      await api.updateShift(selectedShift.id, {
        clock_in: data.clockIn,
        clock_out: data.clockOut,
      });
    } else {
      // Create new shift
      await api.assignShift({
        user_id: data.userId,
        clock_in: data.clockIn,
        clock_out: data.clockOut,
      });
    }
    await loadWeekShifts();
  };

  const handleDeleteShift = async () => {
    if (selectedShift) {
      await api.deleteShift(selectedShift.id);
      await loadWeekShifts();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
        <p className="text-gray-600">Manage employees and view their attendance</p>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Employee List */}
      <EmployeeList />

      {/* Weekly Calendar */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Weekly Schedule</h2>
        <WeeklyCalendar
          shifts={weekShifts}
          currentWeekStart={currentWeekStart}
          onPreviousWeek={handlePreviousWeek}
          onNextWeek={handleNextWeek}
          onTimeSlotClick={handleTimeSlotClick}
          onShiftClick={handleShiftClick}
          currentUserId={user?.id}
          isManager={true}
        />
      </div>

      {/* Shift Modal */}
      <ShiftModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveShift}
        onDelete={selectedShift ? handleDeleteShift : undefined}
        onCreateParallel={selectedShift ? handleCreateParallelShift : undefined}
        employees={employees}
        initialDate={modalInitialDate}
        initialHour={modalInitialHour}
        initialMinute={modalInitialMinute}
        existingShift={selectedShift}
        isManager={true}
      />

      {/* Date Range Filter for Shifts */}
      <Card title="Filter Employee Shifts">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Button onClick={handleFilterChange} isLoading={isLoading}>
            Apply Filter
          </Button>
        </div>
      </Card>

      {/* All Employee Shifts Table */}
      <Card title="All Employee Shifts">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading shifts...</p>
          </div>
        ) : shifts.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No shifts found for this period</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <FilterableTableHeader
                    label="Employee"
                    isActive={isEmployeeFilterActive}
                    onClear={clearEmployeeFilter}
                    className="text-sm font-semibold text-gray-700"
                  >
                    <MultiSelectFilter
                      options={employeeOptions}
                      selectedIds={selectedEmployeeIds}
                      onChange={setSelectedEmployeeIds}
                      searchPlaceholder="Search employees..."
                    />
                  </FilterableTableHeader>

                  <FilterableTableHeader
                    label="Role"
                    isActive={isRoleFilterActive}
                    onClear={clearRoleFilter}
                    className="text-sm font-semibold text-gray-700"
                  >
                    <CheckboxFilter
                      options={roleOptions}
                      selectedValues={selectedRoles}
                      onChange={setSelectedRoles}
                    />
                  </FilterableTableHeader>

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

                  <FilterableTableHeader
                    label="Notes"
                    isActive={isNotesFilterActive}
                    onClear={clearNotesFilter}
                    className="text-sm font-semibold text-gray-700"
                  >
                    <TextSearchFilter
                      value={notesSearch}
                      onChange={setNotesSearch}
                      placeholder="Search in notes..."
                    />
                  </FilterableTableHeader>
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift) => (
                  <tr key={shift.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{shift.full_name}</p>
                        <p className="text-xs text-gray-500">@{shift.username}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {shift.role}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {formatDateTime(shift.clock_in).split(',')[0]}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {formatTime(shift.clock_in)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {shift.clock_out ? formatTime(shift.clock_out) : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {shift.clock_out ? calculateDuration(shift.clock_in, shift.clock_out) : (
                        <span className="text-blue-600">In Progress</span>
                      )}
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
                    <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                      {shift.notes || '-'}
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
