import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { ShiftWithUserInfo, EmployeeWithStats } from '@/types';
import { Button } from './ui/Button';
import { Alert } from './ui/Alert';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    userId: number;
    clockIn: string;
    clockOut: string;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  employees: EmployeeWithStats[];
  initialDate?: Date;
  initialHour?: number;
  initialMinute?: number;
  existingShift?: ShiftWithUserInfo;
  isManager: boolean;
}

export const ShiftModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  employees,
  initialDate,
  initialHour = 9,
  initialMinute = 0,
  existingShift,
  isManager,
}: ShiftModalProps) => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (existingShift) {
        // Editing existing shift
        setSelectedUserId(existingShift.user_id);
        const clockInDate = new Date(existingShift.clock_in);
        const clockOutDate = existingShift.clock_out
          ? new Date(existingShift.clock_out)
          : new Date();

        setDate(format(clockInDate, 'yyyy-MM-dd'));
        setStartTime(format(clockInDate, 'HH:mm'));
        setEndTime(format(clockOutDate, 'HH:mm'));
      } else if (initialDate) {
        // Creating new shift
        setSelectedUserId(employees[0]?.id || null);
        setDate(format(initialDate, 'yyyy-MM-dd'));
        const startHour = initialHour.toString().padStart(2, '0');
        const startMinuteStr = initialMinute.toString().padStart(2, '0');
        setStartTime(`${startHour}:${startMinuteStr}`);

        // Default end time is 8 hours later
        const endHourNum = (initialHour + 8) % 24;
        const endHour = endHourNum.toString().padStart(2, '0');
        setEndTime(`${endHour}:${startMinuteStr}`);
      }
      setError('');
    }
  }, [isOpen, existingShift, initialDate, initialHour, initialMinute, employees]);

  const handleSave = async () => {
    if (!selectedUserId) {
      setError('Please select an employee');
      return;
    }

    if (!date || !startTime || !endTime) {
      setError('Please fill in all fields');
      return;
    }

    // Validate end time is after start time
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      setError('End time must be after start time');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Combine date and time into ISO strings
      const clockIn = new Date(`${date}T${startTime}:00`).toISOString();
      const clockOut = new Date(`${date}T${endTime}:00`).toISOString();

      await onSave({
        userId: selectedUserId,
        clockIn,
        clockOut,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save shift');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    if (!confirm('Are you sure you want to delete this shift?')) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete shift');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedEmployee = employees.find((e) => e.id === selectedUserId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {existingShift ? 'Edit Shift' : 'Assign New Shift'}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {error && (
            <Alert variant="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Employee Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee *
            </label>
            <select
              value={selectedUserId || ''}
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
              disabled={!isManager || !!existingShift}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
            >
              <option value="">Select employee...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.username})
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={!isManager}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
            />
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Time *
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={!isManager}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
            />
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Time *
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={!isManager}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
            />
          </div>

          {/* Confirmation Display */}
          {selectedEmployee && date && startTime && endTime && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900 mb-2">Shift Summary:</p>
              <div className="text-sm text-blue-800 space-y-1">
                <p>
                  <span className="font-medium">Employee:</span> {selectedEmployee.full_name}
                </p>
                <p>
                  <span className="font-medium">Date:</span>{' '}
                  {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                </p>
                <p>
                  <span className="font-medium">Time:</span> {startTime} - {endTime}
                </p>
                <p>
                  <span className="font-medium">Duration:</span>{' '}
                  {(() => {
                    const [startHour, startMin] = startTime.split(':').map(Number);
                    const [endHour, endMin] = endTime.split(':').map(Number);
                    const durationMinutes =
                      endHour * 60 + endMin - (startHour * 60 + startMin);
                    const hours = Math.floor(durationMinutes / 60);
                    const minutes = durationMinutes % 60;
                    return `${hours}h ${minutes}m`;
                  })()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <div>
            {existingShift && isManager && onDelete && (
              <Button
                variant="secondary"
                onClick={handleDelete}
                isLoading={isLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            {isManager && (
              <Button onClick={handleSave} isLoading={isLoading}>
                {existingShift ? 'Update' : 'Create'} Shift
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
