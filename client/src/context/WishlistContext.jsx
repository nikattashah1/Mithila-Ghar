import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

const normalizeProductId = (product) => {
  if (product == null) return null;
  if (typeof product === 'object') {
    const value = product.id ?? product._id ?? product.productId ?? product.slug;
    if (value == null) return null;
    return String(value);
  }
  return String(product);
};

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState({ items: [] });
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const { user } = useAuth();

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist({ items: [] });
      return;
    }
    setWishlistLoading(true);
    try {
      const res = await api.get('/wishlist');
      const items = Array.isArray(res?.data?.wishlist?.items) ? res.data.wishlist.items : [];
      setWishlist({ items });
    } catch (err) {
      console.error('Failed to fetch wishlist', err);
      setWishlist({ items: [] });
    } finally {
      setWishlistLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = useCallback(async (product) => {
    if (!user) {
      alert('Please login to use wishlist');
      return false;
    }

    const productId = normalizeProductId(product);
    const stock = typeof product === 'object' ? Number(product.stock ?? 0) : 0;

    if (!productId) {
      alert('Unable to add this product to wishlist.');
      return false;
    }

    if (stock <= 0) {
      alert('This product is currently out of stock.');
      return false;
    }

    try {
      const payload = { productId: Number.isFinite(Number(productId)) ? Number(productId) : productId };
      await api.post('/wishlist', payload);
      await fetchWishlist();
      return true;
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to add to wishlist';
      alert(message);
      console.error('Failed to add to wishlist', err);
      return false;
    }
  }, [user, fetchWishlist]);

  const removeFromWishlist = useCallback(async (wishItemId) => {
    if (!user) return;
    try {
      await api.delete(`/wishlist/${wishItemId}`);
      await fetchWishlist();
    } catch (err) {
      console.error('Failed to remove from wishlist', err);
    }
  }, [user, fetchWishlist]);

  return (
    <WishlistContext.Provider value={{ wishlist, wishlistLoading, fetchWishlist, addToWishlist, removeFromWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
