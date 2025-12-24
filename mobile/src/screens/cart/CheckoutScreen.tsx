import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Button, Loading, Input } from '../../components';
import { api } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { Address, PaymentMethod } from '../../types';

type CheckoutScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const paymentMethods: { id: PaymentMethod; name: string; icon: string }[] = [
  { id: 'CARD', name: 'Card Payment', icon: 'card-outline' },
  { id: 'BANK_TRANSFER', name: 'Bank Transfer', icon: 'business-outline' },
  { id: 'CASH_ON_DELIVERY', name: 'Cash on Delivery', icon: 'cash-outline' },
];

export function CheckoutScreen({ navigation }: CheckoutScreenProps) {
  const { cart, subtotal, fetchCart } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('CARD');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const addressesData = await api.getAddresses();
      setAddresses(addressesData);
      const defaultAddr = addressesData.find((a) => a.isDefault) || addressesData[0];
      if (defaultAddr) setSelectedAddress(defaultAddr);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
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

  const calculateDeliveryFee = () => {
    if (!selectedAddress) return 0;
    if (subtotal >= 100000) return 0;

    const fees: Record<string, number> = {
      Lagos: 2000,
      Ogun: 3000,
      Oyo: 3500,
    };
    return fees[selectedAddress.state] || 5000;
  };

  const deliveryFee = calculateDeliveryFee();
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }

    setPlacing(true);
    try {
      const order = await api.createOrder({
        addressId: selectedAddress.id,
        paymentMethod: selectedPayment,
        deliveryNotes: deliveryNotes || undefined,
      });

      await fetchCart(); // Refresh cart (should be empty now)

      Alert.alert(
        'Order Placed!',
        `Your order #${order.orderNumber} has been placed successfully.`,
        [
          {
            text: 'View Order',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [
                  { name: 'MainTabs' },
                  { name: 'OrderDetail', params: { orderId: order.id } },
                ],
              });
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return <Loading fullScreen message="Loading..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Addresses')}>
              <Text style={styles.changeLink}>
                {addresses.length > 0 ? 'Change' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>

          {selectedAddress ? (
            <View style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
                {selectedAddress.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={styles.addressName}>{selectedAddress.fullName}</Text>
              <Text style={styles.addressText}>{selectedAddress.address}</Text>
              <Text style={styles.addressText}>
                {selectedAddress.city}, {selectedAddress.state}
              </Text>
              <Text style={styles.addressPhone}>{selectedAddress.phone}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addAddressCard}
              onPress={() => navigation.navigate('AddAddress')}
            >
              <Ionicons name="add-circle-outline" size={24} color="#2E7D32" />
              <Text style={styles.addAddressText}>Add delivery address</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentOption,
                selectedPayment === method.id && styles.paymentOptionSelected,
              ]}
              onPress={() => setSelectedPayment(method.id)}
            >
              <Ionicons
                name={method.icon as any}
                size={24}
                color={selectedPayment === method.id ? '#2E7D32' : '#757575'}
              />
              <Text
                style={[
                  styles.paymentText,
                  selectedPayment === method.id && styles.paymentTextSelected,
                ]}
              >
                {method.name}
              </Text>
              {selectedPayment === method.id && (
                <Ionicons name="checkmark-circle" size={24} color="#2E7D32" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Delivery Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Notes (Optional)</Text>
          <Input
            placeholder="E.g., Call before delivery, gate code, etc."
            value={deliveryNotes}
            onChangeText={setDeliveryNotes}
            multiline
            numberOfLines={3}
            style={styles.notesInput}
          />
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Items ({cart?.itemCount || 0})
              </Text>
              <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={[styles.summaryValue, deliveryFee === 0 && styles.freeDelivery]}>
                {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
              </Text>
            </View>
            {deliveryFee === 0 && subtotal >= 100000 && (
              <Text style={styles.freeDeliveryNote}>
                Free delivery on orders over ₦100,000
              </Text>
            )}
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(total)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <Button
          title={`Place Order - ${formatPrice(total)}`}
          onPress={handlePlaceOrder}
          loading={placing}
          disabled={!selectedAddress}
          size="large"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  changeLink: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  addressCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  defaultBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  defaultText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '600',
  },
  addressName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  addressText: {
    fontSize: 14,
    color: '#757575',
    marginTop: 2,
  },
  addressPhone: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  addAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  addAddressText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    marginLeft: 8,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: 8,
  },
  paymentOptionSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E9',
  },
  paymentText: {
    flex: 1,
    fontSize: 14,
    color: '#757575',
    marginLeft: 12,
  },
  paymentTextSelected: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  summaryCard: {
    marginTop: 8,
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
    fontWeight: '500',
  },
  freeDelivery: {
    color: '#2E7D32',
  },
  freeDeliveryNote: {
    fontSize: 12,
    color: '#2E7D32',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E7D32',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
});
