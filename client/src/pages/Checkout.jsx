import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const NEPAL_PROVINCES = [
  'Koshi Province',
  'Madhesh Province',
  'Bagmati Province',
  'Gandaki Province',
  'Lumbini Province',
  'Karnali Province',
  'Sudurpashchim Province'
];

const NEPAL_CITY_LIST = [
  'Achham', 'Arghakhanchi', 'Baglung', 'Baitadi', 'Bajhang', 'Bajura', 'Banke', 'Bara', 'Bardiya', 'Bareli',
  'Bhadrapur', 'Bhairahawa', 'Bhaktapur', 'Bhimdatta', 'Bhimeshwor', 'Bhojpur', 'Biratnagar', 'Birendranagar',
  'Birgunj', 'Butwal', 'Chandragiri', 'Chautara', 'Chitwan', 'Dadeldhura', 'Dailekh', 'Darchula', 'Dhangadhi',
  'Dharan', 'Dhankuta', 'Dhanusha', 'Dolakha', 'Dolpa', 'Doti', 'Gajuri', 'Gorkha', 'Gulmi', 'Hetauda',
  'Ilam', 'Janakpur', 'Jajarkot', 'Jumla', 'Kailali', 'Kalikot', 'Kanchanpur', 'Kapilvastu', 'Kathmandu',
  'Kavre', 'Khotang', 'Lahan', 'Lalitpur', 'Lamjung', 'Mahottari', 'Makwanpur', 'Manang', 'Morang', 'Mugu',
  'Mustang', 'Myagdi', 'Nawalparasi', 'Nepalgunj', 'Nuwakot', 'Panchthar', 'Parbat', 'Parsa', 'Patan', 'Pokhara',
  'Rajbiraj', 'Ramechhap', 'Rasuwa', 'Rautahat', 'Rolpa', 'Rukum', 'Rupandehi', 'Salyan', 'Saptari', 'Sarlahi',
  'Sindhuli', 'Sindhupalchok', 'Siraha', 'Sunsari', 'Surkhet', 'Syangja', 'Tanahun', 'Taplejung', 'Terhathum',
  'Tikapur', 'Tansen', 'Udipur', 'Udayapur', 'Vyas', 'Waling', 'Damauli', 'Bharatpur', 'Bharatpur', 'Kaski'
];

