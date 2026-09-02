import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useWishlist } from '../context/WishlistContext';

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const { addToWishlist } = useWishlist();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${slug}`);
        setProduct(res.data.product);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  if (loading) return <div className="container section">Loading...</div>;
  if (!product) return <div className="container section">Product not found</div>;

  const price = product.discountPrice || product.price;

  const handleAddToCart = async () => {
    await addToCart(product._id, qty);
    addToast('Added to cart', 'success');
  };

  const usageText = product.usage_instructions || 'Use this Mithila product as part of daily rituals, gifting, celebration, or home decoration.';

  return (
    <div className="container section product-layout">
      <div className="product-images card" style={{height: '100%'}}>
        <div className="thumb" style={{height: '400px'}}>
          {product.images && product.images[0] ? <img src={product.images[0].url} alt={product.images[0].alt || product.name} /> : 'No Image'}
        </div>
      </div>

      <div className="product-info">
        <h1>{product.name}</h1>
        <div className="price" style={{fontSize: '24px', marginBottom: '16px'}}>
          {product.discountPrice ? (
            <><s>NPR {product.price}</s> NPR {product.discountPrice}</>
          ) : `NPR ${product.price}`}
        </div>

        <p style={{color: 'var(--muted)', marginBottom: '24px'}}>{product.description}</p>

        {product.stock > 0 ? (
          <div style={{marginBottom: '24px'}}>
            <label style={{display: 'block', marginBottom: '8px', fontWeight: '600'}}>Quantity</label>
            <div className="qty">
              <button className="icon-btn" onClick={() => setQty(Math.max(1, qty - 1))}>-</button>
              <span>{qty}</span>
              <button className="icon-btn" onClick={() => setQty(Math.min(product.stock, qty + 1))}>+</button>
            </div>
          </div>
        ) : (
          <div style={{color: 'var(--brand)', marginBottom: '24px', fontWeight: '600'}}>Out of Stock</div>
        )}

        <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px'}}>
          <button className="btn" onClick={handleAddToCart} disabled={product.stock <= 0}>Add to Cart</button>
          <button
            className="btn ghost"
            onClick={async () => {
              const ok = await addToWishlist(product);
              if (ok) addToast('Saved to wishlist', 'success');
            }}
            disabled={product.stock <= 0}
          >
            Save to Wishlist
          </button>
          <button className="btn ghost" onClick={() => addToast('Buy now is available in checkout', 'info')}>Buy Now</button>
        </div>

        <div style={{display: 'grid', gap: '12px', color: 'var(--muted)'}}>
          {product.category?.name && (
            <div>
              <strong style={{color: 'var(--ink)'}}>Category:</strong>{' '}
              <Link to={`/shop?category=${product.category.slug}`} style={{textDecoration: 'underline'}}>
                {product.category.name}
              </Link>
            </div>
          )}
          <div><strong style={{color: 'var(--ink)'}}>Stock Status:</strong> {product.stock > 0 ? `${product.stock} items available` : 'Out of stock'}</div>
          <div><strong style={{color: 'var(--ink)'}}>Reviews:</strong> 4.8/5 from Mithila Ghar customers</div>
        </div>

        <div style={{marginTop: '32px', padding: '20px 24px', background: 'var(--surface)', borderRadius: '12px'}}>
          <h3 style={{margin: '0 0 12px'}}>How to Use</h3>
          <p style={{margin: 0, color: 'var(--muted)'}}>{usageText}</p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
