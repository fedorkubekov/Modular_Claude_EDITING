import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { WeeklyCalendar } from '@/components/WeeklyCalendar';
import { ShiftModal } from '@/components/ShiftModal';
import type { ShiftWithUserInfo } from '@/types';
import { format, startOfWeek, addWeeks } from 'date-fns';

const SHIFT_TIMES: Record<string, string> = {
  'First Shift': '(8:00-17:00)',
  'Second Shift': '(12:00-21:00)',
  'Third Shift': '(21:00-6:00)',
};

export const MySchedule = () => {
  const { user } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [weekShifts, setWeekShifts] = useState<ShiftWithUserInfo[]>([]);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<ShiftWithUserInfo | undefined>();

  useEffect(() => {
    loadWeekShifts();
  }, [currentWeekStart]);

  const loadWeekShifts = async () => {
    try {
      const weekStart = format(currentWeekStart, 'yyyy-MM-dd');
      const response = await api.getWeekShifts(weekStart);
      setWeekShifts(response.shifts || []);
    } catch (err) {
      setError(api.getErrorMessage(err));
    }
  };

  const handlePreviousWeek = () => {
    setCurrentWeekStart((prev) => addWeeks(prev, -1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => addWeeks(prev, 1));
  };

  const handleShiftClick = (shift: ShiftWithUserInfo) => {
    setSelectedShift(shift);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
        <p className="text-gray-600">View your employment information and assigned shift</p>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Schedule Information Card */}
      <Card title="My Schedule Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-2">Employment Type</p>
            <p className="text-2xl font-semibold text-blue-900">{user?.employment_type}</p>
            <p className="text-sm text-gray-600 mt-3">
              Your current employment classification
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <p className="text-sm text-gray-600 mb-2">Assigned Shift</p>
            <p className="text-2xl font-semibold text-green-900">
              {user?.shift_type}
            </p>
            <p className="text-lg text-gray-700 mt-1">
              {SHIFT_TIMES[user?.shift_type || 'First Shift']}
            </p>
            <p className="text-sm text-gray-600 mt-3">
              Your designated work hours
            </p>
          </div>
        </div>
      </Card>

      {/* Weekly Calendar */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Weekly Schedule</h2>
        <WeeklyCalendar
          shifts={weekShifts}
          currentWeekStart={currentWeekStart}
          onPreviousWeek={handlePreviousWeek}
          onNextWeek={handleNextWeek}
          onShiftClick={handleShiftClick}
          currentUserId={user?.id}
          isManager={false}
        />
      </div>

      {/* Shift Modal (read-only for employees) */}
      <ShiftModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={async () => {}}
        employees={[]}
        existingShift={selectedShift}
        isManager={false}
      />

      {/* Additional Information */}
      <Card title="Schedule Details">
        <div className="space-y-4">
          <div className="border-b border-gray-200 pb-4">
            <h3 className="font-semibold text-gray-900 mb-2">Shift Times</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">First Shift</p>
                <p className="font-medium text-gray-900">8:00 AM - 5:00 PM</p>
              </div>
              <div>
                <p className="text-gray-600">Second Shift</p>
                <p className="font-medium text-gray-900">12:00 PM - 9:00 PM</p>
              </div>
              <div>
                <p className="text-gray-600">Third Shift</p>
                <p className="font-medium text-gray-900">9:00 PM - 6:00 AM</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Employment Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                <div>
                  <p className="font-medium text-gray-900">Full-Time</p>
                  <p className="text-gray-600">Regular full-time employment</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                <div>
                  <p className="font-medium text-gray-900">Part-Time</p>
                  <p className="text-gray-600">Part-time employment</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                <div>
                  <p className="font-medium text-gray-900">Seasonal</p>
                  <p className="text-gray-600">Seasonal workers</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                <div>
                  <p className="font-medium text-gray-900">Temporary</p>
                  <p className="text-gray-600">Temporary positions</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                <div>
                  <p className="font-medium text-gray-900">On-Call</p>
                  <p className="text-gray-600">On-call employees</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