const Checkout = () => {
  const { cart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || '',
    email: user?.email || '',
    street: '',
    city: '',
    province: '',
    zip: '',
    phone: user?.phone || ''
  });

  const [paymentMethod, setPaymentMethod] = useState('CARD'); // 'CARD', 'ESEWA', 'WALLET'

  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      addToast('Your cart is empty', 'error');
      navigate('/cart');
    }
    if (!user) {
      addToast('Please login to checkout', 'error');
      navigate('/login?redirect=checkout');
    }
  }, [cart, user, navigate, addToast]);

  const selectedShippingFee = shippingAddress.city && shippingAddress.city.toLowerCase().includes('kathmandu') ? 0 : 100;
  const orderSubtotal = cart ? cart.totalPrice : 0;
  const orderTotal = orderSubtotal + selectedShippingFee;

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    const name = user?.name || shippingAddress.name || 'Guest';
    const email = user?.email || shippingAddress.email || 'guest@example.com';
    const city = shippingAddress.city || 'Kathmandu';
    const province = shippingAddress.province || 'Bagmati';

    try {
      if (paymentMethod === 'ESEWA') {
        const res = await api.post('/payments/esewa/init', {
          shippingDetails: {
            name,
            email,
            phone: shippingAddress.phone,
            city,
            province,
            address: `${shippingAddress.street}, ${city}, ${province}, ${shippingAddress.zip}`
          },
          paymentMethod: 'ESEWA'
        });

        const { paymentUrl, fields, orderId } = res.data;
        addToast('Redirecting to eSewa sandbox...', 'info');

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = paymentUrl;
        form.style.display = 'none';

        Object.entries(fields || {}).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        setTimeout(() => {
          window.location.href = `${window.location.origin}/payment-success?orderId=${orderId}&payment=esewa`;
        }, 2500);
        return;
      }

      const res = await api.post('/payments/card', {
        shippingDetails: {
          name,
          email,
          phone: shippingAddress.phone,
          city,
          province,
          address: `${shippingAddress.street}, ${city}, ${province}, ${shippingAddress.zip}`
        },
        paymentMethod
      });

      const { orderId } = res.data;
      if (paymentMethod === 'WALLET') {
        navigate(`/payment-success?orderId=${orderId}`);
      } else if (paymentMethod === 'CARD') {
        navigate(`/mock-card-test?orderId=${orderId}`);
      } else {
        navigate(`/payment-success?orderId=${orderId}`);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to checkout', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!cart) return null;

  return (
    <div className="container section product-layout">
      <div className="card">
        <div className="body form">
          <h2>Shipping Address</h2>
          <form id="checkoutForm" onSubmit={handleCheckout}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
              <input placeholder="Full Name" value={shippingAddress.name} onChange={(e) => setShippingAddress({...shippingAddress, name: e.target.value})} />
              <input type="email" placeholder="Email" value={shippingAddress.email} onChange={(e) => setShippingAddress({...shippingAddress, email: e.target.value})} />
            </div>
            <input placeholder="Street Address / Ward / Area" required value={shippingAddress.street} onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})} />
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
              <select value={shippingAddress.province} required onChange={(e) => setShippingAddress({ ...shippingAddress, province: e.target.value, city: '' })}>
                <option value="">Select Province</option>
                {NEPAL_PROVINCES.map((province) => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
              <input
                list="nepal-cities"
                value={shippingAddress.city}
                required
                placeholder="City"
                onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
              />
              <datalist id="nepal-cities">
                {NEPAL_CITY_LIST.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
              <input placeholder="Mobile Number" required value={shippingAddress.phone} onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})} />
              <input placeholder="Postal Code" required value={shippingAddress.zip} onChange={(e) => setShippingAddress({...shippingAddress, zip: e.target.value})} />
            </div>

            <h3 style={{marginTop: '24px'}}>Payment Method</h3>
            <div className="payment-options">
              <label className="payment-option">
                <input type="radio" value="CARD" checked={paymentMethod==='CARD'} onChange={(e) => setPaymentMethod(e.target.value)} />
                <span>Debit/Credit Card</span>
              </label>
              <label className="payment-option">
                <input type="radio" value="ESEWA" checked={paymentMethod==='ESEWA'} onChange={(e) => setPaymentMethod(e.target.value)} />
                <span>eSewa</span>
              </label>
              <label className="payment-option">
                <input type="radio" value="WALLET" checked={paymentMethod==='WALLET'} onChange={(e) => setPaymentMethod(e.target.value)} />
                <span>Wallet Balance</span>
              </label>
            </div>
          </form>
        </div>
      </div>
      <div className="card">
        <div className="body">
          <h3>Order Summary</h3>
          {cart.items.map(item => {
            const unitPrice = Number(item?.product?.price ?? item?.price ?? 0);
            const lineTotal = unitPrice * Number(item?.quantity ?? 0);
            return (
              <div key={item.product._id || item._id} style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                 <span>{Number(item.quantity || 0)} x {item.product.name}</span>
                 <span>NPR {Number.isFinite(lineTotal) ? lineTotal : 0}</span>
              </div>
            );
          })}
          <hr style={{borderColor: 'var(--line)', margin: '16px 0'}} />
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
            <span>Subtotal</span>
            <span>NPR {orderSubtotal}</span>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', color:'var(--muted)', marginBottom:'12px'}}>
            <span>Shipping</span>
            <span>{selectedShippingFee === 0 ? 'Free' : `NPR ${selectedShippingFee}`}</span>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', fontWeight:'bold', fontSize:'18px'}}>
            <span>Total</span>
            <span>NPR {orderTotal}</span>
          </div>
          <button type="submit" form="checkoutForm" className="btn" style={{width:'100%', marginTop:'24px'}} disabled={loading}>
            {loading ? 'Processing...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
