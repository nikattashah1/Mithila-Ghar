import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);
  const { user } = useAuth();

  const fetchCart = async () => {
    setCartLoading(true);
    try {
      const res = await api.get('/cart');
      setCart({ items: res.data.items || [], totalPrice: res.data.subtotal || 0 });
    } catch (err) {
      console.error('Failed to fetch cart', err);
    } finally {
      setCartLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (product, quantity = 1) => {
    let productId = typeof product === 'object' ? (product.id || product._id) : product;
    try {
      const res = await api.post('/cart', { productId, quantity });
      setCart({ items: res.data.items || [], totalPrice: res.data.subtotal || 0 });
    } catch (err) {
      console.error('Failed to add to cart', err);
      throw err;
    }
  };

  return (
    <CartContext.Provider value={{ cart, cartLoading, fetchCart, addToCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
