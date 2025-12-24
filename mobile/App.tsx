import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider, useCart } from './src/context/CartContext';
import { AppNavigator } from './src/navigation/AppNavigator';

// Cart initializer component
function CartInitializer({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { fetchCart } = useCart();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  return <>{children}</>;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <CartProvider>
          <CartInitializer>
            <AppNavigator />
          </CartInitializer>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
