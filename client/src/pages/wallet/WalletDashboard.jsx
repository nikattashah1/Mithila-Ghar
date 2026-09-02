import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const WalletDashboard = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  
  const [transferData, setTransferData] = useState({ recipientUsername: '', amount: '', note: '' });
  const [transferring, setTransferring] = useState(false);

  const fetchWallet = async () => {
    try {
      const res = await api.get('/wallet');
      setWallet(res.data.wallet);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/wallet/transactions');
      setTransactions(res.data.transactions || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
       await fetchWallet();
       await fetchHistory();
       setLoading(false);
    };
    init();
  }, []);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setTransferring(true);
    try {
      await api.post('/wallet/transfer', {
         receiverEmail: transferData.recipientUsername.trim(),
         amount: Number(transferData.amount),
         description: transferData.note
      });
      addToast('Transfer successful!', 'success');
      setTransferData({ recipientUsername: '', amount: '', note: '' });
      await fetchWallet();
      await fetchHistory();
    } catch (err) {
      addToast(err.response?.data?.message || 'Transfer failed', 'error');
    } finally {
      setTransferring(false);
    }
  };

  if (loading) return <div className="container section">Loading Wallet...</div>;

  return (
    <div className="container section product-layout">
      <div>
        <div className="card" style={{background: 'var(--brand)', color: 'white', border: 'none'}}>
          <div className="body" style={{padding: '32px'}}>
             <h2 style={{color: 'white', margin: 0, opacity: 0.9}}>Mithila Ghar Wallet</h2>
             <p style={{opacity: 0.8, fontSize: '14px', marginBottom: '24px'}}>Available Balance</p>
             <div style={{fontSize: '48px', fontWeight: 'bold'}}>
                NPR {wallet?.balance?.toFixed(2) || '0.00'}
             </div>
          </div>
        </div>

        <div className="card" style={{marginTop: '24px'}}>
           <div className="body form">
             <h3>Send Money (P2P)</h3>
             <form onSubmit={handleTransfer}>
                <input placeholder="Recipient Username or Email" required value={transferData.recipientUsername} onChange={e => setTransferData({...transferData, recipientUsername: e.target.value})} />
                <input type="number" placeholder="Amount (NPR)" required min="1" value={transferData.amount} onChange={e => setTransferData({...transferData, amount: e.target.value})} />
                <input placeholder="Note (e.g. Festival Gift)" value={transferData.note} onChange={e => setTransferData({...transferData, note: e.target.value})} />
                <button type="submit" className="btn" disabled={transferring} style={{width: '100%', marginTop: '16px'}}>
                  {transferring ? 'Processing...' : 'Send Money'}
                </button>
             </form>
           </div>
        </div>
      </div>

      <div className="card">
         <div className="body">
            <h3>Transaction History</h3>
            {transactions.length === 0 ? (
               <p style={{color: 'var(--muted)'}}>No transactions found.</p>
            ) : (
               <div style={{display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px'}}>
                  {transactions.map(t => (
                     <div key={t._id} style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '12px'}}>
                        <div>
                           <div style={{fontWeight: 'bold'}}>{t.type.replace('_', ' ')}</div>
                           <div style={{fontSize: '13px', color: 'var(--muted)'}}>{t.note || t.referenceId}</div>
                           <div style={{fontSize: '12px', color: '#999'}}>{new Date(t.createdAt).toLocaleString()}</div>
                        </div>
                        <div style={{fontWeight: 'bold', color: (t.type === 'TRANSFER_SENT' || t.type === 'PURCHASE') ? 'var(--brand)' : 'var(--green)'}}>
                           {(t.type === 'TRANSFER_SENT' || t.type === 'PURCHASE') ? '-' : '+'}NPR {t.amount}
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default WalletDashboard;
