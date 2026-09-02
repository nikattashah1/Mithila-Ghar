import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', username: '', email: '', password: '', confirmPassword: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/register', formData);
      localStorage.setItem('mg_token', res.data.token);
      login(res.data.user);
      navigate('/dashboard');
    } catch (err) {
      addToast(err.response?.data?.message || err.response?.data?.error || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container section" style={{maxWidth: '500px'}}>
      <div className="card">
        <div className="body form">
          <h2 style={{textAlign: 'center', marginBottom: '24px'}}>Register</h2>
          <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Full Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <input type="text" placeholder="Username" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
            <input type="email" placeholder="Email Address" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            <input type="text" placeholder="Phone Number" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <input type="password" placeholder="Password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            <input type="password" placeholder="Confirm Password" required value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
            
            <button className="btn" type="submit" disabled={loading} style={{width: '100%', marginTop: '16px'}}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
          <div style={{marginTop: '16px', textAlign: 'center'}}>
             <Link to="/login" style={{color: 'var(--brand)'}}>Already have an account? Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
