import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import type { Shift } from '@/types';
import { formatDateTime, formatTime, calculateDuration } from '@/utils/format';

export const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const loadActiveShift = async () => {
    try {
      const response = await api.getActiveShift();
      setActiveShift(response.shift);
    } catch (err) {
      console.error('Failed to load active shift:', err);
    }
  };

  const loadShiftHistory = async () => {
    try {
      const response = await api.getMyShifts(10, 0);
      setShifts(response.shifts || []);
    } catch (err) {
      console.error('Failed to load shift history:', err);
    }
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
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Clock In
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Clock Out
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Duration
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
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
