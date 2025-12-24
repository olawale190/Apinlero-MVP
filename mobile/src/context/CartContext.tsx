import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Cart } from '../types';
import { api } from '../services/api';

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  itemCount: number;
  subtotal: number;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const cartData = await api.getCart();
      setCart(cartData);
    } catch (error) {
      console.log('Failed to fetch cart');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addToCart = async (productId: string, quantity: number) => {
    setIsLoading(true);
    try {
      const updatedCart = await api.addToCart(productId, quantity);
      setCart(updatedCart);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    setIsLoading(true);
    try {
      const updatedCart = await api.updateCartItem(productId, quantity);
      setCart(updatedCart);
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (productId: string) => {
    setIsLoading(true);
    try {
      const updatedCart = await api.removeFromCart(productId);
      setCart(updatedCart);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    try {
      const updatedCart = await api.clearCart();
      setCart(updatedCart);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        itemCount: cart?.itemCount ?? 0,
        subtotal: cart?.subtotal ?? 0,
        fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
