import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { trackEventOnce } from '../../services/analytics.js';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const payment = searchParams.get('payment');

  useEffect(() => {
    if (!orderId) return;

    let active = true;
    const trackPurchase = async () => {
      try {
        const response = await api.get(`/orders/${orderId}`);
        const order = response.data.order;
        if (!active || !order) return;

        trackEventOnce('Purchase', String(order.id || order._id || orderId), {
          content_ids: (order.orderItems || []).map((item) => String(item.product)).filter(Boolean),
          content_type: 'product',
          value: Number(order.total || 0),
          currency: 'NPR',
          order_id: String(order.id || order._id || orderId),
          payment_method: payment || order.paymentMethod || 'unknown'
        });
      } catch (error) {
        console.error('Unable to load completed order for analytics:', error);
      }
    };

    trackPurchase();
    return () => { active = false; };
  }, [orderId, payment]);

  return (
    <div className="container section text-center" style={{padding: '80px 0'}}>
      <div style={{fontSize: '64px', color: 'var(--green)'}}>✓</div>
      <h2 style={{color: 'var(--green)'}}>
        {payment === 'esewa' ? 'eSewa Sandbox Payment Completed' : payment === 'cod' ? 'Order Placed Successfully' : 'Payment Successful!'}
      </h2>
      <p style={{marginBottom: '24px'}}>
        {payment === 'esewa'
          ? 'Your eSewa sandbox payment request was accepted and your order was confirmed.'
          : payment === 'cod'
            ? 'Your order was confirmed. Please pay the delivery person when your order arrives.'
          : `Your order ${orderId || 'details'} has been confirmed.`}
      </p>

      <div style={{display: 'flex', gap: '16px', justifyContent: 'center'}}>
        <Link to="/dashboard" className="btn">View Orders</Link>
        <Link to="/shop" className="btn ghost">Continue Shopping</Link>
      </div>
    </div>
  );
};

export default PaymentSuccess;
