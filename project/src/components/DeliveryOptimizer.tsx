import { useState } from 'react';
import {
  Truck,
  MapPin,
  Clock,
  Navigation,
  MessageCircle,
  CheckCircle,
  Route,
  Fuel
} from 'lucide-react';
import type { Order } from '../lib/supabase';

interface DeliveryOptimizerProps {
  orders: Order[];
}

interface DeliveryOrder {
  id: string;
  customerName: string;
  address: string;
  postcode: string;
  zone: string;
  items: number;
  total: number;
  status: 'pending' | 'out_for_delivery' | 'delivered';
  estimatedTime?: string;
}

interface DeliveryZone {
  name: string;
  postcodePrefixes: string[];
  orders: number;
  revenue: number;
  color: string;
}

// Mock postcode zones for London
const postcodeZones: Record<string, string> = {
  'SE15': 'Peckham',
  'SE5': 'Camberwell',
  'SE24': 'Herne Hill',
  'SW9': 'Brixton',
  'SE22': 'East Dulwich',
  'SE4': 'Brockley',
  'SE14': 'New Cross',
  'SE8': 'Deptford',
  'SE17': 'Walworth',
  'SE1': 'Borough',
};

export default function DeliveryOptimizer({ orders }: DeliveryOptimizerProps) {
  const [selectedRoute, setSelectedRoute] = useState<boolean>(false);
  const [optimizedRoute, setOptimizedRoute] = useState<DeliveryOrder[]>([]);

  // Extract postcode from address
  const extractPostcode = (address: string): string => {
    const match = address.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/i);
    return match ? match[0].toUpperCase().replace(/\s/g, '').slice(0, 3) : 'SE15'; // Default
  };

  // Get zone from postcode
  const getZone = (postcode: string): string => {
    const prefix = postcode.slice(0, 3).toUpperCase();
    return postcodeZones[prefix] || 'Other';
  };

  // Get today's delivery orders
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o =>
    new Date(o.created_at).toDateString() === today &&
    o.delivery_address &&
    o.delivery_address.length > 5
  );

  // Convert to delivery orders
  const deliveryOrders: DeliveryOrder[] = todayOrders.map(order => {
    const postcode = extractPostcode(order.delivery_address);
    return {
      id: order.id,
      customerName: order.customer_name,
      address: order.delivery_address,
      postcode,
      zone: getZone(postcode),
      items: Array.isArray(order.items) ? order.items.reduce((sum, i) => sum + i.quantity, 0) : 0,
      total: order.total,
      status: order.status === 'Delivered' ? 'delivered' : 'pending',
    };
  });

  // Calculate zone statistics
  const zoneStats: DeliveryZone[] = [];
  const zoneMap = new Map<string, { orders: number; revenue: number }>();

  deliveryOrders.forEach(order => {
    const existing = zoneMap.get(order.zone) || { orders: 0, revenue: 0 };
    zoneMap.set(order.zone, {
      orders: existing.orders + 1,
      revenue: existing.revenue + order.total,
    });
  });

  const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500'];
  let colorIndex = 0;

  zoneMap.forEach((data, name) => {
    zoneStats.push({
      name,
      postcodePrefixes: Object.entries(postcodeZones)
        .filter(([, zone]) => zone === name)
        .map(([prefix]) => prefix),
      orders: data.orders,
      revenue: data.revenue,
      color: colors[colorIndex++ % colors.length],
    });
  });

  zoneStats.sort((a, b) => b.orders - a.orders);

  // Optimize route (group by zone)
  const optimizeRoute = () => {
    const sorted = [...deliveryOrders]
      .filter(o => o.status === 'pending')
      .sort((a, b) => {
        // Sort by zone first, then by postcode
        if (a.zone !== b.zone) return a.zone.localeCompare(b.zone);
        return a.postcode.localeCompare(b.postcode);
      });

    // Add estimated times
    let currentTime = new Date();
    currentTime.setHours(14, 0, 0, 0); // Start at 2 PM

    const withTimes = sorted.map((order, idx) => {
      const minutes = idx * 15; // 15 mins per delivery
      const deliveryTime = new Date(currentTime.getTime() + minutes * 60000);
      return {
        ...order,
        estimatedTime: deliveryTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      };
    });

    setOptimizedRoute(withTimes);
    setSelectedRoute(true);
  };

  // Calculate route stats
  const pendingDeliveries = deliveryOrders.filter(o => o.status === 'pending').length;
  const totalDeliveryRevenue = deliveryOrders.reduce((sum, o) => sum + o.total, 0);
  const estimatedTime = pendingDeliveries * 15; // 15 mins per delivery
  const estimatedDistance = pendingDeliveries * 2.5; // ~2.5 miles per delivery

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 rounded-lg p-2">
            <Truck className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm sm:text-lg">Delivery Optimizer</h2>
            <p className="text-teal-100 text-xs sm:text-sm">AI-powered route planning</p>
          </div>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-4 gap-2 p-4 bg-gray-50 border-b">
        <div className="text-center">
          <p className="text-xl font-bold text-teal-600">{pendingDeliveries}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-gray-800">£{totalDeliveryRevenue.toFixed(0)}</p>
          <p className="text-xs text-gray-500">Revenue</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-orange-600">{Math.round(estimatedTime / 60 * 10) / 10}h</p>
          <p className="text-xs text-gray-500">Est. Time</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-blue-600">{estimatedDistance.toFixed(0)}mi</p>
          <p className="text-xs text-gray-500">Distance</p>
        </div>
      </div>

      {/* Zone Breakdown */}
      <div className="p-4 border-b">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <MapPin size={16} className="text-teal-600" />
          Delivery Zones
        </h3>
        <div className="space-y-2">
          {zoneStats.map((zone) => (
            <div key={zone.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${zone.color}`}></div>
                <span className="text-sm text-gray-700">{zone.name}</span>
                <span className="text-xs text-gray-400">({zone.postcodePrefixes.join(', ')})</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">{zone.orders} orders</span>
                <span className="font-medium text-gray-800">£{zone.revenue.toFixed(0)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Optimize Button */}
      {!selectedRoute && pendingDeliveries > 0 && (
        <div className="p-4">
          <button
            onClick={optimizeRoute}
            className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:from-teal-700 hover:to-cyan-700 transition-colors"
          >
            <Route size={18} />
            Optimize Route
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            AI will group deliveries by zone for efficiency
          </p>
        </div>
      )}

      {/* Optimized Route */}
      {selectedRoute && optimizedRoute.length > 0 && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Navigation size={16} className="text-teal-600" />
              Optimized Route
            </h3>
            <button
              onClick={() => setSelectedRoute(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Reset
            </button>
          </div>

          {/* Route Summary */}
          <div className="bg-teal-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Clock className="text-teal-600" size={16} />
                <span className="text-teal-700">Start: 2:00 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <Fuel className="text-teal-600" size={16} />
                <span className="text-teal-700">~{estimatedDistance.toFixed(0)} miles</span>
              </div>
            </div>
          </div>

          {/* Route Steps */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {/* Start Point */}
            <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">
                🏪
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">Isha's Treat & Groceries</p>
                <p className="text-xs text-gray-500">Start point</p>
              </div>
            </div>

            {optimizedRoute.map((order, idx) => (
              <div key={order.id} className="flex items-center gap-3 p-2 rounded-lg border border-gray-200">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm truncate">{order.customerName}</p>
                  <p className="text-xs text-gray-500 truncate">{order.zone} • {order.items} items • £{order.total.toFixed(0)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-teal-600">{order.estimatedTime}</p>
                  <p className="text-xs text-gray-400">ETA</p>
                </div>
              </div>
            ))}

            {/* End Point */}
            <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                ✓
              </div>
              <div>
                <p className="font-medium text-gray-800 text-sm">Return to Shop</p>
                <p className="text-xs text-gray-500">
                  Est. {new Date(Date.now() + estimatedTime * 60000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <button className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-teal-700">
              <MessageCircle size={16} />
              Send ETAs
            </button>
            <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-700">
              <Navigation size={16} />
              Open Maps
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {pendingDeliveries === 0 && (
        <div className="p-8 text-center">
          <CheckCircle className="text-green-400 mx-auto mb-3" size={40} />
          <p className="text-gray-500">No pending deliveries</p>
          <p className="text-xs text-gray-400">All orders for today have been delivered!</p>
        </div>
      )}
    </div>
  );
}
