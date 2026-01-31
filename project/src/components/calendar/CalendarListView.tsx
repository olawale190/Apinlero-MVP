// Calendar List View Component - Agenda/list view

import { TrendingUp, Package, Clock } from 'lucide-react';
import { CalendarEvent, Product, StockRecommendation } from './types';
import { getUrgencyColor, getUrgencyBadge, checkStockReadiness, formatDate } from '../../lib/calendar';

interface CalendarListViewProps {
  events: CalendarEvent[];
  products: Product[];
  onEventClick: (event: CalendarEvent) => void;
}

export default function CalendarListView({
  events,
  products,
  onEventClick,
}: CalendarListViewProps) {
  // Group events by date
  const groupedEvents = events.reduce((groups, event) => {
    const date = new Date(event.start_datetime).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {} as Record<string, CalendarEvent[]>);

  const sortedDates = Object.keys(groupedEvents).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <Clock className="mx-auto text-gray-400 mb-3" size={48} />
        <h3 className="text-lg font-semibold text-gray-700 mb-1">No events found</h3>
        <p className="text-gray-500 text-sm">
          There are no events in the selected time range.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((dateStr) => {
        const date = new Date(dateStr);
        const dayEvents = groupedEvents[dateStr];

        return (
          <div key={dateStr}>
            {/* Date header */}
            <div className="sticky top-0 bg-gray-50 px-3 py-2 rounded-lg mb-3 z-10">
              <h3 className="font-semibold text-gray-800">
                {formatDate(date, 'full')}
              </h3>
              <p className="text-sm text-gray-500">{dayEvents.length} event(s)</p>
            </div>

            {/* Events for this date */}
            <div className="space-y-3">
              {dayEvents.map((event) => {
                const daysUntil = event.daysUntil || 0;
                const urgencyBadge = getUrgencyBadge(daysUntil);
                const stockReadiness =
                  event.event_type === 'cultural_event'
                    ? checkStockReadiness(event, products)
                    : null;

                return (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className={`w-full text-left border-l-4 rounded-lg p-4 transition-all hover:shadow-md ${getUrgencyColor(daysUntil)}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {event.emoji && <span className="text-2xl">{event.emoji}</span>}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-gray-800">{event.title}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${urgencyBadge.className}`}>
                              {urgencyBadge.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {!event.all_day && (
                              <>
                                {new Date(event.start_datetime).toLocaleTimeString('en-GB', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                                {event.end_datetime && (
                                  <>
                                    {' - '}
                                    {new Date(event.end_datetime).toLocaleTimeString('en-GB', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </>
                                )}
                                {' • '}
                              </>
                            )}
                            {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                          </p>
                          {event.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right side info */}
                      <div className="text-right flex-shrink-0">
                        {event.event_type === 'cultural_event' && event.expected_increase && (
                          <div className="flex items-center gap-1 text-green-600">
                            <TrendingUp size={16} />
                            <span className="font-semibold">+{event.expected_increase}%</span>
                          </div>
                        )}
                        {stockReadiness && (
                          <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                            <Package size={14} />
                            <span>{stockReadiness.percentage}% ready</span>
                          </div>
                        )}
                        {event.event_type === 'delivery_slot' && event.max_bookings && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">
                              {event.current_bookings || 0}/{event.max_bookings}
                            </span>
                            <span className="text-gray-500 ml-1">booked</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Affected products tags */}
                    {event.affected_products && event.affected_products.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {event.affected_products.slice(0, 5).map((product, idx) => (
                          <span
                            key={idx}
                            className="bg-white text-gray-600 text-xs px-2 py-0.5 rounded border border-gray-200"
                          >
                            {product}
                          </span>
                        ))}
                        {event.affected_products.length > 5 && (
                          <span className="text-xs text-gray-400">
                            +{event.affected_products.length - 5} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Communities */}
                    {event.communities && event.communities.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {event.communities.slice(0, 3).map((community, idx) => (
                          <span
                            key={idx}
                            className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full"
                          >
                            {community}
                          </span>
                        ))}
                        {event.communities.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{event.communities.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
