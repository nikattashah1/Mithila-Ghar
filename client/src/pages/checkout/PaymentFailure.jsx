import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const PaymentFailure = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const payment = searchParams.get('payment');

  return (
    <div className="container section text-center" style={{padding: '80px 0'}}>
      <div style={{fontSize: '64px', color: 'var(--brand)'}}>✗</div>
      <h2 style={{color: 'var(--brand)'}}>{payment === 'esewa' ? 'eSewa Sandbox Payment Failed' : 'Payment Failed'}</h2>
      <p style={{marginBottom: '24px'}}>
        {payment === 'esewa'
          ? 'The eSewa sandbox payment was not completed. Please try again or use another payment method.'
          : `Your payment for order ${orderId || 'details'} could not be processed.`}
      </p>

      <div style={{display: 'flex', gap: '16px', justifyContent: 'center'}}>
        <Link to="/checkout" className="btn">Try Again</Link>
        <Link to="/contact" className="btn ghost">Contact Support</Link>
      </div>
    </div>
  );
};

export default PaymentFailure;
