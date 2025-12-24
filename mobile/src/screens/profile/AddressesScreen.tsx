import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Loading, Button } from '../../components';
import { api } from '../../services/api';
import { Address } from '../../types';

type AddressesScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export function AddressesScreen({ navigation }: AddressesScreenProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAddresses = useCallback(async () => {
    try {
      const data = await api.getAddresses();
      setAddresses(data);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchAddresses);
    return unsubscribe;
  }, [navigation, fetchAddresses]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAddresses();
  }, [fetchAddresses]);

  const handleSetDefault = async (addressId: string) => {
    try {
      await api.setDefaultAddress(addressId);
      fetchAddresses();
    } catch (error) {
      Alert.alert('Error', 'Failed to set default address');
    }
  };

  const handleDelete = (addressId: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteAddress(addressId);
              fetchAddresses();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete address');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <Loading fullScreen message="Loading addresses..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />
        }
        renderItem={({ item }) => (
          <View style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <View style={styles.labelContainer}>
                <Text style={styles.addressLabel}>{item.label}</Text>
                {item.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('EditAddress', { address: item })}
                >
                  <Ionicons name="create-outline" size={20} color="#757575" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(item.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#D32F2F" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.addressName}>{item.fullName}</Text>
            <Text style={styles.addressText}>{item.address}</Text>
            <Text style={styles.addressText}>
              {item.city}, {item.state}
            </Text>
            {item.landmark && (
              <Text style={styles.addressLandmark}>Near: {item.landmark}</Text>
            )}
            <Text style={styles.addressPhone}>{item.phone}</Text>

            {!item.isDefault && (
              <TouchableOpacity
                style={styles.setDefaultButton}
                onPress={() => handleSetDefault(item.id)}
              >
                <Text style={styles.setDefaultText}>Set as Default</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={60} color="#BDBDBD" />
            <Text style={styles.emptyTitle}>No addresses saved</Text>
            <Text style={styles.emptyText}>Add an address for faster checkout</Text>
          </View>
        }
      />

      {/* Add Address Button */}
      <View style={styles.footer}>
        <Button
          title="Add New Address"
          onPress={() => navigation.navigate('AddAddress')}
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
  list: {
    padding: 16,
    flexGrow: 1,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '700',
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
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  addressName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#757575',
    marginTop: 2,
  },
  addressLandmark: {
    fontSize: 13,
    color: '#757575',
    fontStyle: 'italic',
    marginTop: 4,
  },
  addressPhone: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
  },
  setDefaultButton: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  setDefaultText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#757575',
    marginTop: 8,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
});
