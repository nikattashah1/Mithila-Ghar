import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
       try {
         const res = await api.get('/admin/analytics');
         setStats(res.data.stats);
       } catch (err) {
         console.error(err);
       } finally {
         setLoading(false);
       }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="container section">Loading Admin Data...</div>;

  return (
    <div className="container section">
      <h2>Admin Dashboard</h2>
      <p style={{color: 'var(--muted)', marginBottom: '32px'}}>Overview of the Mithila Ghar Marketplace.</p>

      <div className="grid" style={{gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px'}}>
         <div className="card text-center" style={{padding: '24px'}}>
           <div style={{fontSize: '32px', fontWeight: 'bold'}}>{stats?.totalOrders || 0}</div>
           <div style={{color: 'var(--muted)'}}>Total Orders</div>
         </div>
         <div className="card text-center" style={{padding: '24px'}}>
           <div style={{fontSize: '32px', fontWeight: 'bold'}}>NPR {stats?.totalRevenue || 0}</div>
           <div style={{color: 'var(--muted)'}}>Total Revenue</div>
         </div>
         <div className="card text-center" style={{padding: '24px'}}>
           <div style={{fontSize: '32px', fontWeight: 'bold'}}>{stats?.totalUsers || 0}</div>
           <div style={{color: 'var(--muted)'}}>Total Users</div>
         </div>
         <div className="card text-center" style={{padding: '24px'}}>
           <div style={{fontSize: '32px', fontWeight: 'bold'}}>{stats?.totalProducts || 0}</div>
           <div style={{color: 'var(--muted)'}}>Products</div>
         </div>
      </div>

      <div style={{marginTop: '32px'}}>
         <h3>Recent Requirements Tracking (Labs)</h3>
         <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '16px', background: 'white'}}>
           <thead>
             <tr style={{borderBottom: '2px solid var(--line)'}}>
               <th style={{padding: '12px'}}>Feature</th>
               <th style={{padding: '12px'}}>Status</th>
             </tr>
           </thead>
           <tbody>
             <tr style={{borderBottom: '1px solid var(--line)'}}>
               <td style={{padding: '12px'}}>Lab 3: Node.js Dynamic Server Cart</td>
               <td style={{padding: '12px', color: 'var(--green)', fontWeight: 'bold'}}>Implemented ✓</td>
             </tr>
             <tr style={{borderBottom: '1px solid var(--line)'}}>
               <td style={{padding: '12px'}}>Lab 4: Card Payment Sim & eSewa</td>
               <td style={{padding: '12px', color: 'var(--green)', fontWeight: 'bold'}}>Implemented ✓</td>
             </tr>
             <tr style={{borderBottom: '1px solid var(--line)'}}>
               <td style={{padding: '12px'}}>Lab 5: Digital Wallet & P2P API</td>
               <td style={{padding: '12px', color: 'var(--green)', fontWeight: 'bold'}}>Implemented ✓</td>
             </tr>
             <tr style={{borderBottom: '1px solid var(--line)'}}>
               <td style={{padding: '12px'}}>Lab 6: Security (JWT, bcrypt, rate limiting)</td>
               <td style={{padding: '12px', color: 'var(--green)', fontWeight: 'bold'}}>Implemented ✓</td>
             </tr>
             <tr style={{borderBottom: '1px solid var(--line)'}}>
               <td style={{padding: '12px'}}>Lab 7 & 8 & 9 & 10: Marketing, Events, Analytics, Recs</td>
               <td style={{padding: '12px', color: 'var(--green)', fontWeight: 'bold'}}>APIs Built ✓</td>
             </tr>
           </tbody>
         </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
