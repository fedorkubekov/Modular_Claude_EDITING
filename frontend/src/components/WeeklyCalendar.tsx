import { useState, useMemo } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import type { ShiftWithUserInfo } from '@/types';
import { Button } from './ui/Button';

interface WeeklyCalendarProps {
  shifts: ShiftWithUserInfo[];
  currentWeekStart: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onTimeSlotClick?: (date: Date, hour: number, minute: number) => void;
  onShiftClick?: (shift: ShiftWithUserInfo) => void;
  currentUserId?: number;
  isManager?: boolean;
}

interface ShiftBlock {
  shift: ShiftWithUserInfo;
  top: number;
  height: number;
  color: string;
  column: number;
}

export const WeeklyCalendar = ({
  shifts,
  currentWeekStart,
  onPreviousWeek,
  onNextWeek,
  onTimeSlotClick,
  onShiftClick,
  currentUserId,
  isManager = false,
}: WeeklyCalendarProps) => {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  // Generate hours array (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Generate week days
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  // Calculate shift blocks with positioning
  const shiftBlocks = useMemo(() => {
    const blocks: ShiftBlock[] = [];

    shifts.forEach((shift) => {
      const clockIn = new Date(shift.clock_in);
      const clockOut = shift.clock_out ? new Date(shift.clock_out) : new Date();

      // Find which day column this shift belongs to
      const column = weekDays.findIndex((day) => isSameDay(day, clockIn));
      if (column === -1) return; // Shift not in current week

      // Calculate position and height (each hour = 60px, 30min = 30px)
      const startHour = clockIn.getHours();
      const startMinute = clockIn.getMinutes();
      const top = startHour * 60 + startMinute; // pixels from top

      const endHour = clockOut.getHours();
      const endMinute = clockOut.getMinutes();
      const endPosition = endHour * 60 + endMinute;
      const height = endPosition - top;

      // Determine color
      let color = '';
      if (isManager) {
        // Manager view: green for completed, blue for assigned
        color = shift.status === 'completed' ? 'bg-green-500' : 'bg-blue-500';
      } else {
        // Employee view
        if (shift.user_id === currentUserId) {
          color = shift.status === 'completed' ? 'bg-green-500' : 'bg-blue-500';
        } else {
          color = 'bg-yellow-400';
        }
      }

      blocks.push({
        shift,
        top,
        height,
        color,
        column,
      });
    });

    return blocks;
  }, [shifts, weekDays, isManager, currentUserId]);

  // Group blocks by column and detect overlaps
  const columnBlocks = useMemo(() => {
    const grouped: { [key: number]: ShiftBlock[][] } = {};

    shiftBlocks.forEach((block) => {
      if (!grouped[block.column]) {
        grouped[block.column] = [];
      }

      // Find overlapping group
      let added = false;
      for (const group of grouped[block.column]) {
        const overlaps = group.some((existingBlock) => {
          const blockEnd = block.top + block.height;
          const existingEnd = existingBlock.top + existingBlock.height;
          return !(blockEnd <= existingBlock.top || block.top >= existingEnd);
        });

        if (overlaps) {
          group.push(block);
          added = true;
          break;
        }
      }

      if (!added) {
        grouped[block.column].push([block]);
      }
    });

    return grouped;
  }, [shiftBlocks]);

  const handleTimeSlotClick = (day: Date, hour: number, segment: number) => {
    if (onTimeSlotClick && isManager) {
      const minute = segment * 30;
      onTimeSlotClick(day, hour, minute);
    }
  };

  const getSlotKey = (dayIndex: number, hour: number, segment: number) => {
    return `${dayIndex}-${hour}-${segment}`;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with week navigation */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <Button variant="secondary" size="sm" onClick={onPreviousWeek}>
          ← Previous Week
        </Button>
        <h3 className="text-lg font-semibold text-gray-900">
          Week of {format(currentWeekStart, 'MMMM d, yyyy')}
        </h3>
        <Button variant="secondary" size="sm" onClick={onNextWeek}>
          Next Week →
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Day headers */}
          <div className="flex border-b border-gray-200">
            <div className="w-16 flex-shrink-0"></div>
            {weekDays.map((day, index) => (
              <div
                key={index}
                className="flex-1 min-w-[120px] p-2 text-center border-l border-gray-200"
              >
                <div className="font-semibold text-gray-900">{format(day, 'EEE')}</div>
                <div className="text-sm text-gray-600">{format(day, 'MMM d')}</div>
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="flex relative">
            {/* Time labels column */}
            <div className="w-16 flex-shrink-0">
              {hours.map((hour) => (
                <div key={hour} className="h-[60px] border-b border-gray-100 relative">
                  <span className="absolute -top-2 right-2 text-xs text-gray-500">
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className="flex-1 min-w-[120px] border-l border-gray-200 relative"
              >
                {/* Time slots */}
                {hours.map((hour) => (
                  <div key={hour} className="relative">
                    {/* Two 30-minute segments per hour */}
                    {[0, 1].map((segment) => {
                      const slotKey = getSlotKey(dayIndex, hour, segment);
                      const isHovered = hoveredSlot === slotKey;

                      return (
                        <div
                          key={segment}
                          className={`h-[30px] border-b border-gray-100 cursor-pointer transition-colors ${
                            isHovered && isManager ? 'bg-blue-50' : ''
                          } ${segment === 0 ? 'border-t border-gray-200' : ''}`}
                          onClick={() => handleTimeSlotClick(day, hour, segment)}
                          onMouseEnter={() => isManager && setHoveredSlot(slotKey)}
                          onMouseLeave={() => setHoveredSlot(null)}
                        />
                      );
                    })}
                  </div>
                ))}

                {/* Shift blocks for this column */}
                {columnBlocks[dayIndex]?.map((group, groupIndex) => {
                  const groupWidth = 100 / (group.length || 1);
                  return group.map((block, blockIndex) => (
                    <div
                      key={`${groupIndex}-${blockIndex}`}
                      className={`absolute ${block.color} rounded-lg border-2 border-white overflow-hidden cursor-pointer hover:opacity-80 transition-opacity`}
                      style={{
                        top: `${block.top}px`,
                        height: `${block.height}px`,
                        left: `${blockIndex * groupWidth}%`,
                        width: `${groupWidth}%`,
                        minHeight: '20px',
                      }}
                      onClick={() => onShiftClick?.(block.shift)}
                    >
                      <div className="p-1 text-white text-xs">
                        <div className="font-semibold truncate">{block.shift.full_name}</div>
                        <div className="text-[10px] opacity-90">
                          {format(new Date(block.shift.clock_in), 'HH:mm')} -{' '}
                          {block.shift.clock_out
                            ? format(new Date(block.shift.clock_out), 'HH:mm')
                            : 'Now'}
                        </div>
                      </div>
                    </div>
                  ));
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-700">Completed Shifts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-gray-700">
              {isManager ? 'Assigned Shifts' : 'Your Assigned Shifts'}
            </span>
          </div>
          {!isManager && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span className="text-gray-700">Other Employees</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
