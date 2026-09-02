import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const Cart = () => {
  const { cart, fetchCart } = useCart();
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateQty = async (productId, currentQty, amount) => {
    const newQty = currentQty + amount;
    if (newQty < 1) return;
    setLoading(true);
    try {
      await api.put(`/cart/${productId}`, { quantity: newQty });
      await fetchCart();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update quantity', 'error');
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = async (productId) => {
    setLoading(true);
    try {
      await api.delete(`/cart/${productId}`);
      await fetchCart();
      addToast('Product removed from cart');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to remove product', 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    try {
      await api.delete('/cart');
      await fetchCart();
      addToast('Cart cleared');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to clear cart', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container section text-center" style={{padding: '80px 0'}}>
        <h2>Your Cart is Empty</h2>
        <p style={{color: 'var(--muted)', margin: '16px 0 24px'}}>Looks like you haven't added anything yet.</p>
        <Link to="/shop" className="btn">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container section cart-page">
      <div className="cart-list">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
          <h2 style={{margin: 0}}>Your Cart</h2>
          <button className="btn ghost" onClick={clearCart} disabled={loading}>Clear Cart</button>
        </div>

        {cart.items.map((item) => {
          const product = item.product || {};
          const unitPrice = Number(product.price || 0);
          const lineTotal = unitPrice * Number(item.quantity || 0);

          return (
            <div key={item._id || product._id} className="card cart-item">
              <div className="cart-item-image">
                {product.images?.[0]?.url ? <img src={product.images[0].url} alt={product.name} /> : <span>No Image</span>}
              </div>

              <div className="cart-item-info">
                <Link to={`/product/${product.slug}`}><h3>{product.name}</h3></Link>
                <div className="price">NPR {unitPrice}</div>
                <div style={{marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap'}}>
                  <div className="qty-control">
                    <button type="button" className="icon-btn" onClick={() => updateQty(product._id, item.quantity, -1)} disabled={loading}>−</button>
                    <span>{item.quantity}</span>
                    <button type="button" className="icon-btn" onClick={() => updateQty(product._id, item.quantity, 1)} disabled={loading}>+</button>
                  </div>
                  <button type="button" className="icon-btn" onClick={() => removeProduct(product._id)} disabled={loading} aria-label={`Delete ${product.name}`} title="Delete item">🗑</button>
                </div>
              </div>

              <div className="cart-item-price">NPR {lineTotal}</div>
            </div>
          );
        })}
      </div>

      <aside className="card cart-summary">
        <div className="body">
          <h3>Order Summary</h3>
          <div style={{display: 'flex', justifyContent: 'space-between', margin: '16px 0'}}>
            <span>Subtotal</span>
            <span>NPR {cart.totalPrice}</span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', marginBottom: '18px'}}>
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          <Link to="/checkout" className="btn" style={{display: 'block', textAlign: 'center'}}>Proceed to Checkout</Link>
        </div>
      </aside>
    </div>
  );
};

export default Cart;
