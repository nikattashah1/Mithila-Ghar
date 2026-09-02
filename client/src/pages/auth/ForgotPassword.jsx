import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return <div className="container section" style={{maxWidth: '440px'}}><div className="card"><div className="body form"><h2>Forgot Password</h2><p style={{color: 'var(--muted)'}}>Enter your account email and we will send a reset link.</p><form onSubmit={handleSubmit}><label htmlFor="forgot-email">Email</label><input id="forgot-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /><button className="btn" type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</button></form>{message && <p style={{color: 'var(--green)'}}>{message}</p>}<Link to="/login">Back to login</Link></div></div></div>;
};

export default ForgotPassword;
