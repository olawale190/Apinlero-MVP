// Calendar Utility Functions

import {
  CalendarEvent,
  RecurrenceRule,
  StockRecommendation,
  StockReadiness,
  Product,
  EventType,
  ViewType,
  EVENT_TYPE_COLORS,
} from '../components/calendar/types';

// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Get the start date for a calendar view
 */
export function getViewStartDate(date: Date, view: ViewType): Date {
  const d = new Date(date);

  switch (view) {
    case 'month':
      // Start of the month, then go back to the previous Sunday
      d.setDate(1);
      const dayOfWeek = d.getDay();
      d.setDate(d.getDate() - dayOfWeek);
      return startOfDay(d);

    case 'week':
      // Start of the week (Sunday)
      const weekDay = d.getDay();
      d.setDate(d.getDate() - weekDay);
      return startOfDay(d);

    case 'day':
      return startOfDay(d);

    case 'list':
      return startOfDay(d);

    default:
      return startOfDay(d);
  }
}

/**
 * Get the end date for a calendar view
 */
export function getViewEndDate(date: Date, view: ViewType): Date {
  const d = new Date(date);

  switch (view) {
    case 'month':
      // End of month, then go forward to the next Saturday
      d.setMonth(d.getMonth() + 1);
      d.setDate(0); // Last day of previous month
      const dayOfWeek = d.getDay();
      d.setDate(d.getDate() + (6 - dayOfWeek));
      return endOfDay(d);

    case 'week':
      // End of the week (Saturday)
      const weekDay = d.getDay();
      d.setDate(d.getDate() + (6 - weekDay));
      return endOfDay(d);

    case 'day':
      return endOfDay(d);

    case 'list':
      // Show 30 days ahead for list view
      d.setDate(d.getDate() + 30);
      return endOfDay(d);

    default:
      return endOfDay(d);
  }
}

/**
 * Get start of day
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day
 */
export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Calculate days until a date
 */
export function daysUntil(date: Date | string): number {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const today = startOfDay(new Date());
  const target = startOfDay(targetDate);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string, format: 'short' | 'long' | 'full' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    case 'long':
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    case 'full':
      return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    default:
      return d.toLocaleDateString('en-GB');
  }
}

/**
 * Format time for display
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Get calendar grid for a month (6 weeks x 7 days)
 */
export function getMonthCalendarDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay(); // 0 = Sunday

  // Go back to the previous Sunday
  const start = new Date(year, month, 1 - startDay);

  // Generate 42 days (6 weeks)
  for (let i = 0; i < 42; i++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }

  return days;
}

// ============================================================================
// RECURRENCE UTILITIES
// ============================================================================

/**
 * Expand recurring events into individual occurrences
 */
export function expandRecurringEvents(
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] {
  const expandedEvents: CalendarEvent[] = [];

  for (const event of events) {
    if (!event.is_recurring || !event.recurrence_rule) {
      // Add non-recurring events that fall within range
      const eventDate = new Date(event.start_datetime);
      if (eventDate >= rangeStart && eventDate <= rangeEnd) {
        expandedEvents.push({
          ...event,
          daysUntil: daysUntil(event.start_datetime),
        });
      }
      continue;
    }

    // Generate occurrences for recurring events
    const occurrences = generateOccurrences(event, rangeStart, rangeEnd);
    expandedEvents.push(...occurrences);
  }

  return expandedEvents.sort(
    (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
  );
}

/**
 * Generate occurrences for a recurring event
 */
export function generateOccurrences(
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] {
  const rule = event.recurrence_rule!;
  const occurrences: CalendarEvent[] = [];
  let currentDate = new Date(event.start_datetime);

  const until = rule.until ? new Date(rule.until) : rangeEnd;
  const maxOccurrences = rule.count || 365;
  let count = 0;

  while (currentDate <= until && currentDate <= rangeEnd && count < maxOccurrences) {
    if (currentDate >= rangeStart) {
      const occurrence: CalendarEvent = {
        ...event,
        id: `${event.id}_${currentDate.toISOString()}`, // Virtual ID for occurrence
        start_datetime: currentDate.toISOString(),
        end_datetime: event.end_datetime
          ? addDuration(currentDate, event.start_datetime, event.end_datetime).toISOString()
          : undefined,
        daysUntil: daysUntil(currentDate),
      };
      occurrences.push(occurrence);
    }

    currentDate = getNextOccurrence(new Date(currentDate), rule);
    count++;
  }

  return occurrences;
}

/**
 * Get the next occurrence date based on recurrence rule
 */
function getNextOccurrence(date: Date, rule: RecurrenceRule): Date {
  const next = new Date(date);
  const interval = rule.interval || 1;

  switch (rule.frequency) {
    case 'daily':
      next.setDate(next.getDate() + interval);
      break;

    case 'weekly':
      next.setDate(next.getDate() + 7 * interval);
      break;

    case 'monthly':
      next.setMonth(next.getMonth() + interval);
      break;

    case 'yearly':
      next.setFullYear(next.getFullYear() + interval);
      break;
  }

  return next;
}

/**
 * Add duration between start and end times to a new date
 */
function addDuration(newStart: Date, originalStart: string, originalEnd: string): Date {
  const start = new Date(originalStart);
  const end = new Date(originalEnd);
  const duration = end.getTime() - start.getTime();
  return new Date(newStart.getTime() + duration);
}

// ============================================================================
// EVENT UTILITIES
// ============================================================================

/**
 * Get color for an event
 */
export function getEventColor(event: CalendarEvent): string {
  if (event.color) return event.color;
  return EVENT_TYPE_COLORS[event.event_type] || '#6B7280';
}

/**
 * Get urgency color based on days until event
 */
export function getUrgencyColor(days: number): string {
  if (days <= 7) return 'border-red-500 bg-red-50';
  if (days <= 14) return 'border-orange-500 bg-orange-50';
  if (days <= 30) return 'border-yellow-500 bg-yellow-50';
  return 'border-gray-200 bg-white';
}

/**
 * Get urgency badge for days until event
 */
export function getUrgencyBadge(days: number): { label: string; className: string } {
  if (days <= 7) return { label: 'Urgent', className: 'bg-red-100 text-red-700' };
  if (days <= 14) return { label: 'Soon', className: 'bg-orange-100 text-orange-700' };
  if (days <= 30) return { label: 'Prepare', className: 'bg-yellow-100 text-yellow-700' };
  return { label: 'Upcoming', className: 'bg-gray-100 text-gray-700' };
}

/**
 * Get events for a specific date
 */
export function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter((event) => {
    const eventDate = new Date(event.start_datetime);
    return isSameDay(eventDate, date);
  });
}

