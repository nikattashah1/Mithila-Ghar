import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';

const Wishlist = () => {
  const { wishlist, wishlistLoading, fetchWishlist, removeFromWishlist } = useWishlist();

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const items = wishlist?.items || [];

  if (wishlistLoading) return <div className="container section">Loading wishlist...</div>;

  return (
    <div className="container section">
      <h1 style={{marginBottom: '24px'}}>My Wishlist</h1>

      {items.length === 0 ? (
        <div className="card" style={{padding: '24px'}}>
          <p style={{margin: 0, color: 'var(--muted)'}}>Your wishlist is empty.</p>
          <Link to="/shop" className="btn" style={{marginTop: '16px', display: 'inline-block'}}>Browse products</Link>
        </div>
      ) : (
        <div className="grid products">
          {items.map((item) => {
            const product = item.product || item;
            const image = product.images?.[0]?.url || product.image;
            const isOutOfStock = Number(product.stock ?? 0) <= 0;

            return (
              <div className="card" key={item.id || item._id}>
                <div className="thumb">
                  {image ? <img src={image} alt={product.name} style={{maxHeight:'150px'}} /> : 'No Image'}
                </div>
                <div className="body">
                  <Link to={`/product/${product.slug}`}><h3>{product.name}</h3></Link>
                  <div className="price">NPR {product.price}</div>
                  <div style={{marginTop: '8px', color: isOutOfStock ? 'var(--brand)' : 'var(--muted)', fontWeight: 600}}>
                    {isOutOfStock ? 'Out of stock' : `${product.stock} in stock`}
                  </div>
                  <button className="btn ghost" style={{marginTop: '16px'}} onClick={() => removeFromWishlist(item.id || item._id)}>
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
