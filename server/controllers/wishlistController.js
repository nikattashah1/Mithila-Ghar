const { getDb } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const getWishlist = asyncHandler(async (req, res) => {
  const db = await getDb();
  const query = `
    SELECT w.id, w.product_id, p.name, p.slug, p.price, p.image, p.stock, p.featured, p.active
    FROM wishlist_items w
    JOIN products p ON w.product_id = p.id
    WHERE w.user_id = ?
  `;
  const items = await db.all(query, [req.user.id]);
  
  const wishlist = {
    items: items.map(item => ({
      id: item.id,
      _id: item.id, // for react compat
      product: {
        _id: item.product_id,
        id: item.product_id,
        name: item.name,
        slug: item.slug,
        price: item.price,
        image: item.image,
        images: [{ url: item.image }],
        stock: item.stock,
        featured: !!item.featured,
        active: !!item.active
      }
    }))
  };

  res.json({ wishlist });
});

const addToWishlist = asyncHandler(async (req, res) => {
  const db = await getDb();
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ message: 'Product ID is required.' });

  const product = await db.get('SELECT id FROM products WHERE id = ?', [productId]);
  if (!product) return res.status(404).json({ message: 'Product not found.' });

  const existing = await db.get('SELECT * FROM wishlist_items WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);
  if (!existing) {
    await db.run('INSERT INTO wishlist_items (user_id, product_id) VALUES (?, ?)', [req.user.id, productId]);
  }
  res.status(existing ? 200 : 201).json({ message: existing ? 'Already in wishlist.' : 'Added to wishlist.' });
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const db = await getDb();
  await db.run('DELETE FROM wishlist_items WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ message: 'Item removed from wishlist.' });
});

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
