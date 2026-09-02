import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h2 style={{margin: '0 0 8px', color: 'var(--ink)'}}>Mithila Ghar</h2>
          <p style={{color: 'var(--muted)', fontSize: '14px'}}>Authentic Mithila & Terai Food, Art and Handicrafts.</p>
        </div>

        <div>
          <h3 style={{color: 'var(--ink)', marginBottom: '12px'}}>Quick Links</h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--muted)'}}>
            <Link to="/" style={{color: 'inherit'}}>Home</Link>
            <Link to="/shop" style={{color: 'inherit'}}>Shop</Link>
            <Link to="/cart" style={{color: 'inherit'}}>Cart</Link>
            <Link to="/dashboard" style={{color: 'inherit'}}>My Account</Link>
          </div>
        </div>

        <div>
          <h3 style={{color: 'var(--ink)', marginBottom: '12px'}}>Support</h3>
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--muted)'}}>
            <Link to="/contact" style={{color: 'inherit'}}>Contact Us</Link>
            <Link to="/about" style={{color: 'inherit'}}>About</Link>
          </div>
        </div>
      </div>

      <div className="container" style={{textAlign: 'center', marginTop: '32px', borderTop: '1px solid var(--surface)', paddingTop: '16px'}}>
        <p style={{margin: 0, color: 'var(--muted)', fontSize: '14px'}}>© 2026 Mithila Ghar. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
