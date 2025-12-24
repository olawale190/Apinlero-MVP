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
import { Loading, Button } from '../../components';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

type OrderStats = {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalSpent: number;
};

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.getOrderStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
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

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'location-outline',
      title: 'Delivery Addresses',
      onPress: () => navigation.navigate('Addresses'),
    },
    {
      icon: 'receipt-outline',
      title: 'Order History',
      onPress: () => navigation.navigate('Orders'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      onPress: () => Alert.alert('Coming Soon', 'Help & Support will be available soon'),
    },
    {
      icon: 'information-circle-outline',
      title: 'About Isha Treat',
      onPress: () => Alert.alert('Isha Treat', 'Your trusted wholesale grocery partner.\n\nVersion 1.0.0'),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.name}>
            {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.businessName && (
            <Text style={styles.business}>{user.businessName}</Text>
          )}
        </View>

        {/* Stats */}
        {loading ? (
          <Loading />
        ) : stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalOrders}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.pendingOrders}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatPrice(stats.totalSpent)}</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menu}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <Ionicons name={item.icon as any} size={24} color="#757575" />
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <Button
            title="Logout"
            variant="outline"
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  email: {
    fontSize: 14,
    color: '#757575',
    marginTop: 4,
  },
  business: {
    fontSize: 14,
    color: '#2E7D32',
    marginTop: 4,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  menu: {
    backgroundColor: '#fff',
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  logoutSection: {
    padding: 24,
  },
});
