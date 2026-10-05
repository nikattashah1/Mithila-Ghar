import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import MockCardTest from './pages/checkout/MockCardTest';
import PaymentSuccess from './pages/checkout/PaymentSuccess';
import PaymentFailure from './pages/checkout/PaymentFailure';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/account/Dashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import Wishlist from './pages/Wishlist';
import About from './pages/About';
import Contact from './pages/Contact';
import Categories from './pages/Categories';
import { trackEventOnce } from './services/analytics.js';

const NotFound = () => <div className="container section text-center"><h2>404 Not Found</h2><p>Page does not exist.</p></div>;

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    trackEventOnce('PageView', `${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return null;
}

function App() {
  return (
    <div className="app-container">
      <AnalyticsTracker />
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/mock-card-test" element={<MockCardTest />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-failure" element={<PaymentFailure />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/wishlist" element={<Wishlist />} />
          
          <Route element={<ProtectedRoute />}>
             <Route path="/dashboard" element={<Dashboard />} />
          </Route>
          
          <Route element={<ProtectedRoute adminOnly={true} />}>
             <Route path="/admin" element={<AdminDashboard />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
