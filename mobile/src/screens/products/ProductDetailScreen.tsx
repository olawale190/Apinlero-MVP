import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Loading } from '../../components';
import { api } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { Product } from '../../types';

type ProductDetailScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { productId: string } }>;
};

export function ProductDetailScreen({ navigation, route }: ProductDetailScreenProps) {
  const { productId } = route.params;
  const { addToCart, isLoading: cartLoading } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const data = await api.getProduct(productId);
      setProduct(data);
      setQuantity(data.minOrder);
      navigation.setOptions({ title: data.name });
    } catch (error) {
      console.error('Failed to fetch product:', error);
      Alert.alert('Error', 'Failed to load product');
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

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      await addToCart(product.id, quantity);
      Alert.alert('Success', `${product.name} added to cart`, [
        { text: 'Continue Shopping', style: 'cancel' },
        { text: 'Go to Cart', onPress: () => navigation.navigate('Cart') },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add to cart');
    }
  };

  const incrementQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (product && quantity > product.minOrder) {
      setQuantity(quantity - 1);
    }
  };

  if (loading || !product) {
    return <Loading fullScreen message="Loading product..." />;
  }

  const isOutOfStock = product.stock <= 0;
  const totalPrice = product.price * quantity;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {product.image ? (
            <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="cube-outline" size={80} color="#BDBDBD" />
            </View>
          )}
          {isOutOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.category}>{product.category.name}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.sku}>SKU: {product.sku}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            <Text style={styles.unit}>per {product.unit}</Text>
          </View>

          {product.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Ionicons name="cube-outline" size={20} color="#757575" />
              <Text style={styles.detailText}>
                Min Order: {product.minOrder} {product.unit}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color={product.stock > 0 ? '#2E7D32' : '#D32F2F'} />
              <Text style={[styles.detailText, { color: product.stock > 0 ? '#2E7D32' : '#D32F2F' }]}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </Text>
            </View>
          </View>

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Quantity</Text>
              <View style={styles.quantityRow}>
                <View style={styles.quantityContainer}>
                  <Button
                    title="-"
                    variant="outline"
                    size="small"
                    onPress={decrementQuantity}
                    disabled={quantity <= product.minOrder}
                  />
                  <Text style={styles.quantity}>{quantity}</Text>
                  <Button
                    title="+"
                    variant="outline"
                    size="small"
                    onPress={incrementQuantity}
                    disabled={quantity >= product.stock}
                  />
                </View>
                <Text style={styles.totalPrice}>{formatPrice(totalPrice)}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      <View style={styles.footer}>
        <Button
          title={isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          onPress={handleAddToCart}
          loading={cartLoading}
          disabled={isOutOfStock}
          size="large"
          style={styles.addButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageContainer: {
    height: 300,
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
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  infoContainer: {
    padding: 16,
  },
  category: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  sku: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2E7D32',
  },
  unit: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 8,
  },
  descriptionContainer: {
    marginBottom: 16,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 22,
  },
  detailsContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 8,
  },
  quantitySection: {
    marginTop: 8,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
    minWidth: 40,
    textAlign: 'center',
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2E7D32',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  addButton: {
    width: '100%',
  },
});
