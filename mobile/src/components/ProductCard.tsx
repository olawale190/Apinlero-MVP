import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAddToCart?: () => void;
}

export function ProductCard({ product, onPress, onAddToCart }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const isOutOfStock = product.stock <= 0;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="cube-outline" size={40} color="#BDBDBD" />
          </View>
        )}
        {isOutOfStock && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
        {product.isFeatured && !isOutOfStock && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.category}>{product.category.name}</Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.price}>
          {formatPrice(product.price)}/{product.unit}
        </Text>
        <Text style={styles.minOrder}>Min: {product.minOrder} {product.unit}</Text>

        {onAddToCart && !isOutOfStock && (
          <TouchableOpacity style={styles.addButton} onPress={onAddToCart}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  imageContainer: {
    height: 140,
    backgroundColor: '#F5F5F5',
    position: 'relative',
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
  outOfStockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#D32F2F',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFA000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featuredText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  info: {
    padding: 12,
  },
  category: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '500',
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    lineHeight: 20,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 2,
  },
  minOrder: {
    fontSize: 11,
    color: '#757575',
  },
  addButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: '#2E7D32',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
