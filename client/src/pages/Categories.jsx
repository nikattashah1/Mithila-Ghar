import React from 'react';
import { Link } from 'react-router-dom';

const Categories = () => {
  const cats = [
    { name: 'Mithila Foods', slug: 'mithila-foods', img: '/images/categories/foods.svg' },
    { name: 'Mithila Art', slug: 'mithila-art', img: '/images/categories/art.svg' },
    { name: 'Handicrafts', slug: 'handicrafts', img: '/images/categories/handicrafts.svg' },
    { name: 'Ritual & Festival Kits', slug: 'ritual-festival-kits', img: '/images/categories/ritual.svg' },
    { name: 'Fashion', slug: 'fashion', img: '/images/categories/fashion.svg' },
  ];

  return (
    <div className="container section">
       <h1 style={{textAlign: 'center', marginBottom: '48px'}}>All Categories</h1>
       <div className="grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px'}}>
          {cats.map(c => (
            <Link to={`/shop?category=${c.slug}`} key={c.slug} style={{display: 'block', textDecoration: 'none', color: 'inherit', textAlign: 'center'}}>
              <div style={{width: '100%', paddingTop: '100%', position: 'relative', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px'}}>
                <img src={c.img} alt={c.name} style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover'}} />
              </div>
              <h3>{c.name}</h3>
            </Link>
          ))}
       </div>
    </div>
  );
};

export default Categories;
