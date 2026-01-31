// Calendar System TypeScript Types

export type EventType = 'business_event' | 'cultural_event' | 'delivery_slot' | 'appointment' | 'store_hours';
export type EventStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type ViewType = 'month' | 'week' | 'day' | 'list';
export type EventFilter = 'all' | 'business' | 'cultural' | 'delivery' | 'appointment' | 'store_hours';

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  days?: number[];  // 0-6 for weekly (0=Sunday)
  dayOfMonth?: number;  // 1-31 for monthly
  month?: number;  // 1-12 for yearly
  until?: string;  // ISO date string
  count?: number;  // Max number of occurrences
}

export interface StockRecommendation {
  product: string;
  extraUnits: number;
}

export interface CalendarEvent {
  id: string;
  business_id: string;
  title: string;
  description?: string;
  event_type: EventType;
  start_datetime: string;
  end_datetime?: string;
  all_day: boolean;
  timezone: string;

  // Recurrence
  is_recurring: boolean;
  recurrence_rule?: RecurrenceRule;
  recurrence_parent_id?: string;

  // Cultural event specifics
  emoji?: string;
  expected_increase?: number;
  communities?: string[];
  affected_products?: string[];
  stock_recommendations?: StockRecommendation[];

  // Delivery/Appointment specifics
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  order_id?: string;
  status: EventStatus;

  // Booking specifics
  max_bookings?: number;
  current_bookings?: number;
  booking_duration_minutes?: number;

  // Visual
  color?: string;
  priority: number;
  is_public: boolean;

  // Notifications
  send_reminder?: boolean;
  reminder_minutes?: number;

  // Metadata
  metadata?: Record<string, unknown>;
  created_by?: string;
  created_at: string;
  updated_at: string;

  // Computed (for display)
  daysUntil?: number;
}

export interface DeliverySlotTemplate {
  id: string;
  business_id: string;
  name: string;
  day_of_week: number;  // 0-6 (0=Sunday)
  start_time: string;   // HH:MM format
  end_time: string;     // HH:MM format
  max_bookings: number;
  is_active: boolean;
  zones?: string[];
  delivery_fee?: number;
  created_at: string;
  updated_at: string;
}

export interface EventBooking {
  id: string;
  business_id: string;
  event_id: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  order_id?: string;
  status: BookingStatus;
  notes?: string;
  metadata?: Record<string, unknown>;
  booked_at: string;
  confirmed_at?: string;
  created_at: string;
  updated_at: string;
}

// Form types for create/edit
export interface EventFormData {
  title: string;
  description: string;
  event_type: EventType;
  start_date: string;  // YYYY-MM-DD
  start_time: string;  // HH:MM
  end_date: string;
  end_time: string;
  all_day: boolean;
  is_recurring: boolean;
  recurrence_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrence_interval?: number;
  recurrence_until?: string;
  color: string;
  is_public: boolean;

  // Cultural event
  emoji?: string;
  expected_increase?: number;
  communities?: string[];
  affected_products?: string[];

  // Delivery/Appointment
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  max_bookings?: number;
}

export interface DeliverySlotFormData {
  name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_bookings: number;
  is_active: boolean;
  zones: string[];
  delivery_fee: number;
}

// Props interfaces
export interface CalendarSystemProps {
  products: Product[];
  orders?: Order[];
  onEventCreate?: (event: CalendarEvent) => void;
  onEventUpdate?: (event: CalendarEvent) => void;
  onEventDelete?: (eventId: string) => void;
}

export interface CalendarHeaderProps {
  currentDate: Date;
  currentView: ViewType;
  eventFilter: EventFilter;
  onDateChange: (date: Date) => void;
  onViewChange: (view: ViewType) => void;
  onFilterChange: (filter: EventFilter) => void;
  onCreateEvent: () => void;
}

export interface CalendarGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateSelect: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export interface CalendarListViewProps {
  events: CalendarEvent[];
  products: Product[];
  onEventClick: (event: CalendarEvent) => void;
}

export interface EventCardProps {
  event: CalendarEvent;
  compact?: boolean;
  onClick?: () => void;
}

export interface EventModalProps {
  isOpen: boolean;
  event?: CalendarEvent;
  selectedDate?: Date;
  onClose: () => void;
  onSave: (data: EventFormData) => Promise<void>;
}

export interface EventDetailModalProps {
  event: CalendarEvent;
  products: Product[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export interface CulturalEventCardProps {
  event: CalendarEvent;
  products: Product[];
  onClick?: () => void;
}

export interface DeliverySlotPickerProps {
  selectedDate: Date;
  onSlotSelect: (slot: CalendarEvent) => void;
  selectedSlot?: CalendarEvent;
}

export interface DeliverySlotManagerProps {
  onTemplateCreate?: (template: DeliverySlotTemplate) => void;
  onTemplateUpdate?: (template: DeliverySlotTemplate) => void;
}

// Utility types from existing codebase
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  sub_category?: string;
  stock_quantity?: number;
  image_url?: string;
  is_active?: boolean;
}

export interface Order {
  id: string;
  customer_name: string;
  phone_number?: string;
  email?: string;
  delivery_address?: string;
  channel: string;
  items: OrderItem[];
  delivery_fee?: number;
  total: number;
  status: string;
  payment_method?: string;
  created_at: string;
}

export interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
}

// Stock readiness type
export interface StockReadiness {
  ready: number;
  total: number;
  percentage: number;
}

// Event color mapping
export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  business_event: '#3B82F6',   // Blue
  cultural_event: '#F97316',   // Orange
  delivery_slot: '#10B981',    // Green
  appointment: '#8B5CF6',      // Purple
  store_hours: '#6B7280',      // Gray
};

// Day names
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];
