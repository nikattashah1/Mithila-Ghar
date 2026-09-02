import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, login } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders');
        setOrders(res.data.orders || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  const updatePassword = async (event) => {
    event.preventDefault();
    setPasswordSaving(true);
    setPasswordMessage('');
    try {
      const res = await api.put('/auth/me', { currentPassword, newPassword });
      login({ ...user, ...res.data.user });
      setCurrentPassword('');
      setNewPassword('');
      setPasswordMessage('Password updated successfully.');
    } catch (err) {
      setPasswordMessage(err.response?.data?.message || 'Unable to update password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!user) return <div className="container section">Loading your account...</div>;

  return (
    <div className="container section">
      <h2>Welcome, {user?.name}</h2>
      <p style={{color: 'var(--muted)', marginBottom: '32px'}}>Manage your profile and orders here.</p>
      
      <div className="card">
        <div className="body">
          <h3>Your Orders</h3>
          {loading ? (
             <p>Loading...</p>
          ) : orders.length === 0 ? (
             <p>You haven't placed any orders yet. <Link to="/shop" style={{color: 'var(--brand)'}}>Start shopping.</Link></p>
          ) : (
             <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '16px'}}>
               <thead>
                 <tr style={{borderBottom: '1px solid var(--line)'}}>
                   <th style={{padding: '8px 0'}}>Order ID</th>
                   <th style={{padding: '8px 0'}}>Date</th>
                   <th style={{padding: '8px 0'}}>Status</th>
                   <th style={{padding: '8px 0'}}>Total</th>
                 </tr>
               </thead>
               <tbody>
                 {orders.map(o => {
                   const orderId = o.orderNumber || o._id || o.id;
                   return (
                     <tr key={o._id || o.id} style={{borderBottom: '1px solid var(--line)'}}>
                       <td style={{padding: '8px 0'}}>{String(orderId).slice(0, 8)}{String(orderId).length > 8 ? '...' : ''}</td>
                       <td style={{padding: '8px 0'}}>{new Date(o.createdAt).toLocaleDateString()}</td>
                       <td style={{padding: '8px 0'}}>{o.status}</td>
                       <td style={{padding: '8px 0'}}>NPR {o.total}</td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
          )}
        </div>
      </div>

      <div className="card" style={{marginTop: '24px'}}>
        <div className="body">
          <h3>Change Password</h3>
          <form onSubmit={updatePassword} className="form" style={{maxWidth: '520px', marginTop: '16px'}}>
            <label htmlFor="current-password">Current password</label>
            <input id="current-password" type="password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
            <label htmlFor="new-password">New password</label>
            <input id="new-password" type="password" required minLength="8" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            <button className="btn" type="submit" disabled={passwordSaving}>{passwordSaving ? 'Updating...' : 'Update Password'}</button>
            {passwordMessage && <p style={{color: passwordMessage.includes('successfully') ? 'var(--green)' : 'var(--red)'}}>{passwordMessage}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
