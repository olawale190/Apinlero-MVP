import { useState } from 'react';
import { ChevronDown, ChevronUp, Truck, Check, Mail, Send } from 'lucide-react';
import type { Order } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { triggerOrderEmail, isN8nConfigured } from '../lib/n8n';

interface OrdersTableProps {
  orders: Order[];
  onOrderUpdate: () => void;
}

type FilterType = 'All' | 'Pending' | 'Confirmed' | 'Delivered';

export default function OrdersTable({ orders, onOrderUpdate }: OrdersTableProps) {
  const [filter, setFilter] = useState<FilterType>('All');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<string | null>(null);

  // Handle sending email notification
  const handleSendEmail = async (orderId: string, type: 'confirmation' | 'status', e: React.MouseEvent) => {
    e.stopPropagation();
    setSendingEmail(orderId);

    const result = await triggerOrderEmail(orderId, type);

    if (result.success) {
      setEmailSent(orderId);
      setTimeout(() => setEmailSent(null), 3000);
    } else {
      alert(result.error || 'Failed to send email');
    }

    setSendingEmail(null);
  };

  // Generate delivery link for driver
  const generateDeliveryLink = (orderId: string) => {
    const token = btoa(orderId).slice(0, 8);
    const baseUrl = window.location.origin;
    return `${baseUrl}?delivery=${orderId}&token=${token}`;
  };

  const copyDeliveryLink = async (orderId: string) => {
    const link = generateDeliveryLink(orderId);
    await navigator.clipboard.writeText(link);
    setCopiedOrderId(orderId);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const today = new Date().toDateString();
  const todayOrders = orders.filter(
    order => new Date(order.created_at).toDateString() === today
  );

  const filteredOrders = todayOrders.filter(order => {
    if (filter === 'All') return true;
    return order.status === filter;
  });

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (!error) {
      onOrderUpdate();
      // Auto-send status update email to customer
      if (isN8nConfigured()) {
        triggerOrderEmail(orderId, 'status').catch(console.error);
      }
    }
  };

  const getChannelBadge = (channel: string) => {
    const styles = {
      WhatsApp: 'bg-green-100 text-green-800',
      Web: 'bg-blue-100 text-blue-800',
      Phone: 'bg-orange-100 text-orange-800',
      'Walk-in': 'bg-gray-100 text-gray-800',
    };
    return styles[channel as keyof typeof styles] || styles['Walk-in'];
  };

  const filters: FilterType[] = ['All', 'Pending', 'Confirmed', 'Delivered'];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4" style={{ color: '#1e3a5f' }}>
        Today's Orders
      </h2>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              filter === f
                ? 'text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={filter === f ? { backgroundColor: '#0d9488' } : {}}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No orders found
          </div>
        ) : (
          filteredOrders.map(order => {
            const isExpanded = expandedOrderId === order.id;
            const time = new Date(order.created_at).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const itemCount = Array.isArray(order.items)
              ? order.items.reduce((sum, item) => sum + item.quantity, 0)
              : 0;

            return (
              <div
                key={order.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Card Header */}
                <div
                  className="p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-sm">{order.customer_name}</p>
                      <p className="text-xs text-gray-500">{time}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: '#0d9488' }}>
                        £{order.total.toFixed(2)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getChannelBadge(
                          order.channel
                        )}`}
                      >
                        {order.channel}
                      </span>
                      <span className="text-xs text-gray-500">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    <select
                      value={order.status}
                      onChange={e => {
                        e.stopPropagation();
                        handleStatusChange(order.id, e.target.value);
                      }}
                      onClick={e => e.stopPropagation()}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="bg-gray-50 p-3 border-t border-gray-200">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-xs mb-1.5" style={{ color: '#1e3a5f' }}>
                          Order Details
                        </h4>
                        <div className="space-y-1">
                          {Array.isArray(order.items) && order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span>{item.product_name} x {item.quantity}</span>
                              <span className="font-medium">£{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-xs pt-1 border-t">
                            <span>Delivery Fee</span>
                            <span className="font-medium">£{order.delivery_fee.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      {order.delivery_address && (
                        <div>
                          <h4 className="font-semibold text-xs mb-1" style={{ color: '#1e3a5f' }}>
                            Delivery
                          </h4>
                          <p className="text-xs text-gray-600">{order.delivery_address}</p>
                        </div>
                      )}
                      {order.phone_number && (
                        <div>
                          <h4 className="font-semibold text-xs mb-1" style={{ color: '#1e3a5f' }}>
                            Phone
                          </h4>
                          <p className="text-xs text-gray-600">{order.phone_number}</p>
                        </div>
                      )}
                      {order.notes && (
                        <div>
                          <h4 className="font-semibold text-xs mb-1" style={{ color: '#1e3a5f' }}>
                            Notes
                          </h4>
                          <p className="text-xs text-gray-600">{order.notes}</p>
                        </div>
                      )}
                      {/* Driver Delivery Link */}
                      {order.status !== 'Delivered' && (
                        <div className="pt-2 border-t border-gray-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyDeliveryLink(order.id);
                            }}
                            className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700 transition"
                          >
                            {copiedOrderId === order.id ? (
                              <>
                                <Check size={14} />
                                Link Copied!
                              </>
                            ) : (
                              <>
                                <Truck size={14} />
                                Copy Driver Link
                              </>
                            )}
                          </button>
                        </div>
                      )}
                      {/* Email Notification Buttons */}
                      {isN8nConfigured() && (
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500 mb-2">Send Email Notification</p>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => handleSendEmail(order.id, 'confirmation', e)}
                              disabled={sendingEmail === order.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition disabled:opacity-50"
                            >
                              {emailSent === order.id ? (
                                <>
                                  <Check size={12} />
                                  Sent!
                                </>
                              ) : sendingEmail === order.id ? (
                                'Sending...'
                              ) : (
                                <>
                                  <Mail size={12} />
                                  Confirmation
                                </>
                              )}
                            </button>
                            <button
                              onClick={(e) => handleSendEmail(order.id, 'status', e)}
                              disabled={sendingEmail === order.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition disabled:opacity-50"
                            >
                              <Send size={12} />
                              Status Update
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Time</th>
              <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Customer</th>
              <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Channel</th>
              <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Items</th>
              <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Total</th>
              <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Status</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  No orders found
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => {
                const isExpanded = expandedOrderId === order.id;
                const time = new Date(order.created_at).toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const itemCount = Array.isArray(order.items)
                  ? order.items.reduce((sum, item) => sum + item.quantity, 0)
                  : 0;

                return (
                  <>
                    <tr
                      key={order.id}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    >
                      <td className="py-3 px-2 text-sm">{time}</td>
                      <td className="py-3 px-2">
                        <div>
                          <p className="text-sm font-medium">{order.customer_name}</p>
                          <p className="text-xs text-gray-500">{order.phone_number}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getChannelBadge(
                            order.channel
                          )}`}
                        >
                          {order.channel}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm">{itemCount} {itemCount === 1 ? 'item' : 'items'}</td>
                      <td className="py-3 px-2 text-sm font-semibold">
                        £{order.total.toFixed(2)}
                      </td>
                      <td className="py-3 px-2">
                        <select
                          value={order.status}
                          onChange={e => {
                            e.stopPropagation();
                            handleStatusChange(order.id, e.target.value);
                          }}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          onClick={e => e.stopPropagation()}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </td>
                      <td className="py-3 px-2">
                        {isExpanded ? (
                          <ChevronUp size={16} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={16} className="text-gray-400" />
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="bg-gray-50 px-4 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold text-sm mb-2" style={{ color: '#1e3a5f' }}>
                                Order Details
                              </h4>
                              <div className="space-y-2">
                                {Array.isArray(order.items) && order.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between text-sm">
                                    <span>
                                      {item.product_name} x {item.quantity}
                                    </span>
                                    <span className="font-medium">
                                      £{(item.price * item.quantity).toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                                <div className="flex justify-between text-sm pt-2 border-t">
                                  <span>Delivery Fee</span>
                                  <span className="font-medium">£{order.delivery_fee.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold pt-1">
                                  <span>Total</span>
                                  <span>£{order.total.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm mb-2" style={{ color: '#1e3a5f' }}>
                                Delivery Information
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="text-gray-600">Address:</span>
                                  <p className="font-medium">{order.delivery_address || 'N/A'}</p>
                                </div>
                                {order.notes && (
                                  <div>
                                    <span className="text-gray-600">Notes:</span>
                                    <p className="font-medium">{order.notes}</p>
                                  </div>
                                )}
                                {/* Driver Delivery Link */}
                                {order.status !== 'Delivered' && (
                                  <div className="pt-3 mt-3 border-t border-gray-200">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyDeliveryLink(order.id);
                                      }}
                                      className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition"
                                    >
                                      {copiedOrderId === order.id ? (
                                        <>
                                          <Check size={16} />
                                          Link Copied!
                                        </>
                                      ) : (
                                        <>
                                          <Truck size={16} />
                                          Copy Driver Link
                                        </>
                                      )}
                                    </button>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Send this link to driver via WhatsApp
                                    </p>
                                  </div>
                                )}
                                {/* Email Notification Buttons */}
                                {isN8nConfigured() && (
                                  <div className="pt-3 mt-3 border-t border-gray-200">
                                    <p className="text-xs text-gray-500 mb-2">Send Email Notification</p>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={(e) => handleSendEmail(order.id, 'confirmation', e)}
                                        disabled={sendingEmail === order.id}
                                        className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition disabled:opacity-50"
                                      >
                                        {emailSent === order.id ? (
                                          <>
                                            <Check size={14} />
                                            Sent!
                                          </>
                                        ) : sendingEmail === order.id ? (
                                          'Sending...'
                                        ) : (
                                          <>
                                            <Mail size={14} />
                                            Resend Confirmation
                                          </>
                                        )}
                                      </button>
                                      <button
                                        onClick={(e) => handleSendEmail(order.id, 'status', e)}
                                        disabled={sendingEmail === order.id}
                                        className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition disabled:opacity-50"
                                      >
                                        <Send size={14} />
                                        Send Status Update
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
