// Calendar Grid Component - Month view

import { CalendarEvent, DAY_NAMES_SHORT } from './types';
import { getMonthCalendarDays, isSameDay, isToday, getEventsForDate } from '../../lib/calendar';
import EventCard from './EventCard';

interface CalendarGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export default function CalendarGrid({
  currentDate,
  events,
  onDateSelect,
  onEventClick,
}: CalendarGridProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getMonthCalendarDays(year, month);

  const isCurrentMonth = (date: Date) => date.getMonth() === month;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {DAY_NAMES_SHORT.map((day) => (
          <div
            key={day}
            className="py-2 px-1 text-center text-xs font-semibold text-gray-600 uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayEvents = getEventsForDate(events, day);
          const isCurrentMonthDay = isCurrentMonth(day);
          const isTodayDate = isToday(day);

          return (
            <div
              key={index}
              className={`min-h-[100px] border-b border-r border-gray-100 p-1 ${
                !isCurrentMonthDay ? 'bg-gray-50' : ''
              } ${index % 7 === 6 ? 'border-r-0' : ''}`}
            >
              {/* Date number */}
              <button
                onClick={() => onDateSelect(day)}
                className={`w-7 h-7 flex items-center justify-center rounded-full text-sm mb-1 transition-colors ${
                  isTodayDate
                    ? 'bg-teal-600 text-white font-bold'
                    : isCurrentMonthDay
                    ? 'text-gray-800 hover:bg-gray-100'
                    : 'text-gray-400 hover:bg-gray-100'
                }`}
              >
                {day.getDate()}
              </button>

              {/* Events */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    compact
                    onClick={() => onEventClick(event)}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <button
                    onClick={() => onDateSelect(day)}
                    className="w-full text-left px-1.5 py-0.5 text-xs text-gray-500 hover:text-gray-700"
                  >
                    +{dayEvents.length - 3} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
