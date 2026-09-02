const { getDb } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const listReviews = asyncHandler(async (req, res) => {
  const db = await getDb();
  const productId = req.query.productId || req.query.product_id;
  const reviews = await db.all(
    `SELECT r.*, u.name as user_name
     FROM reviews r
     LEFT JOIN users u ON u.id = r.user_id
     WHERE r.product_id = ?
     ORDER BY r.created_at DESC`,
    [productId]
  );

  res.json({ reviews: reviews.map((review) => ({
    _id: review.id,
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.created_at,
    user: review.user_name ? { _id: review.user_id, name: review.user_name } : null
  })) });
});

const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, comment } = req.body;
  if (!productId || !rating || !comment) {
    return res.status(400).json({ message: 'Product, rating, and comment are required.' });
  }

  const db = await getDb();
  const product = await db.get('SELECT id FROM products WHERE id = ?', [productId]);
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' });
  }

  const existing = await db.get('SELECT id FROM reviews WHERE product_id = ? AND user_id = ?', [productId, req.user.id]);
  if (existing) {
    return res.status(400).json({ message: 'You have already reviewed this product.' });
  }

  const result = await db.run(
    'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
    [productId, req.user.id, Number(rating), String(comment).trim()]
  );

  const stats = await db.get(
    'SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE product_id = ?',
    [productId]
  );

  await db.run(
    'UPDATE products SET rating = ?, review_count = ? WHERE id = ?',
    [Number(stats.avg || 0).toFixed(1), Number(stats.count || 0), productId]
  );

  const review = {
    id: result.lastID,
    product_id: productId,
    user_id: req.user.id,
    rating: Number(rating),
    comment: String(comment).trim(),
    created_at: new Date().toISOString()
  };

  res.status(201).json({ review });
});

module.exports = { listReviews, createReview };
