import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { trackEvent, trackEventOnce } from '../services/analytics.js';
import SEO from '../components/common/SEO';

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const { addToWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${slug}`);
        setProduct(res.data.product);
        trackEventOnce('ViewContent', String(res.data.product._id || res.data.product.id), {
          content_ids: [String(res.data.product._id || res.data.product.id)],
          content_name: res.data.product.name,
          content_type: 'product',
          value: Number(res.data.product.discountPrice || res.data.product.price || 0),
          currency: 'NPR'
        });
        const reviewRes = await api.get(`/reviews?productId=${res.data.product.id}`);
        setCanReview(Boolean(reviewRes.data.canReview));
        setReviews(reviewRes.data.reviews || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  useEffect(() => {
    if (!product?.id) return;

    const fetchRecommendations = async () => {
      try {
        const response = await api.get(`/recommendations?productId=${product.id}&limit=4`);
        setRecommendations(response.data.products || []);
      } catch (error) {
        console.error('Unable to load recommendations:', error);
      }
    };

    fetchRecommendations();
  }, [product?.id]);

  if (loading) return <div className="container section">Loading...</div>;
  if (!product) return <div className="container section">Product not found</div>;

  const price = product.discountPrice || product.price;

  const handleAddToCart = async () => {
    try {
      await addToCart(product._id, qty);
      trackEvent('AddToCart', {
        content_ids: [String(product._id || product.id)],
        content_name: product.name,
        content_type: 'product',
        value: Number(price) * qty,
        currency: 'NPR'
      });
      addToast(`Added ${qty} item${qty > 1 ? 's' : ''} to cart`, 'success');
    } catch (err) {
      addToast(err?.response?.data?.message || 'Unable to add to cart', 'error');
    }
  };

  const usageText = product.usage_instructions || 'Use this Mithila product as part of daily rituals, gifting, celebration, or home decoration.';
  const averageRating = reviews.length
    ? (reviews.reduce((total, review) => total + Number(review.rating), 0) / reviews.length).toFixed(1)
    : null;

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await api.post('/reviews', {
        productId: product.id,
        rating: reviewRating,
        comment: reviewComment
      });
      setReviews((current) => [response.data.review, ...current]);
      setReviewComment('');
      setReviewMessage('Review submitted. Thank you.');
    } catch (err) {
      setReviewMessage(err.response?.data?.message || 'Unable to submit review.');
    }
  };

  return (
    <div className="container section product-layout">
      <SEO
        title={`${product.name} | Mithila Ghar`}
        description={`${product.description || `Shop ${product.name} from Mithila Ghar.`} Authentic Mithila and Terai products for gifting and everyday life.`}
        keywords={`${product.name}, Mithila products, Terai handicrafts, traditional Nepali gifts`}
        path={`/product/${product.slug}`}
      />
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
            onClick={() => addToWishlist(product)}
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
          <div><strong style={{color: 'var(--ink)'}}>Reviews:</strong> {averageRating ? `${averageRating}/5 from ${reviews.length} customer${reviews.length === 1 ? '' : 's'}` : 'No reviews yet'}</div>
        </div>

        <div style={{marginTop: '32px', padding: '20px 24px', background: 'var(--surface)', borderRadius: '12px'}}>
          <h3 style={{margin: '0 0 12px'}}>How to Use</h3>
          <p style={{margin: 0, color: 'var(--muted)'}}>{usageText}</p>
        </div>

        {recommendations.length > 0 && (
          <section style={{marginTop: '32px'}}>
            <h2>You May Also Like</h2>
            <div className="grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px'}}>
              {recommendations.map((recommendation) => (
                <Link to={`/product/${recommendation.slug}`} key={recommendation.id} className="card" style={{textDecoration: 'none', color: 'inherit', overflow: 'hidden'}}>
                  <img src={recommendation.images?.[0]?.url || recommendation.image} alt={recommendation.images?.[0]?.alt || recommendation.name} style={{width: '100%', aspectRatio: '1', objectFit: 'cover'}} />
                  <div style={{padding: '12px'}}>
                    <strong>{recommendation.name}</strong>
                    <div className="price" style={{marginTop: '6px'}}>NPR {recommendation.price}</div>
                    <small style={{display: 'block', marginTop: '8px', color: 'var(--muted)'}}>{recommendation.recommendationReason}</small>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section style={{marginTop: '32px'}}>
          <h2>Customer Reviews</h2>
          {reviews.length === 0 ? <p style={{color: 'var(--muted)'}}>No reviews yet.</p> : reviews.map((review) => (
            <article key={review.id} style={{borderTop: '1px solid var(--line)', padding: '16px 0'}}>
              <strong>{review.rating}/5</strong> <span style={{color: 'var(--muted)'}}>by {review.user?.name || 'Customer'}</span>
              <p style={{margin: '8px 0 0'}}>{review.comment}</p>
            </article>
          ))}
          {isAuthenticated && canReview ? (
            <form onSubmit={handleReviewSubmit} style={{marginTop: '20px', display: 'grid', gap: '10px', maxWidth: '520px'}}>
              <h3 style={{margin: 0}}>Write a review</h3>
              <label>Rating <select value={reviewRating} onChange={(event) => setReviewRating(Number(event.target.value))}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}/5</option>)}</select></label>
              <textarea required minLength="3" placeholder="Share your experience" value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} />
              <button className="btn" type="submit">Submit Review</button>
              {reviewMessage && <p style={{color: 'var(--muted)', margin: 0}}>{reviewMessage}</p>}
            </form>
          ) : <p style={{color: 'var(--muted)'}}>{isAuthenticated ? 'Only customers who bought and received this product can write a review.' : 'Sign in after your order ships to write a review.'}</p>}
        </section>
      </div>
    </div>
  );
};

export default ProductDetail;
