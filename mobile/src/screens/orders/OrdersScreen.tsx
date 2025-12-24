import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { OrderCard, Loading, Button } from '../../components';
import { api } from '../../services/api';
import { Order } from '../../types';

type OrdersScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export function OrdersScreen({ navigation }: OrdersScreenProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchOrders = useCallback(async (pageNum: number = 1, refresh: boolean = false) => {
    if (refresh) {
      setRefreshing(true);
    } else if (pageNum > 1) {
      setLoadingMore(true);
    }

    try {
      const data = await api.getOrders({ page: pageNum, limit: 10 });

      if (pageNum === 1) {
        setOrders(data.orders);
      } else {
        setOrders((prev) => [...prev, ...data.orders]);
      }

      setHasMore(pageNum < data.pagination.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  const onRefresh = useCallback(() => {
    fetchOrders(1, true);
  }, [fetchOrders]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchOrders(page + 1);
    }
  };

  if (loading) {
    return <Loading fullScreen message="Loading orders..." />;
  }

  if (orders.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={80} color="#BDBDBD" />
        <Text style={styles.emptyTitle}>No orders yet</Text>
        <Text style={styles.emptyText}>Your orders will appear here</Text>
        <Button
          title="Start Shopping"
          onPress={() => navigation.navigate('Home')}
          style={styles.shopButton}
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <Loading /> : null}
      />
    </View>
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
  shopButton: {
    paddingHorizontal: 32,
  },
  list: {
    padding: 16,
  },
});
