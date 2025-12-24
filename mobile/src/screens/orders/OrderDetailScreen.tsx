import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Loading } from '../../components';
import { api } from '../../services/api';
import { Order, OrderStatus } from '../../types';

type OrderDetailScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { orderId: string } }>;
};

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

export function OrderDetailScreen({ navigation, route }: OrderDetailScreenProps) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const data = await api.getOrder(orderId);
      setOrder(data);
      navigation.setOptions({ title: `Order #${data.orderNumber}` });
    } catch (error) {
      console.error('Failed to fetch order:', error);
      Alert.alert('Error', 'Failed to load order');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await api.cancelOrder(orderId);
              fetchOrder();
              Alert.alert('Success', 'Order has been cancelled');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to cancel order');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading || !order) {
    return <Loading fullScreen message="Loading order..." />;
  }

  const canCancel = order.status === 'PENDING';
  const statusColor = statusColors[order.status];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabels[order.status]}
            </Text>
          </View>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
        </View>

        {/* Tracking Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Tracking</Text>
          <View style={styles.timeline}>
            {order.tracking.map((track, index) => (
              <View key={track.id} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View
                    style={[
                      styles.timelineDot,
                      index === 0 && { backgroundColor: statusColor },
                    ]}
                  />
                  {index < order.tracking.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.trackStatus, index === 0 && { color: statusColor }]}>
                    {statusLabels[track.status]}
                  </Text>
                  <Text style={styles.trackDescription}>{track.description}</Text>
                  {track.location && (
                    <Text style={styles.trackLocation}>
                      <Ionicons name="location-outline" size={12} /> {track.location}
                    </Text>
                  )}
                  <Text style={styles.trackDate}>{formatDate(track.createdAt)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items ({order.items.length})</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemImage}>
                {item.product.image ? (
                  <Image source={{ uri: item.product.image }} style={styles.image} />
                ) : (
                  <Ionicons name="cube-outline" size={24} color="#BDBDBD" />
                )}
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.itemPrice}>
                  {formatPrice(item.unitPrice)} x {item.quantity}
                </Text>
              </View>
              <Text style={styles.itemTotal}>{formatPrice(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressCard}>
            <Ionicons name="location-outline" size={20} color="#2E7D32" />
            <View style={styles.addressInfo}>
              <Text style={styles.addressName}>{order.address.fullName}</Text>
              <Text style={styles.addressText}>{order.address.address}</Text>
              <Text style={styles.addressText}>
                {order.address.city}, {order.address.state}
              </Text>
              <Text style={styles.addressPhone}>{order.address.phone}</Text>
            </View>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatPrice(order.subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>
                {order.deliveryFee === 0 ? 'FREE' : formatPrice(order.deliveryFee)}
              </Text>
            </View>
            {order.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, { color: '#2E7D32' }]}>
                  -{formatPrice(order.discount)}
                </Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
            </View>
            <View style={styles.paymentStatus}>
              <Text style={styles.paymentLabel}>Payment: </Text>
              <Text
                style={[
                  styles.paymentValue,
                  { color: order.paymentStatus === 'PAID' ? '#2E7D32' : '#FFA000' },
                ]}
              >
                {order.paymentStatus}
              </Text>
            </View>
          </View>
        </View>

        {/* Cancel Button */}
        {canCancel && (
          <View style={styles.cancelSection}>
            <Button
              title="Cancel Order"
              variant="danger"
              onPress={handleCancelOrder}
              loading={cancelling}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  orderDate: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 60,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E0E0E0',
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  trackStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  trackDescription: {
    fontSize: 13,
    color: '#757575',
    marginTop: 2,
  },
  trackLocation: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  trackDate: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 4,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itemPrice: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  addressInfo: {
    flex: 1,
    marginLeft: 12,
  },
  addressName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  addressText: {
    fontSize: 13,
    color: '#757575',
    marginTop: 2,
  },
  addressPhone: {
    fontSize: 13,
    color: '#333',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#757575',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
  },
  paymentStatus: {
    flexDirection: 'row',
    marginTop: 8,
  },
  paymentLabel: {
    fontSize: 13,
    color: '#757575',
  },
  paymentValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  cancelSection: {
    padding: 16,
  },
});
