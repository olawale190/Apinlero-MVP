import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartItem } from '../types';

interface CartItemCardProps {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

export function CartItemCard({ item, onIncrement, onDecrement, onRemove }: CartItemCardProps) {
  const { product, quantity } = item;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const itemTotal = product.price * quantity;

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="cube-outline" size={24} color="#BDBDBD" />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
            <Ionicons name="trash-outline" size={18} color="#D32F2F" />
          </TouchableOpacity>
        </View>

        <Text style={styles.price}>
          {formatPrice(product.price)}/{product.unit}
        </Text>

        <View style={styles.footer}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={[styles.quantityButton, quantity <= product.minOrder && styles.quantityButtonDisabled]}
              onPress={onDecrement}
              disabled={quantity <= product.minOrder}
            >
              <Ionicons name="remove" size={18} color={quantity <= product.minOrder ? '#BDBDBD' : '#333'} />
            </TouchableOpacity>
            <Text style={styles.quantity}>{quantity}</Text>
            <TouchableOpacity
              style={[styles.quantityButton, quantity >= product.stock && styles.quantityButtonDisabled]}
              onPress={onIncrement}
              disabled={quantity >= product.stock}
            >
              <Ionicons name="add" size={18} color={quantity >= product.stock ? '#BDBDBD' : '#333'} />
            </TouchableOpacity>
          </View>

          <Text style={styles.total}>{formatPrice(itemTotal)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
  price: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  quantityButton: {
    padding: 8,
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantity: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'center',
  },
  total: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
  },
});
