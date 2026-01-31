// Calendar Header Component - View switcher and navigation

import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  List,
  Grid3X3,
  Plus,
  Filter,
} from 'lucide-react';
import { ViewType, EventFilter, MONTH_NAMES } from './types';

interface CalendarHeaderProps {
  currentDate: Date;
  currentView: ViewType;
  eventFilter: EventFilter;
  onDateChange: (date: Date) => void;
  onViewChange: (view: ViewType) => void;
  onFilterChange: (filter: EventFilter) => void;
  onCreateEvent: () => void;
}

export default function CalendarHeader({
  currentDate,
  currentView,
  eventFilter,
  onDateChange,
  onViewChange,
  onFilterChange,
  onCreateEvent,
}: CalendarHeaderProps) {
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    switch (currentView) {
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'list':
        newDate.setDate(newDate.getDate() - 7);
        break;
    }
    onDateChange(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    switch (currentView) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'list':
        newDate.setDate(newDate.getDate() + 7);
        break;
    }
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const getDateLabel = () => {
    switch (currentView) {
      case 'month':
        return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      case 'week': {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} ${MONTH_NAMES[endOfWeek.getMonth()]} ${endOfWeek.getFullYear()}`;
      }
      case 'day':
        return currentDate.toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      case 'list':
        return `From ${currentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
    }
  };

  const viewOptions: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'month', label: 'Month', icon: <Grid3X3 size={16} /> },
    { id: 'list', label: 'List', icon: <List size={16} /> },
  ];

  const filterOptions: { id: EventFilter; label: string; color: string }[] = [
    { id: 'all', label: 'All Events', color: '#6B7280' },
    { id: 'cultural', label: 'Cultural', color: '#F97316' },
    { id: 'business', label: 'Business', color: '#3B82F6' },
    { id: 'delivery', label: 'Delivery', color: '#10B981' },
    { id: 'appointment', label: 'Appointments', color: '#8B5CF6' },
    { id: 'store_hours', label: 'Store Hours', color: '#6B7280' },
  ];

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      {/* Top row: Title and Create button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg p-2">
            <Calendar className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Events Calendar</h2>
            <p className="text-xs text-gray-500">Manage all your events in one place</p>
          </div>
        </div>
        <button
          onClick={onCreateEvent}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add Event</span>
        </button>
      </div>

      {/* Navigation row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Date navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={navigatePrevious}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={navigateNext}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Next"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
          <span className="text-lg font-semibold text-gray-800 ml-2">{getDateLabel()}</span>
        </div>

        {/* View and filter controls */}
        <div className="flex items-center gap-3">
          {/* Filter dropdown */}
          <div className="relative">
            <select
              value={eventFilter}
              onChange={(e) => onFilterChange(e.target.value as EventFilter)}
              className="appearance-none bg-gray-100 border-0 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors"
            >
              {filterOptions.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.label}
                </option>
              ))}
            </select>
            <Filter size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>

          {/* View switcher */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {viewOptions.map((view) => (
              <button
                key={view.id}
                onClick={() => onViewChange(view.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  currentView === view.id
                    ? 'bg-white text-teal-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {view.icon}
                <span className="hidden sm:inline">{view.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
