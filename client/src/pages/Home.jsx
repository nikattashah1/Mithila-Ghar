import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {

  const categories = [
    { name: 'Mithila Foods', slug: 'mithila-foods', img: '/images/categories/foods.jpg' },
    { name: 'Mithila Art', slug: 'mithila-art', img: '/images/categories/art.jpg' },
    { name: 'Handicrafts', slug: 'handicrafts', img: '/images/categories/handicrafts.jpg' },
    { name: 'Ritual & Festival Kits', slug: 'ritual-festival-kits', img: '/images/categories/ritual.jpg' },
    { name: 'Fashion', slug: 'fashion', img: '/images/categories/fashion.jpg' },
  ];

  return (
    <>
      <section className="hero home-hero">
        <div className="container home-hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">Crafted in Terai</span>
            <p>Authentic Mithila & Terai food, art, and handicrafts for everyday life and meaningful gifting.</p>
            <div className="hero-actions">
              <Link to="/shop" className="btn">Shop Now</Link>
              <Link to="/about" className="btn ghost light">Our Story</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section home-section">
        <div className="container">
          <div className="section-heading centered">
            <span className="eyebrow dark">Shop by Category</span>
            <h2>Explore our collection</h2>
          </div>
          <div className="grid cats home-categories">
            {categories.map(c => (
              <Link to={`/shop?category=${c.slug}`} key={c.slug} className="category-card">
                <div className="category-image-wrap">
                  <img
                    src={c.img}
                    alt={c.name}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = '/home-hero.jpg';
                    }}
                  />
                  <span className="category-overlay" aria-hidden="true"></span>
                  <h3>{c.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section home-section about-strip">
        <div className="container narrow">
          <div className="section-heading centered">
            <span className="eyebrow dark">About Mithila Ghar</span>
            <h2>Tradition, preserved with care</h2>
          </div>
          <p>
            Mithila Ghar is a platform dedicated to preserving and sharing the rich cultural heritage of the Mithila region. We connect artisans, home producers, and customers to bring authentic Mithila products to your doorstep.
          </p>
        </div>
      </section>
    </>
  );
};

export default Home;
