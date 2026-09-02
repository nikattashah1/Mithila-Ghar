import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const MockCardTest = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [cardFields, setCardFields] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  const handlePay = async () => {
    setLoading(true);
    try {
      navigate(`/payment-success?orderId=${orderId}`);
    } catch (err) {
      addToast('Unable to complete payment right now.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!orderId) return <div className="container section text-center">Invalid payment session</div>;

  return (
    <div className="container section" style={{maxWidth: '560px'}}>
      <div className="card" style={{borderRadius: '18px'}}>
        <div className="body form" style={{padding: '24px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
            <div>
              <div style={{fontSize:'12px', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--muted)', fontWeight:700}}>Secure checkout</div>
              <h2 style={{margin:'8px 0 0', color:'var(--brand)', fontSize:'2rem'}}>Card Payment</h2>
            </div>
            <div style={{padding:'8px 12px', borderRadius:'999px', background:'#f3e8d8', color:'var(--brand-dark)', fontWeight:700, fontSize:'12px'}}>Verified</div>
          </div>

          <div style={{background:'linear-gradient(135deg,#2d1f1b,#7a2721)', color:'#fff', borderRadius:'18px', padding:'20px', marginBottom:'20px', boxShadow:'0 12px 30px rgba(45,31,27,0.2)'}}>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.7)'}}>
              <span>Card</span>
              <span>Visa</span>
            </div>
            <div style={{margin:'26px 0 16px', fontSize:'1.5rem', letterSpacing:'0.14em'}}>
              {cardFields.number ? cardFields.number.replace(/\d(?=\d{4})/g, '*') : '•••• •••• •••• ••••'}
            </div>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', color:'rgba(255,255,255,0.8)'}}>
              <div>
                <div style={{textTransform:'uppercase', letterSpacing:'0.08em'}}>Card Holder</div>
                <div style={{marginTop:'4px', fontSize:'14px'}}>{cardFields.name || 'YOUR NAME'}</div>
              </div>
              <div>
                <div style={{textTransform:'uppercase', letterSpacing:'0.08em'}}>Expires</div>
                <div style={{marginTop:'4px', fontSize:'14px'}}>{cardFields.expiry || 'MM/YY'}</div>
              </div>
            </div>
          </div>

          <div style={{display:'grid', gap:'14px'}}>
            <input type="text" placeholder="Card number" value={cardFields.number} onChange={e => setCardFields({...cardFields, number: e.target.value.replace(/[^0-9]/g, '').slice(0, 16)})} />
            <div style={{display:'grid', gridTemplateColumns:'1.2fr 0.8fr', gap:'8px'}}>
              <input type="text" placeholder="MM/YY" value={cardFields.expiry} onChange={e => setCardFields({...cardFields, expiry: e.target.value.replace(/[^0-9/]/g, '').slice(0, 5)})} />
              <input type="text" placeholder="CVV" value={cardFields.cvv} onChange={e => setCardFields({...cardFields, cvv: e.target.value.replace(/[^0-9]/g, '').slice(0, 4)})} />
            </div>
            <input type="text" placeholder="Name on card" value={cardFields.name} onChange={e => setCardFields({...cardFields, name: e.target.value})} />
          </div>

          <button className="btn" type="button" style={{width:'100%', marginTop:'22px'}} onClick={handlePay} disabled={loading || !cardFields.number || !cardFields.expiry || !cardFields.cvv || !cardFields.name}>
            {loading ? 'Processing...' : 'Pay Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MockCardTest;
