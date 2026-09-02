import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (newPassword !== confirmation) {
      setMessage('Passwords do not match.');
      return;
    }
    try {
      const response = await api.post('/auth/reset-password', { token: searchParams.get('token'), newPassword });
      setMessage(response.data.message);
      setSuccess(true);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to reset password.');
    }
  };

  return <div className="container section" style={{maxWidth: '440px'}}><div className="card"><div className="body form"><h2>Reset Password</h2>{success ? <><p style={{color: 'var(--green)'}}>{message}</p><Link to="/login" className="btn">Go to Login</Link></> : <form onSubmit={handleSubmit}><label htmlFor="new-password">New password</label><input id="new-password" type="password" required minLength="8" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /><label htmlFor="confirm-password">Confirm new password</label><input id="confirm-password" type="password" required minLength="8" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /><button className="btn" type="submit">Reset Password</button>{message && <p style={{color: 'var(--red)'}}>{message}</p>}</form>}</div></div></div>;
};

export default ResetPassword;
