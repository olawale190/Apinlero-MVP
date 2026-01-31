// Event Modal Component - Create/Edit event form

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Repeat, Tag, Users } from 'lucide-react';
import { CalendarEvent, EventFormData, EventType, RecurrenceRule } from './types';

interface EventModalProps {
  isOpen: boolean;
  event?: CalendarEvent;
  selectedDate?: Date;
  onClose: () => void;
  onSave: (data: EventFormData) => Promise<void>;
}

const EVENT_TYPES: { value: EventType; label: string; emoji: string }[] = [
  { value: 'business_event', label: 'Business Event', emoji: '💼' },
  { value: 'cultural_event', label: 'Cultural Event', emoji: '🎉' },
  { value: 'delivery_slot', label: 'Delivery Slot', emoji: '🚚' },
  { value: 'appointment', label: 'Appointment', emoji: '📅' },
  { value: 'store_hours', label: 'Store Hours', emoji: '🏪' },
];

const COLOR_OPTIONS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F97316', // Orange
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#FBBF24', // Yellow
  '#EC4899', // Pink
  '#6B7280', // Gray
];

export default function EventModal({
  isOpen,
  event,
  selectedDate,
  onClose,
  onSave,
}: EventModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    event_type: 'business_event',
    start_date: '',
    start_time: '09:00',
    end_date: '',
    end_time: '10:00',
    all_day: false,
    is_recurring: false,
    recurrence_frequency: 'weekly',
    recurrence_interval: 1,
    color: '#3B82F6',
    is_public: false,
    max_bookings: 5,
  });

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Edit mode - populate from existing event
        const startDate = new Date(event.start_datetime);
        const endDate = event.end_datetime ? new Date(event.end_datetime) : startDate;

        setFormData({
          title: event.title,
          description: event.description || '',
          event_type: event.event_type,
          start_date: startDate.toISOString().split('T')[0],
          start_time: startDate.toTimeString().slice(0, 5),
          end_date: endDate.toISOString().split('T')[0],
          end_time: endDate.toTimeString().slice(0, 5),
          all_day: event.all_day,
          is_recurring: event.is_recurring,
          recurrence_frequency: event.recurrence_rule?.frequency || 'weekly',
          recurrence_interval: event.recurrence_rule?.interval || 1,
          color: event.color || '#3B82F6',
          is_public: event.is_public,
          emoji: event.emoji,
          expected_increase: event.expected_increase,
          communities: event.communities,
          affected_products: event.affected_products,
          customer_name: event.customer_name,
          customer_phone: event.customer_phone,
          customer_email: event.customer_email,
          max_bookings: event.max_bookings || 5,
        });
      } else {
        // Create mode - use selected date or today
        const date = selectedDate || new Date();
        const dateStr = date.toISOString().split('T')[0];

        setFormData({
          title: '',
          description: '',
          event_type: 'business_event',
          start_date: dateStr,
          start_time: '09:00',
          end_date: dateStr,
          end_time: '10:00',
          all_day: false,
          is_recurring: false,
          recurrence_frequency: 'weekly',
          recurrence_interval: 1,
          color: '#3B82F6',
          is_public: false,
          max_bookings: 5,
        });
      }
    }
  }, [isOpen, event, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate end date/time is after start date/time
    if (!formData.all_day && formData.end_date && formData.end_time) {
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
      const endDateTime = new Date(`${formData.end_date}T${formData.end_time}`);

      if (endDateTime <= startDateTime) {
        setError('End date/time must be after start date/time');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save event';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between rounded-t-xl">
          <h3 className="text-lg font-bold text-gray-800">
            {event ? 'Edit Event' : 'Create Event'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EVENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, event_type: type.value })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                    formData.event_type === type.value
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span>{type.emoji}</span>
                  <span className="truncate">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Event title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              rows={2}
              placeholder="Optional description"
            />
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="all_day"
              checked={formData.all_day}
              onChange={(e) => setFormData({ ...formData, all_day: e.target.checked })}
              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
            />
            <label htmlFor="all_day" className="text-sm text-gray-700">
              All day event
            </label>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar size={14} className="inline mr-1" />
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            {!formData.all_day && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock size={14} className="inline mr-1" />
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            )}
          </div>

          {!formData.all_day && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>
          )}

          {/* Recurring */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id="is_recurring"
                checked={formData.is_recurring}
                onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
              />
              <label htmlFor="is_recurring" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Repeat size={14} />
                Recurring event
              </label>
            </div>

            {formData.is_recurring && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Repeat every</label>
                  <select
                    value={formData.recurrence_frequency}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recurrence_frequency: e.target.value as RecurrenceRule['frequency'],
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="daily">Day</option>
                    <option value="weekly">Week</option>
                    <option value="monthly">Month</option>
                    <option value="yearly">Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Until (optional)</label>
                  <input
                    type="date"
                    value={formData.recurrence_until || ''}
                    onChange={(e) => setFormData({ ...formData, recurrence_until: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Delivery slot specific fields */}
          {formData.event_type === 'delivery_slot' && (
            <div className="border-t pt-4 space-y-3">
              <h4 className="font-medium text-gray-700 flex items-center gap-1">
                <Users size={14} />
                Booking Settings
              </h4>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Max bookings per slot</label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_bookings}
                  onChange={(e) => setFormData({ ...formData, max_bookings: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          )}

          {/* Color picker */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Tag size={14} />
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  aria-label={`Select ${color} color`}
                  aria-pressed={formData.color === color}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color ? 'border-gray-800 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Public toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_public"
              checked={formData.is_public}
              onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
            />
            <label htmlFor="is_public" className="text-sm text-gray-700">
              Show on customer-facing calendar
            </label>
          </div>

          {/* Error display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="border-t pt-4 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
