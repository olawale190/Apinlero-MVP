// Event Detail Modal Component - View event details

import {
  X,
  Calendar,
  Clock,
  Repeat,
  TrendingUp,
  Package,
  Users,
  Edit,
  Trash2,
  ShoppingCart,
  MessageCircle,
  Star,
  AlertCircle,
} from 'lucide-react';
import { CalendarEvent, Product, StockRecommendation } from './types';
import { checkStockReadiness, getUrgencyBadge, formatDate, getEventColor } from '../../lib/calendar';

interface EventDetailModalProps {
  event: CalendarEvent;
  products: Product[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export default function EventDetailModal({
  event,
  products,
  onClose,
  onEdit,
  onDelete,
  isDeleting = false,
}: EventDetailModalProps) {
  const color = getEventColor(event);
  const daysUntil = event.daysUntil || 0;
  const urgencyBadge = getUrgencyBadge(daysUntil);
  const stockReadiness =
    event.event_type === 'cultural_event' ? checkStockReadiness(event, products) : null;

  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div
          className="p-4 border-b flex items-center justify-between"
          style={{ backgroundColor: `${color}10` }}
        >
          <div className="flex items-center gap-3">
            {event.emoji && <span className="text-3xl">{event.emoji}</span>}
            <div>
              <h3 className="font-bold text-gray-800">{event.title}</h3>
              <p className="text-sm text-gray-600">
                {formatDate(event.start_datetime, 'full')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Time and status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock size={16} />
              <span className="text-sm">
                {event.all_day
                  ? 'All day'
                  : `${formatTime(event.start_datetime)}${
                      event.end_datetime ? ` - ${formatTime(event.end_datetime)}` : ''
                    }`}
              </span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${urgencyBadge.className}`}>
              {daysUntil === 0
                ? 'Today'
                : daysUntil === 1
                ? 'Tomorrow'
                : `${daysUntil} days away`}
            </span>
          </div>

          {/* Recurring indicator */}
          {event.is_recurring && (
            <div className="flex items-center gap-2 text-gray-600">
              <Repeat size={16} />
              <span className="text-sm">
                Repeats{' '}
                {event.recurrence_rule?.frequency === 'yearly'
                  ? 'every year'
                  : event.recurrence_rule?.frequency}
              </span>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <p className="text-sm text-gray-600">{event.description}</p>
          )}

          {/* Cultural Event: Expected Impact */}
          {event.event_type === 'cultural_event' && event.expected_increase && (
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-green-600" size={18} />
                <span className="font-semibold text-green-700">Expected Impact</span>
              </div>
              <p className="text-2xl font-bold text-green-600">+{event.expected_increase}%</p>
              <p className="text-xs text-green-600">increase in orders expected</p>
            </div>
          )}

          {/* Cultural Event: Communities */}
          {event.communities && event.communities.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-1">
                <Users size={14} />
                Target Communities
              </h4>
              <div className="flex flex-wrap gap-2">
                {event.communities.map((community, idx) => (
                  <span
                    key={idx}
                    className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full"
                  >
                    {community}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Cultural Event: Stock Recommendations */}
          {event.stock_recommendations && event.stock_recommendations.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                <Package size={16} />
                Stock Recommendations
                {stockReadiness && (
                  <span className="text-xs font-normal text-gray-500">
                    ({stockReadiness.percentage}% ready)
                  </span>
                )}
              </h4>
              <div className="space-y-2">
                {event.stock_recommendations.map((rec: StockRecommendation, idx: number) => {
                  const product = products.find((p) =>
                    p.name.toLowerCase().includes(rec.product.toLowerCase())
                  );
                  const currentStock = product?.stock_quantity || 0;
                  const isReady = currentStock >= rec.extraUnits;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        isReady ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isReady ? (
                          <Star className="text-green-600" size={16} />
                        ) : (
                          <AlertCircle className="text-red-600" size={16} />
                        )}
                        <span className="text-sm font-medium text-gray-700">{rec.product}</span>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-medium ${
                            isReady ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          Need: +{rec.extraUnits}
                        </p>
                        <p className="text-xs text-gray-500">Current: {currentStock}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Delivery Slot: Booking info */}
          {event.event_type === 'delivery_slot' && event.max_bookings && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Booking Status</h4>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Slots filled</span>
                <span className="font-medium">
                  {event.current_bookings || 0} / {event.max_bookings}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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

          {/* Appointment: Customer info */}
          {(event.event_type === 'appointment' || event.event_type === 'delivery_slot') &&
            event.customer_name && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Customer</h4>
                <p className="text-sm">{event.customer_name}</p>
                {event.customer_phone && (
                  <p className="text-sm text-gray-600">{event.customer_phone}</p>
                )}
                {event.customer_email && (
                  <p className="text-sm text-gray-600">{event.customer_email}</p>
                )}
              </div>
            )}

          {/* Cultural Event: Action Buttons */}
          {event.event_type === 'cultural_event' && (
            <div className="flex gap-2 pt-2">
              <button className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-orange-700 transition-colors">
                <ShoppingCart size={16} />
                Order Stock
              </button>
              <button className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-green-700 transition-colors">
                <MessageCircle size={16} />
                Create Campaign
              </button>
            </div>
          )}

          {/* Edit/Delete buttons */}
          <div className="flex gap-2 pt-2 border-t">
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <Edit size={16} />
              Edit
            </button>
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={16} className={isDeleting ? 'animate-pulse' : ''} />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
