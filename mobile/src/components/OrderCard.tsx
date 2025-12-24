import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order, OrderStatus } from '../types';

interface OrderCardProps {
  order: Order;
  onPress: () => void;
}

const statusColors: Record<OrderStatus, string> = {
  PENDING: '#FFA000',
  CONFIRMED: '#1976D2',
  PROCESSING: '#7B1FA2',
  SHIPPED: '#0097A7',
  OUT_FOR_DELIVERY: '#388E3C',
  DELIVERED: '#2E7D32',
  CANCELLED: '#D32F2F',
};

const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export function OrderCard({ order, onPress }: OrderCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const statusColor = statusColors[order.status];

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <Text style={styles.date}>{formatDate(order.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusLabels[order.status]}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.itemsPreview}>
        <Text style={styles.itemCount}>{order.items.length} item(s)</Text>
        <Text style={styles.itemNames} numberOfLines={1}>
          {order.items.map((item) => item.productName).join(', ')}
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{formatPrice(order.total)}</Text>
        </View>
        <View style={styles.viewButton}>
          <Text style={styles.viewButtonText}>View Details</Text>
          <Ionicons name="chevron-forward" size={16} color="#2E7D32" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  date: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  itemsPreview: {
    marginBottom: 12,
  },
  itemCount: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  itemNames: {
    fontSize: 14,
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalContainer: {},
  totalLabel: {
    fontSize: 12,
    color: '#757575',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
});
