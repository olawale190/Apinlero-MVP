// Event Card Component - Displays a single event

import { CalendarEvent, EVENT_TYPE_COLORS } from './types';
import { getEventColor, formatDate } from '../../lib/calendar';

interface EventCardProps {
  event: CalendarEvent;
  compact?: boolean;
  onClick?: () => void;
}

export default function EventCard({ event, compact = false, onClick }: EventCardProps) {
  const color = getEventColor(event);

  if (compact) {
    // Compact version for calendar grid cells
    return (
      <button
        onClick={onClick}
        className="w-full text-left px-1.5 py-0.5 rounded text-xs truncate hover:opacity-80 transition-opacity"
        style={{ backgroundColor: `${color}20`, color: color, borderLeft: `2px solid ${color}` }}
      >
        {event.emoji && <span className="mr-1">{event.emoji}</span>}
        {event.title}
      </button>
    );
  }

  // Full version for list view
  const formatTime = (datetime: string) => {
    const date = new Date(datetime);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-all"
      style={{ borderLeftWidth: '4px', borderLeftColor: color }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {event.emoji && <span className="text-lg">{event.emoji}</span>}
            <h4 className="font-semibold text-gray-800 truncate">{event.title}</h4>
          </div>
          <p className="text-sm text-gray-500">
            {formatDate(event.start_datetime)}
            {!event.all_day && ` • ${formatTime(event.start_datetime)}`}
            {event.end_datetime && !event.all_day && ` - ${formatTime(event.end_datetime)}`}
          </p>
          {event.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
          )}
        </div>

        {/* Event type badge */}
        <span
          className="px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
          style={{ backgroundColor: `${color}20`, color: color }}
        >
          {event.event_type.replace('_', ' ')}
        </span>
      </div>

      {/* Cultural event extras */}
      {event.event_type === 'cultural_event' && event.expected_increase && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-green-600 text-sm font-medium">
            +{event.expected_increase}% demand
          </span>
          {event.communities && event.communities.length > 0 && (
            <span className="text-xs text-gray-500">
              • {event.communities.slice(0, 2).join(', ')}
              {event.communities.length > 2 && ` +${event.communities.length - 2}`}
            </span>
          )}
        </div>
      )}

      {/* Delivery slot extras */}
      {event.event_type === 'delivery_slot' && event.max_bookings && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Bookings</span>
            <span className="font-medium">
              {event.current_bookings || 0} / {event.max_bookings}
            </span>
          </div>
          <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${((event.current_bookings || 0) / event.max_bookings) * 100}%`,
                backgroundColor: color,
              }}
            />
          </div>
        </div>
      )}
    </button>
  );
}
