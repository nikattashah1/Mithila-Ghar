import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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
    </div>
  );
};

export default Dashboard;
