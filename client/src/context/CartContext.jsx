import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const normalizeCartPayload = (payload = {}) => {
  const cart = payload.cart || payload;
  const items = Array.isArray(cart?.items) ? cart.items : [];

  return {
    items,
    totalPrice: Number(cart?.subtotal ?? cart?.totalPrice ?? 0),
    subtotal: Number(cart?.subtotal ?? cart?.totalPrice ?? 0)
  };
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], totalPrice: 0, subtotal: 0 });
  const [cartLoading, setCartLoading] = useState(false);
  const { user } = useAuth();

  const fetchCart = async () => {
    setCartLoading(true);
    try {
      const res = await api.get('/cart');
      setCart(normalizeCartPayload(res.data));
    } catch (err) {
      console.error('Failed to fetch cart', err);
      setCart({ items: [], totalPrice: 0, subtotal: 0 });
    } finally {
      setCartLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (product, quantity = 1) => {
    const productId = typeof product === 'object' ? (product.id || product._id) : product;

    try {
      const res = await api.post('/cart', { productId, quantity });
      const nextCart = normalizeCartPayload(res.data);
      setCart(nextCart);
      return nextCart;
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
