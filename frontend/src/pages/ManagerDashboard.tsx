import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { EmployeeList } from '@/components/EmployeeList';
import type { ShiftWithUserInfo, ShiftReport } from '@/types';
import { formatDateTime, formatTime, calculateDuration, formatHours } from '@/utils/format';
import { format, subDays } from 'date-fns';

export const ManagerDashboard = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<ShiftWithUserInfo[]>([]);
  const [report, setReport] = useState<ShiftReport | null>(null);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [shiftsResponse, reportResponse] = await Promise.all([
        api.getAllShifts(startDate, endDate),
        api.getReport(startDate, endDate),
      ]);

      setShifts(shiftsResponse.shifts || []);
      setReport(reportResponse.report);
    } catch (err) {
      setError(api.getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = () => {
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Manager Dashboard
          </h1>
          <p className="text-gray-600">Attendance Overview for {user?.full_name}</p>
        </div>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Date Range Filter */}
      <Card title="Filter by Date Range">
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

      {/* Statistics Cards */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Shifts</p>
              <p className="text-3xl font-bold text-gray-900">{report.total_shifts}</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-600">{report.completed_shifts}</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Active Now</p>
              <p className="text-3xl font-bold text-blue-600">{report.active_shifts}</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Hours</p>
              <p className="text-3xl font-bold text-primary-600">
                {formatHours(report.total_hours)}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Employee Management */}
      <EmployeeList />

      {/* All Shifts Table */}
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
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Employee
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Role
                  </th>
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
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Notes
                  </th>
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

      {/* Summary Statistics */}
      {report && report.completed_shifts > 0 && (
        <Card title="Period Summary">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Average Hours per Shift</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatHours(report.average_hours)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {((report.completed_shifts / report.total_shifts) * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Date Range</p>
              <p className="text-sm font-medium text-gray-900">
                {startDate} to {endDate}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
