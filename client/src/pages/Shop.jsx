import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const q = searchParams.toString();
      const res = await api.get(`/products${q ? `?${q}` : ''}`);
      setProducts(res.data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get(`/categories`);
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleCategoryChange = (e) => {
    if (e.target.value) {
      searchParams.set('category', e.target.value);
    } else {
      searchParams.delete('category');
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="container section shop-layout">
      <aside className="filters">
        <div className="panel filter-panel">
          <h3>Filters</h3>
          <div className="form">
            <label>Category</label>
            <select onChange={handleCategoryChange} value={searchParams.get('category') || ''}>
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c._id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </aside>

      <section className="shop-main">
        {loading ? (
          <div className="panel loading-panel">Loading products...</div>
        ) : (
          <div className="grid products shop-grid">
            {products.length === 0 && <div className="panel empty-panel">No products found.</div>}
            {products.map(p => (
              <div className="card product-card" key={p._id}>
                <div className="thumb product-thumb">
                  {p.images && p.images[0] ? <img src={p.images[0].url} alt={p.images[0].alt} /> : <div className="product-thumb-empty">No Image</div>}
                </div>
                <div className="body product-body">
                  {p.featured && <span className="product-tag">Featured</span>}
                  <Link to={`/product/${p.slug}`} className="product-title-link">
                    <h3>{p.name}</h3>
                  </Link>
                  {p.category?.name && <span className="product-category">{p.category.name}</span>}
                  <div className="product-meta">
                    <div className="price">
                      {p.discountPrice ? (
                        <>
                          <s>NPR {p.price}</s> NPR {p.discountPrice}
                        </>
                      ) : `NPR ${p.price}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Shop;
