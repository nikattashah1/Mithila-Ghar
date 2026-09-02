import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const payment = searchParams.get('payment');

  return (
    <div className="container section text-center" style={{padding: '80px 0'}}>
      <div style={{fontSize: '64px', color: 'var(--green)'}}>✓</div>
      <h2 style={{color: 'var(--green)'}}>{payment === 'esewa' ? 'eSewa Sandbox Payment Completed' : 'Payment Successful!'}</h2>
      <p style={{marginBottom: '24px'}}>
        {payment === 'esewa'
          ? 'Your eSewa sandbox payment request was accepted and your order was confirmed.'
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
