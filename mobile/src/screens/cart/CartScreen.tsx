import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Button, CartItemCard, Loading } from '../../components';
import { useCart } from '../../context/CartContext';

type CartScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export function CartScreen({ navigation }: CartScreenProps) {
  const {
    cart,
    isLoading,
    subtotal,
    itemCount,
    fetchCart,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleIncrement = async (productId: string, currentQty: number) => {
    try {
      await updateQuantity(productId, currentQty + 1);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update quantity');
    }
  };

  const handleDecrement = async (productId: string, currentQty: number, minOrder: number) => {
    if (currentQty <= minOrder) {
      handleRemove(productId);
    } else {
      try {
        await updateQuantity(productId, currentQty - 1);
      } catch (error: any) {
        Alert.alert('Error', error.response?.data?.message || 'Failed to update quantity');
      }
    }
  };

  const handleRemove = async (productId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeItem(productId);
            } catch (error: any) {
              Alert.alert('Error', 'Failed to remove item');
            }
          },
        },
      ]
    );
  };

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: clearCart,
        },
      ]
    );
  };

  const handleCheckout = () => {
    navigation.navigate('Checkout');
  };

  if (isLoading && !cart) {
    return <Loading fullScreen message="Loading cart..." />;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={80} color="#BDBDBD" />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptyText}>Add some products to get started</Text>
        <Button
          title="Browse Products"
          onPress={() => navigation.navigate('Home')}
          style={styles.browseButton}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={cart.items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <CartItemCard
            item={item}
            onIncrement={() => handleIncrement(item.productId, item.quantity)}
            onDecrement={() => handleDecrement(item.productId, item.quantity, item.product.minOrder)}
            onRemove={() => handleRemove(item.productId)}
          />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{itemCount} item(s) in cart</Text>
            <Button
              title="Clear All"
              variant="outline"
              size="small"
              onPress={handleClearCart}
            />
          </View>
        }
      />

      {/* Summary Footer */}
      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
        </View>
        <Text style={styles.deliveryNote}>Delivery fee calculated at checkout</Text>
        <Button
          title="Proceed to Checkout"
          onPress={handleCheckout}
          size="large"
          style={styles.checkoutButton}
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#757575',
    marginTop: 8,
    marginBottom: 24,
  },
  browseButton: {
    paddingHorizontal: 32,
  },
  list: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#757575',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  deliveryNote: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 12,
  },
  checkoutButton: {
    marginTop: 8,
  },
});
