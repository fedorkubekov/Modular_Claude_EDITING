import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import type { ShiftReport } from '@/types';
import { formatHours } from '@/utils/format';
import { format, subDays } from 'date-fns';

export const ManagerDashboard = () => {
  const { user } = useAuth();
  const [report, setReport] = useState<ShiftReport | null>(null);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setIsLoading(true);
    setError('');

    try {
      const reportResponse = await api.getReport(startDate, endDate);
      setReport(reportResponse.report);
    } catch (err) {
      setError(api.getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = () => {
    loadReport();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
        <p className="text-gray-600">Attendance Overview for {user?.full_name}</p>
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
