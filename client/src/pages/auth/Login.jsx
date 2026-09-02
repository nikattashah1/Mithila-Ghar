import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('mg_token', res.data.token);
      login(res.data.user);
      
      const params = new URLSearchParams(window.location.search);
      const requestedRedirect = params.get('redirect') || '/dashboard';
      const redirect = requestedRedirect.startsWith('/') ? requestedRedirect : `/${requestedRedirect}`;
      navigate(params.has('redirect') ? redirect : (res.data.user?.role === 'admin' ? '/admin' : '/dashboard'));
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container section" style={{maxWidth: '400px'}}>
      <div className="card">
        <div className="body form">
          <h2 style={{textAlign: 'center', marginBottom: '24px'}}>Login</h2>
          {error && (
            <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '16px', textAlign: 'center' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div>
              <label>Email</label>
              <input type="email" required value={email} onChange={e => {setEmail(e.target.value); setError('');}} />
            </div>
            <div>
              <label>Password</label>
              <input type="password" required value={password} onChange={e => {setPassword(e.target.value); setError('');}} />
            </div>
            <button className="btn" type="submit" disabled={loading} style={{width: '100%', marginTop: '16px'}}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <div style={{marginTop: '16px', textAlign: 'center', fontSize: '14px'}}>
             <Link to="/register" style={{color: 'var(--brand)', display: 'block', marginTop: '16px'}}>Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
