import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user, login } = useAuth();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [productForm, setProductForm] = useState({ name: '', price: '', stock: '', description: '', image: '' });
  const [editingProductId, setEditingProductId] = useState(null);
  const [productMessage, setProductMessage] = useState('');

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/analytics');
      setStats(res.data.cards || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get('/admin/orders');
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      const [productsRes, contactsRes, usersRes, categoriesRes] = await Promise.all([
        api.get('/admin/products'),
        api.get('/admin/contacts'),
        api.get('/admin/users'),
        api.get('/admin/categories')
      ]);
      setProducts(productsRes.data.products || []);
      setContacts(contactsRes.data.messages || []);
      setUsers(usersRes.data.users || []);
      setCategories(categoriesRes.data.categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchOrders();
    fetchAdminData();
  }, []);

  const updateOrderStatus = async (orderId, status) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await api.put(`/admin/orders/${orderId}`, { status });
      setOrders((currentOrders) => currentOrders.map((order) => (
        order.id === orderId ? res.data.order : order
      )));
      await fetchStats();
    } catch (err) {
      console.error(err);
      await fetchOrders();
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const updateProfile = async (event) => {
    event.preventDefault();
    setProfileSaving(true);
    setProfileMessage('');
    try {
      const res = await api.put('/auth/me', { name: profileName, currentPassword, newPassword });
      login({ ...user, ...res.data.user });
      setCurrentPassword('');
      setNewPassword('');
      setProfileMessage('Profile updated successfully.');
    } catch (err) {
      setProfileMessage(err.response?.data?.message || 'Unable to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setProductMessage('');
    try {
      const payload = { ...productForm, price: Number(productForm.price), stock: Number(productForm.stock) };
      if (editingProductId) {
        const res = await api.put(`/admin/products/${editingProductId}`, payload);
        setProducts((current) => current.map((product) => product.id === editingProductId ? { ...product, ...res.data.product } : product));
        setProductMessage('Product updated successfully.');
      } else {
        const res = await api.post('/admin/products', payload);
        setProducts((current) => [res.data.product, ...current]);
        setProductMessage('Product added successfully.');
      }
      setProductForm({ name: '', price: '', stock: '', description: '', image: '' });
      setEditingProductId(null);
      await fetchStats();
    } catch (err) {
      setProductMessage(err.response?.data?.message || 'Unable to save product.');
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await api.delete(`/admin/products/${productId}`);
      setProducts((current) => current.filter((product) => product.id !== productId));
      await fetchStats();
    } catch (err) {
      setProductMessage(err.response?.data?.message || 'Unable to delete product.');
    }
  };

  const startEditingProduct = (product) => {
    setEditingProductId(product.id);
    setProductForm({ name: product.name || '', price: product.price || '', stock: product.stock || '', description: product.description || '', image: product.image || '', category_id: product.category_id || product.category?.id || '' });
    setProductMessage('');
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Delete this customer account permanently?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((current) => current.filter((account) => account.id !== userId));
      await fetchStats();
    } catch (err) {
      setProfileMessage(err.response?.data?.message || 'Unable to delete user.');
    }
  };

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

      <div className="card" style={{marginTop: '32px'}}>
        <div className="body">
          <h3>Admin Profile</h3>
          <p style={{color: 'var(--muted)'}}>Manage the account details used for administration.</p>
          <form onSubmit={updateProfile} className="form" style={{maxWidth: '520px', marginTop: '16px'}}>
            <label htmlFor="admin-name">Display name</label>
            <input id="admin-name" value={profileName} required onChange={(event) => setProfileName(event.target.value)} />
            <label htmlFor="admin-email">Login email</label>
            <input id="admin-email" type="email" value={user?.email || ''} disabled />
            <label htmlFor="admin-current-password">Current password</label>
            <input id="admin-current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
            <label htmlFor="admin-new-password">New password</label>
            <input id="admin-new-password" type="password" minLength="8" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            <button className="btn" type="submit" disabled={profileSaving}>
              {profileSaving ? 'Saving...' : 'Save Profile'}
            </button>
            {profileMessage && <p style={{color: profileMessage.includes('successfully') ? 'var(--green)' : 'var(--red)'}}>{profileMessage}</p>}
          </form>
        </div>
      </div>

      <div style={{marginTop: '32px'}}>
         <h3>Order Management</h3>
         {ordersLoading ? (
           <p>Loading orders...</p>
         ) : orders.length === 0 ? (
           <p>No orders found.</p>
         ) : (
           <div style={{overflowX: 'auto'}}>
             <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '16px', background: 'white'}}>
               <thead>
                 <tr style={{borderBottom: '2px solid var(--line)'}}>
                   <th style={{padding: '12px'}}>Order</th>
                   <th style={{padding: '12px'}}>Customer</th>
                   <th style={{padding: '12px'}}>Email</th>
                   <th style={{padding: '12px'}}>Total</th>
                   <th style={{padding: '12px'}}>Status</th>
                 </tr>
               </thead>
               <tbody>
                 {orders.map((order) => (
                   <tr key={order.id} style={{borderBottom: '1px solid var(--line)'}}>
                     <td style={{padding: '12px'}}>{order.order_number}</td>
                     <td style={{padding: '12px'}}>{order.shipping_name}</td>
                     <td style={{padding: '12px'}}>{order.shipping_email}</td>
                     <td style={{padding: '12px'}}>NPR {order.total}</td>
                     <td style={{padding: '12px'}}>
                       <select
                         value={order.status || 'pending'}
                         disabled={updatingOrderId === order.id}
                         onChange={(event) => updateOrderStatus(order.id, event.target.value)}
                       >
                         <option value="pending">Pending</option>
                         <option value="processing">Processing</option>
                         <option value="shipped">Shipped</option>
                         <option value="completed">Completed</option>
                         <option value="cancelled">Cancelled</option>
                       </select>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         )}
      </div>

      <div className="card" style={{marginTop: '32px'}}>
        <div className="body">
          <h3>Product Management</h3>
          <form onSubmit={saveProduct} className="form" style={{maxWidth: '720px', marginTop: '16px'}}>
            <input placeholder="Product name" required value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} />
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
              <input type="number" min="0" placeholder="Price (NPR)" required value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} />
              <input type="number" min="0" placeholder="Stock" required value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })} />
            </div>
            <select required value={productForm.category_id || ''} onChange={(event) => setProductForm({ ...productForm, category_id: event.target.value })}>
              <option value="">Select category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <input placeholder="Image path or URL (optional)" value={productForm.image} onChange={(event) => setProductForm({ ...productForm, image: event.target.value })} />
            <textarea placeholder="Description" rows="3" value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} />
            <div style={{display: 'flex', gap: '8px'}}>
              <button className="btn" type="submit">{editingProductId ? 'Update Product' : 'Add Product'}</button>
              {editingProductId && <button className="btn ghost" type="button" onClick={() => { setEditingProductId(null); setProductForm({ name: '', price: '', stock: '', description: '', image: '' }); }}>Cancel</button>}
            </div>
            {productMessage && <p style={{color: productMessage.includes('successfully') ? 'var(--green)' : 'var(--red)'}}>{productMessage}</p>}
          </form>
          <div style={{overflowX: 'auto', marginTop: '24px'}}>
            <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
              <thead><tr style={{borderBottom: '2px solid var(--line)'}}><th style={{padding: '10px'}}>Product</th><th style={{padding: '10px'}}>Price</th><th style={{padding: '10px'}}>Stock</th><th style={{padding: '10px'}}>Actions</th></tr></thead>
              <tbody>{products.map((product) => <tr key={product.id} style={{borderBottom: '1px solid var(--line)'}}><td style={{padding: '10px'}}>{product.name}</td><td style={{padding: '10px'}}>NPR {product.price}</td><td style={{padding: '10px'}}>{product.stock}</td><td style={{padding: '10px'}}><button className="btn ghost" onClick={() => startEditingProduct(product)}>Edit</button>{' '}<button className="btn ghost" onClick={() => deleteProduct(product.id)}>Delete</button></td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card" style={{marginTop: '32px'}}>
        <div className="body">
          <h3>Contact Inbox</h3>
          {contacts.length === 0 ? <p>No contact messages yet.</p> : <div style={{display: 'grid', gap: '12px'}}>{contacts.map((message) => <article key={message.id} style={{padding: '12px', border: '1px solid var(--line)', borderRadius: '8px'}}><strong>{message.name}</strong> &lt;{message.email}&gt;<p style={{margin: '6px 0 0'}}>{message.message}</p></article>)}</div>}
        </div>
      </div>

      <div className="card" style={{marginTop: '32px'}}>
        <div className="body">
          <h3>Users</h3>
          <p style={{color: 'var(--muted)'}}>{users.length} registered account{users.length === 1 ? '' : 's'}</p>
          <div style={{overflowX: 'auto'}}><table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}><thead><tr style={{borderBottom: '2px solid var(--line)'}}><th style={{padding: '10px'}}>Name</th><th style={{padding: '10px'}}>Email</th><th style={{padding: '10px'}}>Role</th><th style={{padding: '10px'}}>Actions</th></tr></thead><tbody>{users.map((account) => <tr key={account.id} style={{borderBottom: '1px solid var(--line)'}}><td style={{padding: '10px'}}>{account.name}</td><td style={{padding: '10px'}}>{account.email}</td><td style={{padding: '10px'}}>{account.role}</td><td style={{padding: '10px'}}>{account.role !== 'admin' && <button className="btn ghost" onClick={() => deleteUser(account.id)}>Delete</button>}</td></tr>)}</tbody></table></div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
