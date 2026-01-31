// Calendar Events Hook

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { CalendarEvent, EventType, EventFormData, EventBooking } from '../components/calendar/types';
import { expandRecurringEvents, daysUntil } from '../lib/calendar';

interface UseCalendarEventsOptions {
  startDate: Date;
  endDate: Date;
  eventType?: EventType;
  includeRecurring?: boolean;
  businessId?: string;
  timezone?: string;
}

const DEFAULT_TIMEZONE = 'Europe/London';

interface UseCalendarEventsReturn {
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createEvent: (data: EventFormData) => Promise<CalendarEvent | null>;
  updateEvent: (id: string, data: Partial<CalendarEvent>) => Promise<boolean>;
  deleteEvent: (id: string) => Promise<boolean>;
}

export function useCalendarEvents(options: UseCalendarEventsOptions): UseCalendarEventsReturn {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchEventsRef = useRef<() => Promise<void>>();

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('calendar_events')
        .select('*')
        .gte('start_datetime', options.startDate.toISOString())
        .lte('start_datetime', options.endDate.toISOString())
        .order('start_datetime', { ascending: true });

      if (options.eventType) {
        query = query.eq('event_type', options.eventType);
      }

      if (options.businessId) {
        query = query.eq('business_id', options.businessId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
        setEvents([]);
        return;
      }

      // Also fetch recurring events that started before our range but may have occurrences in range
      let recurringQuery = supabase
        .from('calendar_events')
        .select('*')
        .eq('is_recurring', true)
        .lt('start_datetime', options.startDate.toISOString());

      if (options.eventType) {
        recurringQuery = recurringQuery.eq('event_type', options.eventType);
      }

      if (options.businessId) {
        recurringQuery = recurringQuery.eq('business_id', options.businessId);
      }

      const { data: recurringData } = await recurringQuery;

      // Combine all events
      const allEvents = [...(data || []), ...(recurringData || [])];

      // Expand recurring events and filter to range
      const expandedEvents =
        options.includeRecurring !== false
          ? expandRecurringEvents(allEvents, options.startDate, options.endDate)
          : (data || []).map((e) => ({ ...e, daysUntil: daysUntil(e.start_datetime) }));

      setEvents(expandedEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    options.startDate.getTime(),
    options.endDate.getTime(),
    options.eventType,
    options.businessId,
    options.includeRecurring,
  ]);

  // Keep ref updated with latest fetchEvents
  fetchEventsRef.current = fetchEvents;

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Set up real-time subscription - uses ref to avoid recreating on fetchEvents change
  useEffect(() => {
    const channel = supabase
      .channel('calendar_events_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calendar_events' },
        () => {
          fetchEventsRef.current?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const createEvent = useCallback(
    async (data: EventFormData): Promise<CalendarEvent | null> => {
      try {
        // Build datetime strings
        const startDateTime = data.all_day
          ? `${data.start_date}T00:00:00`
          : `${data.start_date}T${data.start_time}:00`;

        const endDateTime = data.end_date
          ? data.all_day
            ? `${data.end_date}T23:59:59`
            : `${data.end_date}T${data.end_time}:00`
          : null;

        // Build recurrence rule if recurring
        const recurrenceRule = data.is_recurring
          ? {
              frequency: data.recurrence_frequency,
              interval: data.recurrence_interval || 1,
              until: data.recurrence_until || null,
            }
          : null;

        const eventData = {
          business_id: options.businessId,
          title: data.title,
          description: data.description || null,
          event_type: data.event_type,
          start_datetime: startDateTime,
          end_datetime: endDateTime,
          all_day: data.all_day,
          timezone: options.timezone || DEFAULT_TIMEZONE,
          is_recurring: data.is_recurring,
          recurrence_rule: recurrenceRule,
          emoji: data.emoji || null,
          expected_increase: data.expected_increase || null,
          communities: data.communities || null,
          affected_products: data.affected_products || null,
          customer_name: data.customer_name || null,
          customer_phone: data.customer_phone || null,
          customer_email: data.customer_email || null,
          max_bookings: data.max_bookings || 1,
          color: data.color || null,
          is_public: data.is_public,
          status: 'scheduled',
          priority: 0,
        };

        const { data: created, error: createError } = await supabase
          .from('calendar_events')
          .insert([eventData])
          .select()
          .single();

        if (createError) {
          setError(createError.message);
          return null;
        }

        return created;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create event');
        return null;
      }
    },
    [options.businessId]
  );

  const updateEvent = useCallback(async (id: string, data: Partial<CalendarEvent>): Promise<boolean> => {
    try {
      // Handle virtual IDs for recurring event occurrences
      const actualId = id.includes('_') ? id.split('_')[0] : id;

      const { error: updateError } = await supabase
        .from('calendar_events')
        .update(data)
        .eq('id', actualId);

      if (updateError) {
        setError(updateError.message);
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
      return false;
    }
  }, []);

  const deleteEvent = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Handle virtual IDs for recurring event occurrences
      const actualId = id.includes('_') ? id.split('_')[0] : id;

      const { error: deleteError } = await supabase.from('calendar_events').delete().eq('id', actualId);

      if (deleteError) {
        setError(deleteError.message);
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
      return false;
    }
  }, []);

  return {
    events,
    isLoading,
    error,
    refetch: fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}

// Hook for delivery slots
interface UseDeliverySlotsOptions {
  date: Date;
  businessId?: string;
}

export function useDeliverySlots(options: UseDeliverySlotsOptions) {
  const [slots, setSlots] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const startOfDay = new Date(options.date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(options.date);
      endOfDay.setHours(23, 59, 59, 999);

      let query = supabase
        .from('calendar_events')
        .select('*')
        .eq('event_type', 'delivery_slot')
        .gte('start_datetime', startOfDay.toISOString())
        .lte('start_datetime', endOfDay.toISOString())
        .order('start_datetime', { ascending: true });

      if (options.businessId) {
        query = query.eq('business_id', options.businessId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
        setSlots([]);
        return;
      }

      setSlots(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch delivery slots');
      setSlots([]);
    } finally {
      setIsLoading(false);
    }
  }, [options.date.toDateString(), options.businessId]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  return { slots, isLoading, error, refetch: fetchSlots };
}

// Hook for event bookings
interface UseEventBookingsOptions {
  eventId?: string;
  businessId?: string;
}

export function useEventBookings(options: UseEventBookingsOptions) {
  const [bookings, setBookings] = useState<EventBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase.from('event_bookings').select('*').order('booked_at', { ascending: false });

      if (options.eventId) {
        query = query.eq('event_id', options.eventId);
      }

      if (options.businessId) {
        query = query.eq('business_id', options.businessId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
        setBookings([]);
        return;
      }

      setBookings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, [options.eventId, options.businessId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const createBooking = useCallback(
    async (data: {
      event_id: string;
      customer_name: string;
      customer_phone?: string;
      customer_email?: string;
      order_id?: string;
      notes?: string;
    }): Promise<boolean> => {
      try {
        const { error: createError } = await supabase.from('event_bookings').insert([
          {
            ...data,
            status: 'pending',
          },
        ]);

        if (createError) {
          setError(createError.message);
          return false;
        }

        // Update booking count on the event
        await supabase.rpc('increment_booking_count', { event_id: data.event_id });

        await fetchBookings();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create booking');
        return false;
      }
    },
    [fetchBookings]
  );

  return { bookings, isLoading, error, refetch: fetchBookings, createBooking };
}
