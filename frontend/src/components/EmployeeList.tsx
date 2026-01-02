import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { EmployeeWithStats, EmploymentType, ShiftType } from '@/types';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';

const EMPLOYMENT_TYPES: EmploymentType[] = [
  'Full-Time',
  'Part-Time',
  'Seasonal',
  'Temporary',
  'On-Call',
];

const SHIFT_TYPES: ShiftType[] = [
  'First Shift',
  'Second Shift',
  'Third Shift',
];

const SHIFT_TIMES: Record<ShiftType, string> = {
  'First Shift': '(8:00-17:00)',
  'Second Shift': '(12:00-21:00)',
  'Third Shift': '(21:00-6:00)',
};

export const EmployeeList = () => {
  const [employees, setEmployees] = useState<EmployeeWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    employment_type: EmploymentType;
    shift_type: ShiftType;
  }>({
    employment_type: 'Full-Time',
    shift_type: 'First Shift',
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.getEmployees();
      setEmployees(response.employees);
      setError('');
    } catch (err) {
      setError(api.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee: EmployeeWithStats) => {
    setEditingId(employee.id);
    setEditForm({
      employment_type: employee.employment_type,
      shift_type: employee.shift_type,
    });
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  const handleSave = async (employeeId: number) => {
    try {
      await api.updateEmployeeSchedule(employeeId, editForm);
      setSuccess('Employee schedule updated successfully');
      setEditingId(null);
      await fetchEmployees();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(api.getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center">
          <p className="text-gray-600">Loading employees...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Employee Management</h2>

        {error && (
          <div className="mb-4">
            <Alert variant="error" onClose={() => setError('')}>
              {error}
            </Alert>
          </div>
        )}

        {success && (
          <div className="mb-4">
            <Alert variant="success" onClose={() => setSuccess('')}>
              {success}
            </Alert>
          </div>
        )}

        {employees.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No employees found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Full Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Shift</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Monthly Hours
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{employee.full_name}</p>
                        <p className="text-sm text-gray-500">{employee.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {employee.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {editingId === employee.id ? (
                        <select
                          value={editForm.employment_type}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              employment_type: e.target.value as EmploymentType,
                            })
                          }
                          className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          {EMPLOYMENT_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-gray-900">{employee.employment_type}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {editingId === employee.id ? (
                        <select
                          value={editForm.shift_type}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              shift_type: e.target.value as ShiftType,
                            })
                          }
                          className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          {SHIFT_TYPES.map((shift) => (
                            <option key={shift} value={shift}>
                              {shift} {SHIFT_TIMES[shift]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-gray-900">
                          {employee.shift_type} {SHIFT_TIMES[employee.shift_type]}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-semibold text-gray-900">
                        {employee.monthly_hours.toFixed(1)}h
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {editingId === employee.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleSave(employee.id)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(employee)}
                          className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
};
