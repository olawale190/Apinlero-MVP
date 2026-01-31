import { describe, it, expect, beforeEach } from 'vitest';
import {
  getViewStartDate,
  getViewEndDate,
  startOfDay,
  endOfDay,
  getDaysInMonth,
  isSameDay,
  isToday,
  daysUntil,
  formatDate,
  formatTime,
  getMonthCalendarDays,
  filterEventsByType,
  getEventColor,
} from './calendar';
import type { CalendarEvent, EventFilter } from '../components/calendar/types';

describe('Calendar Utilities', () => {
  // ============================================================================
  // DATE UTILITIES
  // ============================================================================

  describe('startOfDay', () => {
    it('should return midnight of the given date', () => {
      const date = new Date('2026-01-31T14:30:45.123Z');
      const result = startOfDay(date);

      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should not mutate the original date', () => {
      const original = new Date('2026-01-31T14:30:00Z');
      const originalTime = original.getTime();
      startOfDay(original);

      expect(original.getTime()).toBe(originalTime);
    });
  });

  describe('endOfDay', () => {
    it('should return 23:59:59.999 of the given date', () => {
      const date = new Date('2026-01-31T14:30:00Z');
      const result = endOfDay(date);

      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });
  });

  describe('getDaysInMonth', () => {
    it('should return 31 for January', () => {
      expect(getDaysInMonth(2026, 0)).toBe(31); // January
    });

    it('should return 28 for February in non-leap year', () => {
      expect(getDaysInMonth(2025, 1)).toBe(28); // February 2025
    });

    it('should return 29 for February in leap year', () => {
      expect(getDaysInMonth(2024, 1)).toBe(29); // February 2024
    });

    it('should return 30 for April', () => {
      expect(getDaysInMonth(2026, 3)).toBe(30); // April
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      const date1 = new Date('2026-01-31T10:00:00Z');
      const date2 = new Date('2026-01-31T23:59:59Z');

      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = new Date('2026-01-31T00:00:00Z');
      const date2 = new Date('2026-02-01T00:00:00Z');

      expect(isSameDay(date1, date2)).toBe(false);
    });

    it('should return false for same day different months', () => {
      const date1 = new Date('2026-01-15T00:00:00Z');
      const date2 = new Date('2026-02-15T00:00:00Z');

      expect(isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      const today = new Date();
      expect(isToday(today)).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });

    it('should return false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow)).toBe(false);
    });
  });

  describe('daysUntil', () => {
    it('should return 0 for today', () => {
      const today = new Date();
      expect(daysUntil(today)).toBe(0);
    });

    it('should return positive number for future dates', () => {
      const future = new Date();
      future.setDate(future.getDate() + 5);
      expect(daysUntil(future)).toBe(5);
    });

    it('should return negative number for past dates', () => {
      const past = new Date();
      past.setDate(past.getDate() - 3);
      expect(daysUntil(past)).toBe(-3);
    });

    it('should handle string dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(daysUntil(tomorrow.toISOString())).toBe(1);
    });
  });

  describe('formatDate', () => {
    const testDate = new Date('2026-01-31T12:00:00Z');

    it('should format date in short format', () => {
      const result = formatDate(testDate, 'short');
      expect(result).toMatch(/31.*Jan/i);
    });

    it('should format date in long format', () => {
      const result = formatDate(testDate, 'long');
      expect(result).toMatch(/31.*January.*2026/i);
    });

    it('should format date in full format with weekday', () => {
      const result = formatDate(testDate, 'full');
      expect(result).toMatch(/Saturday.*31.*January.*2026/i);
    });

    it('should handle string dates', () => {
      const result = formatDate('2026-01-31T12:00:00Z', 'short');
      expect(result).toMatch(/31.*Jan/i);
    });
  });

  describe('formatTime', () => {
    it('should format time in 24-hour format', () => {
      const date = new Date('2026-01-31T14:30:00');
      const result = formatTime(date);
      expect(result).toBe('14:30');
    });

    it('should handle string dates', () => {
      const result = formatTime('2026-01-31T09:05:00');
      expect(result).toBe('09:05');
    });
  });

  // ============================================================================
  // VIEW DATE CALCULATIONS
  // ============================================================================

  describe('getViewStartDate', () => {
    it('should return start of week for week view', () => {
      // January 31, 2026 is a Saturday
      const date = new Date('2026-01-31');
      const result = getViewStartDate(date, 'week');

      expect(result.getDay()).toBe(0); // Sunday
      expect(result.getHours()).toBe(0);
    });

    it('should return start of day for day view', () => {
      const date = new Date('2026-01-31T15:30:00');
      const result = getViewStartDate(date, 'day');

      expect(result.getDate()).toBe(31);
      expect(result.getHours()).toBe(0);
    });

    it('should return first Sunday before/on month start for month view', () => {
      // January 2026 starts on Thursday (day 4), so calendar starts Sunday Dec 28, 2025
      const date = new Date('2026-01-15');
      const result = getViewStartDate(date, 'month');

      expect(result.getDay()).toBe(0); // Sunday
      // Since Jan 1 2026 is Thursday, calendar starts Dec 28, 2025
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(11); // December
      expect(result.getDate()).toBe(28);
    });
  });

  describe('getViewEndDate', () => {
    it('should return end of week for week view', () => {
      const date = new Date('2026-01-31');
      const result = getViewEndDate(date, 'week');

      expect(result.getDay()).toBe(6); // Saturday
      expect(result.getHours()).toBe(23);
    });

    it('should return end of day for day view', () => {
      const date = new Date('2026-01-31T10:00:00');
      const result = getViewEndDate(date, 'day');

      expect(result.getDate()).toBe(31);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
    });

    it('should return 30 days ahead for list view', () => {
      const date = new Date('2026-01-31');
      const result = getViewEndDate(date, 'list');

      const daysDiff = Math.round((result.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(29);
      expect(daysDiff).toBeLessThanOrEqual(31);
    });
  });

  describe('getMonthCalendarDays', () => {
    it('should return 42 days (6 weeks)', () => {
      const days = getMonthCalendarDays(2026, 0); // January 2026
      expect(days.length).toBe(42);
    });

    it('should start on Sunday', () => {
      const days = getMonthCalendarDays(2026, 0);
      expect(days[0].getDay()).toBe(0); // Sunday
    });

    it('should include all days of the month', () => {
      const days = getMonthCalendarDays(2026, 0); // January
      const januaryDays = days.filter(d => d.getMonth() === 0);
      expect(januaryDays.length).toBe(31);
    });
  });

  // ============================================================================
  // EVENT FILTERING
  // ============================================================================

  describe('filterEventsByType', () => {
    const mockEvents: CalendarEvent[] = [
      {
        id: '1',
        title: 'Business Meeting',
        event_type: 'business_event',
        start_datetime: '2026-01-31T10:00:00Z',
        business_id: 'test-business',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      {
        id: '2',
        title: 'Eid Celebration',
        event_type: 'cultural_event',
        start_datetime: '2026-03-31T00:00:00Z',
        business_id: 'test-business',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      {
        id: '3',
        title: 'Delivery Slot',
        event_type: 'delivery_slot',
        start_datetime: '2026-01-31T14:00:00Z',
        business_id: 'test-business',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
      {
        id: '4',
        title: 'Store Hours',
        event_type: 'store_hours',
        start_datetime: '2026-01-31T09:00:00Z',
        business_id: 'test-business',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ];

    it('should return all events when filter is "all"', () => {
      const result = filterEventsByType(mockEvents, 'all');
      expect(result.length).toBe(4);
    });

    it('should filter business events', () => {
      const result = filterEventsByType(mockEvents, 'business');
      expect(result.length).toBe(1);
      expect(result[0].event_type).toBe('business_event');
    });

    it('should filter cultural events', () => {
      const result = filterEventsByType(mockEvents, 'cultural');
      expect(result.length).toBe(1);
      expect(result[0].event_type).toBe('cultural_event');
    });

    it('should filter delivery slots', () => {
      const result = filterEventsByType(mockEvents, 'delivery');
      expect(result.length).toBe(1);
      expect(result[0].event_type).toBe('delivery_slot');
    });

    it('should filter store hours', () => {
      const result = filterEventsByType(mockEvents, 'store_hours');
      expect(result.length).toBe(1);
      expect(result[0].event_type).toBe('store_hours');
    });

    it('should return empty array for no matches', () => {
      const result = filterEventsByType(mockEvents, 'appointment');
      expect(result.length).toBe(0);
    });
  });

  // ============================================================================
  // EVENT COLORS
  // ============================================================================

  describe('getEventColor', () => {
    const createMockEvent = (eventType: string, color?: string): CalendarEvent => ({
      id: 'test',
      title: 'Test Event',
      event_type: eventType as any,
      start_datetime: '2026-01-31T10:00:00Z',
      business_id: 'test-business',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      color,
    });

    it('should return correct color for business events', () => {
      const event = createMockEvent('business_event');
      const color = getEventColor(event);
      expect(color).toBe('#3B82F6'); // Blue
    });

    it('should return correct color for cultural events', () => {
      const event = createMockEvent('cultural_event');
      const color = getEventColor(event);
      expect(color).toBe('#F97316'); // Orange
    });

    it('should return correct color for delivery slots', () => {
      const event = createMockEvent('delivery_slot');
      const color = getEventColor(event);
      expect(color).toBe('#10B981'); // Green
    });

    it('should return correct color for appointments', () => {
      const event = createMockEvent('appointment');
      const color = getEventColor(event);
      expect(color).toBe('#8B5CF6'); // Purple
    });

    it('should return correct color for store hours', () => {
      const event = createMockEvent('store_hours');
      const color = getEventColor(event);
      expect(color).toBe('#6B7280'); // Gray
    });

    it('should return custom color if set', () => {
      const event = createMockEvent('business_event', '#FF0000');
      const color = getEventColor(event);
      expect(color).toBe('#FF0000'); // Custom color
    });

    it('should return default color for unknown type', () => {
      const event = createMockEvent('unknown');
      const color = getEventColor(event);
      expect(color).toBe('#6B7280'); // Default gray
    });
  });
});