/**
 * Filter events by type
 */
export function filterEventsByType(
  events: CalendarEvent[],
  filter: 'all' | 'business' | 'cultural' | 'delivery' | 'appointment' | 'store_hours'
): CalendarEvent[] {
  if (filter === 'all') return events;

  const typeMap: Record<string, EventType> = {
    business: 'business_event',
    cultural: 'cultural_event',
    delivery: 'delivery_slot',
    appointment: 'appointment',
    store_hours: 'store_hours',
  };

  return events.filter((event) => event.event_type === typeMap[filter]);
}

// ============================================================================
// STOCK UTILITIES
// ============================================================================

/**
 * Check stock readiness for a cultural event
 */
export function checkStockReadiness(
  event: CalendarEvent,
  products: Product[]
): StockReadiness | null {
  if (event.event_type !== 'cultural_event' || !event.stock_recommendations) {
    return null;
  }

  let ready = 0;
  const total = event.stock_recommendations.length;

  event.stock_recommendations.forEach((rec: StockRecommendation) => {
    const product = products.find((p) =>
      p.name.toLowerCase().includes(rec.product.toLowerCase())
    );
    if (product && (product.stock_quantity || 0) >= rec.extraUnits) {
      ready++;
    }
  });

  return {
    ready,
    total,
    percentage: total > 0 ? Math.round((ready / total) * 100) : 0,
  };
}

/**
 * Get stock status for a specific recommendation
 */
export function getStockStatus(
  recommendation: StockRecommendation,
  products: Product[]
): { product: Product | null; currentStock: number; isReady: boolean } {
  const product = products.find((p) =>
    p.name.toLowerCase().includes(recommendation.product.toLowerCase())
  );
  const currentStock = product?.stock_quantity || 0;
  const isReady = currentStock >= recommendation.extraUnits;

  return { product: product || null, currentStock, isReady };
}

// ============================================================================
// DELIVERY SLOT UTILITIES
// ============================================================================

/**
 * Generate delivery slots for a date based on templates
 */
export function generateDeliverySlotsForDate(
  templates: { day_of_week: number; start_time: string; end_time: string; max_bookings: number }[],
  date: Date,
  existingEvents: CalendarEvent[]
): CalendarEvent[] {
  const dayOfWeek = date.getDay();
  const dayTemplates = templates.filter((t) => t.day_of_week === dayOfWeek);

  return dayTemplates.map((template) => {
    const [startHour, startMin] = template.start_time.split(':').map(Number);
    const [endHour, endMin] = template.end_time.split(':').map(Number);

    const startDateTime = new Date(date);
    startDateTime.setHours(startHour, startMin, 0, 0);

    const endDateTime = new Date(date);
    endDateTime.setHours(endHour, endMin, 0, 0);

    // Count existing bookings for this slot
    const existingBookings = existingEvents.filter(
      (e) =>
        e.event_type === 'delivery_slot' &&
        isSameDay(new Date(e.start_datetime), date) &&
        new Date(e.start_datetime).getHours() === startHour
    ).length;

    return {
      id: `slot_${date.toISOString()}_${template.start_time}`,
      business_id: '',
      title: `Delivery Slot`,
      event_type: 'delivery_slot' as EventType,
      start_datetime: startDateTime.toISOString(),
      end_datetime: endDateTime.toISOString(),
      all_day: false,
      timezone: 'Europe/London',
      is_recurring: false,
      status: 'scheduled' as const,
      max_bookings: template.max_bookings,
      current_bookings: existingBookings,
      priority: 0,
      is_public: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });
}

/**
 * Check if a delivery slot is available
 */
export function isSlotAvailable(slot: CalendarEvent): boolean {
  if (!slot.max_bookings) return true;
  return (slot.current_bookings || 0) < slot.max_bookings;
}

/**
 * Get available slots count
 */
export function getAvailableSlotsCount(slot: CalendarEvent): number {
  if (!slot.max_bookings) return Infinity;
  return slot.max_bookings - (slot.current_bookings || 0);
}
