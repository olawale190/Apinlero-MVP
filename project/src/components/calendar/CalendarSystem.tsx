// Calendar System - Main container component

import { useState, useMemo } from 'react';
import {
  CalendarEvent,
  ViewType,
  EventFilter,
  EventFormData,
  CalendarSystemProps,
} from './types';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';
import {
  getViewStartDate,
  getViewEndDate,
  filterEventsByType,
} from '../../lib/calendar';

import CalendarHeader from './CalendarHeader';
import CalendarGrid from './CalendarGrid';
import CalendarListView from './CalendarListView';
import EventModal from './EventModal';
import EventDetailModal from './EventDetailModal';

export default function CalendarSystem({ products, orders }: CalendarSystemProps) {
  // View state
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventFilter, setEventFilter] = useState<EventFilter>('all');

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate date range based on view
  const startDate = useMemo(() => getViewStartDate(currentDate, currentView), [currentDate, currentView]);
  const endDate = useMemo(() => getViewEndDate(currentDate, currentView), [currentDate, currentView]);

  // Fetch events
  const { events, isLoading, error, refetch, createEvent, updateEvent, deleteEvent } =
    useCalendarEvents({
      startDate,
      endDate,
      includeRecurring: true,
    });

  // Filter events by type
  const filteredEvents = useMemo(
    () => filterEventsByType(events, eventFilter),
    [events, eventFilter]
  );

  // Handlers
  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
  };

  const handleFilterChange = (filter: EventFilter) => {
    setEventFilter(filter);
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setSelectedDate(null);
    setIsEditing(false);
    setShowCreateModal(true);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setIsEditing(false);
    setShowCreateModal(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowDetailModal(true);
  };

  const handleEditEvent = () => {
    setShowDetailModal(false);
    setIsEditing(true);
    setShowCreateModal(true);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent || isDeleting) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${selectedEvent.title}"?`
    );

    if (confirmed) {
      setIsDeleting(true);
      try {
        const success = await deleteEvent(selectedEvent.id);
        if (success) {
          setShowDetailModal(false);
          setSelectedEvent(null);
          refetch();
        }
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleSaveEvent = async (data: EventFormData) => {
    if (isEditing && selectedEvent) {
      // Update existing event
      await updateEvent(selectedEvent.id, {
        title: data.title,
        description: data.description || null,
        event_type: data.event_type,
        start_datetime: data.all_day
          ? `${data.start_date}T00:00:00`
          : `${data.start_date}T${data.start_time}:00`,
        end_datetime: data.end_date
          ? data.all_day
            ? `${data.end_date}T23:59:59`
            : `${data.end_date}T${data.end_time}:00`
          : null,
        all_day: data.all_day,
        is_recurring: data.is_recurring,
        recurrence_rule: data.is_recurring
          ? {
              frequency: data.recurrence_frequency,
              interval: data.recurrence_interval || 1,
              until: data.recurrence_until || null,
            }
          : null,
        color: data.color,
        is_public: data.is_public,
        max_bookings: data.max_bookings,
      } as Partial<CalendarEvent>);
    } else {
      // Create new event
      await createEvent(data);
    }

    refetch();
    setShowCreateModal(false);
    setSelectedEvent(null);
    setIsEditing(false);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setSelectedEvent(null);
    setSelectedDate(null);
    setIsEditing(false);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedEvent(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header with navigation and controls */}
      <CalendarHeader
        currentDate={currentDate}
        currentView={currentView}
        eventFilter={eventFilter}
        onDateChange={handleDateChange}
        onViewChange={handleViewChange}
        onFilterChange={handleFilterChange}
        onCreateEvent={handleCreateEvent}
      />

      {/* Calendar content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-2">Failed to load events</p>
            <p className="text-sm text-gray-500">{error}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {currentView === 'month' && (
              <CalendarGrid
                currentDate={currentDate}
                events={filteredEvents}
                onDateSelect={handleDateSelect}
                onEventClick={handleEventClick}
              />
            )}

            {currentView === 'list' && (
              <CalendarListView
                events={filteredEvents}
                products={products}
                onEventClick={handleEventClick}
              />
            )}

            {/* Week and Day views - simplified for now */}
            {(currentView === 'week' || currentView === 'day') && (
              <CalendarListView
                events={filteredEvents}
                products={products}
                onEventClick={handleEventClick}
              />
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <EventModal
        isOpen={showCreateModal}
        event={isEditing ? selectedEvent || undefined : undefined}
        selectedDate={selectedDate || undefined}
        onClose={handleCloseCreateModal}
        onSave={handleSaveEvent}
      />

      {/* Detail Modal */}
      {showDetailModal && selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          products={products}
          onClose={handleCloseDetailModal}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
