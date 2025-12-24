import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ProductCard, Loading } from '../../components';
import { api } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { Product } from '../../types';

type ProductsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
};

export function ProductsScreen({ navigation, route }: ProductsScreenProps) {
  const { categoryId, categoryName, featured, searchQuery } = route.params || {};
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchProducts = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
    if (refresh) {
      setRefreshing(true);
    } else if (pageNum > 1) {
      setLoadingMore(true);
    }

    try {
      let data;
      if (searchQuery) {
        data = { products: await api.searchProducts(searchQuery), pagination: { totalPages: 1 } };
      } else if (featured) {
        data = { products: await api.getFeaturedProducts(50), pagination: { totalPages: 1 } };
      } else {
        data = await api.getProducts({
          page: pageNum,
          limit: 20,
          categoryId,
        });
      }

      if (pageNum === 1) {
        setProducts(data.products);
      } else {
        setProducts((prev) => [...prev, ...data.products]);
      }

      setHasMore(pageNum < data.pagination.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [categoryId, featured, searchQuery]);

  useEffect(() => {
    navigation.setOptions({
      title: categoryName || (featured ? 'Featured' : searchQuery ? `Search: ${searchQuery}` : 'Products'),
    });
    fetchProducts(1);
  }, [navigation, categoryName, featured, searchQuery, fetchProducts]);

  const onRefresh = useCallback(() => {
    fetchProducts(1, true);
  }, [fetchProducts]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchProducts(page + 1);
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product.id, product.minOrder);
      Alert.alert('Added to Cart', `${product.name} added to cart`);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add to cart');
    }
  };

  if (loading) {
    return <Loading fullScreen message="Loading products..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <View style={styles.productWrapper}>
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
              onAddToCart={() => handleAddToCart(item)}
            />
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <Loading /> : null}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Loading message="No products found" />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  list: {
    padding: 12,
  },
  row: {
    justifyContent: 'space-between',
  },
  productWrapper: {
    width: '48%',
  },
  empty: {
    flex: 1,
    paddingTop: 40,
  },
});
