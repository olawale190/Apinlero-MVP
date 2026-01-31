// Delivery Slot Picker - Customer-facing component for selecting delivery times

import { useState, useEffect, useMemo } from 'react';
import { Clock, Check, Truck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CalendarEvent, DeliverySlotTemplate, DAY_NAMES_SHORT } from './types';
import { isSlotAvailable, getAvailableSlotsCount } from '../../lib/calendar';

const DEFAULT_TIMEZONE = 'Europe/London';

interface DeliverySlotPickerProps {
  selectedDate?: Date;
  onSlotSelect: (slot: CalendarEvent | null) => void;
  selectedSlot?: CalendarEvent | null;
  businessId?: string;
  timezone?: string;
}

export default function DeliverySlotPicker({
  selectedDate: initialDate,
  onSlotSelect,
  selectedSlot,
  businessId,
  timezone = DEFAULT_TIMEZONE,
}: DeliverySlotPickerProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date());
  const [templates, setTemplates] = useState<DeliverySlotTemplate[]>([]);
  const [existingBookings, setExistingBookings] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get next 7 days
  const next7Days = useMemo(() => {
    const days: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from tomorrow
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  }, []);

  // Load delivery slot templates
  useEffect(() => {
    loadTemplates();
  }, []);

  // Load existing bookings when date changes
  useEffect(() => {
    loadExistingBookings();
  }, [selectedDate]);

  // Clear selected slot when date changes (#8)
  useEffect(() => {
    if (selectedSlot) {
      const slotDate = new Date(selectedSlot.start_datetime).toDateString();
      if (slotDate !== selectedDate.toDateString()) {
        onSlotSelect(null);
      }
    }
  }, [selectedDate, selectedSlot, onSlotSelect]);

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('delivery_slot_templates')
      .select('*')
      .eq('is_active', true)
      .order('start_time', { ascending: true });

    if (!error && data) {
      setTemplates(data);
    }
  };

  const loadExistingBookings = async () => {
    setIsLoading(true);

    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('event_type', 'delivery_slot')
      .gte('start_datetime', startOfDay.toISOString())
      .lte('start_datetime', endOfDay.toISOString());

    if (!error && data) {
      setExistingBookings(data);
    }

    setIsLoading(false);
  };

  // Generate available slots for selected date
  const availableSlots = useMemo(() => {
    const dayOfWeek = selectedDate.getDay();
    const dayTemplates = templates.filter((t) => t.day_of_week === dayOfWeek);

    return dayTemplates.map((template) => {
      // Parse times
      const [startHour, startMin] = template.start_time.split(':').map(Number);
      const [endHour, endMin] = template.end_time.split(':').map(Number);

      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(startHour, startMin, 0, 0);

      const endDateTime = new Date(selectedDate);
      endDateTime.setHours(endHour, endMin, 0, 0);

      // Count existing bookings for this slot
      const bookingsForSlot = existingBookings.filter((booking) => {
        const bookingStart = new Date(booking.start_datetime);
        return bookingStart.getHours() === startHour && bookingStart.getMinutes() === startMin;
      });

      const slot: CalendarEvent = {
        id: `slot_${selectedDate.toISOString()}_${template.start_time}`,
        business_id: businessId || template.business_id,
        title: template.name,
        event_type: 'delivery_slot',
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString(),
        all_day: false,
        timezone,
        is_recurring: false,
        status: 'scheduled',
        max_bookings: template.max_bookings,
        current_bookings: bookingsForSlot.length,
        priority: 0,
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return slot;
    });
  }, [selectedDate, templates, existingBookings, businessId, timezone]);

  const formatDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    }

    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
  };

  const isSelected = (slot: CalendarEvent) => {
    if (!selectedSlot) return false;
    return slot.start_datetime === selectedSlot.start_datetime;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Truck className="text-teal-600" size={20} />
          <h3 className="font-semibold text-gray-800">Choose Delivery Time</h3>
        </div>
      </div>

      {/* Date Selector */}
      <div className="p-4 border-b">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {next7Days.map((date) => {
            const isActiveDate =
              date.toDateString() === selectedDate.toDateString();

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`flex-shrink-0 flex flex-col items-center px-4 py-2 rounded-lg border-2 transition-all ${
                  isActiveDate
                    ? 'border-teal-600 bg-teal-50 text-teal-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <span className="text-xs font-medium uppercase">
                  {DAY_NAMES_SHORT[date.getDay()]}
                </span>
                <span className="text-lg font-bold">{date.getDate()}</span>
              </button>
            );
          })}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Selected: {selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Time Slots */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-gray-500 text-sm">No delivery slots available for this day</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {availableSlots.map((slot) => {
              const available = isSlotAvailable(slot);
              const remainingSlots = getAvailableSlotsCount(slot);
              const selected = isSelected(slot);

              return (
                <button
                  key={slot.id}
                  onClick={() => {
                    if (available) {
                      onSlotSelect(selected ? null : slot);
                    }
                  }}
                  disabled={!available}
                  className={`relative flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                    !available
                      ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : selected
                      ? 'border-teal-600 bg-teal-50 text-teal-700'
                      : 'border-gray-200 hover:border-teal-300 hover:bg-teal-50/50 text-gray-700'
                  }`}
                >
                  {/* Selected checkmark */}
                  {selected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-teal-600 rounded-full flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  )}

                  <Clock size={20} className={selected ? 'text-teal-600' : ''} />
                  <span className="text-sm font-semibold mt-1">
                    {new Date(slot.start_datetime).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {' - '}
                    {slot.end_datetime &&
                      new Date(slot.end_datetime).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                  </span>
                  <span className="text-xs mt-1">
                    {available
                      ? `${remainingSlots} slot${remainingSlots !== 1 ? 's' : ''} left`
                      : 'Fully booked'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected slot summary */}
      {selectedSlot && (
        <div className="px-4 pb-4">
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-teal-700">
              <Check size={16} />
              <span className="font-medium">Delivery scheduled for:</span>
            </div>
            <p className="text-sm text-teal-600 mt-1">
              {new Date(selectedSlot.start_datetime).toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
              {', '}
              {new Date(selectedSlot.start_datetime).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              {selectedSlot.end_datetime && (
                <>
                  {' - '}
                  {new Date(selectedSlot.end_datetime).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
