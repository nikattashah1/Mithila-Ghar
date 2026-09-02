import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const Header = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  const cartCount = cart?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="logo" aria-label="Mithila Ghar home">
          <img src="/logo.png" alt="Mithila Ghar" className="logo-mark" />
          <span className="logo-text">Mithila Ghar</span>
        </Link>

        <nav className={`nav ${mobileOpen ? 'open' : ''}`}>
          <NavLink to="/" onClick={() => setMobileOpen(false)}>Home</NavLink>
          <NavLink to="/shop" onClick={() => setMobileOpen(false)}>Shop</NavLink>
          <NavLink to="/about" onClick={() => setMobileOpen(false)}>About</NavLink>
          <NavLink to="/contact" onClick={() => setMobileOpen(false)}>Contact</NavLink>
        </nav>

        <div className="header-actions">
          <form className="search-form" action="/shop">
            <input type="text" name="q" placeholder="Search products..." />
            <button type="submit" className="icon-btn search-btn" aria-label="Search">⌕</button>
          </form>

          <Link to="/wishlist" className="icon-btn" aria-label="Wishlist">♡</Link>

          <Link to="/cart" className="icon-btn cart-btn" aria-label="Cart">
            🛒
            {cartCount > 0 && <span className="badge">{cartCount}</span>}
          </Link>

          {user ? (
            <>
              <Link to="/dashboard" className="icon-btn">My Account</Link>
              <Link to="/wallet" className="icon-btn">Wallet</Link>
              <button onClick={logout} className="icon-btn" style={{border: 'none', background: 'transparent'}}>Logout</button>
            </>
          ) : (
            <Link to="/login" className="btn">Login</Link>
          )}

          <button className="mobile-toggle btn ghost" onClick={() => setMobileOpen(!mobileOpen)}>
            Menu
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
