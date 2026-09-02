import React, { useState } from 'react';
import api from '../services/api';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Submitting...');
    try {
      await api.post('/contact', formData);
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setStatus(error.response?.data?.message || 'Unable to send message. Please try again.');
    }
  };

  return (
    <div className="container section" style={{maxWidth: '600px', margin: '0 auto'}}>
      <h1 style={{textAlign: 'center', marginBottom: '32px'}}>Contact Us</h1>
      
      <div className="card" style={{padding: '32px', border: 'none'}}>
        {status === 'success' ? (
           <div style={{textAlign: 'center', color: 'var(--green)'}}>
             <h3>Message Sent Successfully!</h3>
             <p>We will get back to you shortly.</p>
             <button className="btn" onClick={() => setStatus('')} style={{marginTop: '16px'}}>Send Another Message</button>
           </div>
        ) : (
           <form onSubmit={handleSubmit} className="form" style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
             <input type="text" placeholder="Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
             <input type="email" placeholder="Email Address" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
             <input type="text" placeholder="Subject" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
             <textarea placeholder="Your Message..." required rows="5" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} style={{resize: 'vertical', padding: '12px', border: '1px solid var(--line)', borderRadius: '4px'}}></textarea>
             
             <button type="submit" className="btn" disabled={status==='Submitting...'} style={{marginTop: '16px'}}>
               {status === 'Submitting...' ? 'Sending...' : 'Send Message'}
             </button>
             {status && status !== 'Submitting...' && status !== 'success' && <p style={{color: 'var(--red)'}}>{status}</p>}
           </form>
        )}
      </div>
    </div>
  );
};

export default Contact;
