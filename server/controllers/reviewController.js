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

  let canReview = false;
  if (req.user && productId) {
    const eligibleOrder = await db.get(
      `SELECT o.id
       FROM orders o
       INNER JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = ? AND oi.product_id = ?
         AND LOWER(o.status) IN ('shipped', 'completed')
       LIMIT 1`,
      [req.user.id, productId]
    );
    const existingReview = await db.get(
      'SELECT id FROM reviews WHERE product_id = ? AND user_id = ?',
      [productId, req.user.id]
    );
    canReview = Boolean(eligibleOrder && !existingReview);
  }

  res.json({ canReview, reviews: reviews.map((review) => ({
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
  const numericRating = Number(rating);
  if (!productId || !rating || !comment) {
    return res.status(400).json({ message: 'Product, rating, and comment are required.' });
  }
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ message: 'Rating must be an integer from 1 to 5.' });
  }

  const db = await getDb();
  const product = await db.get('SELECT id FROM products WHERE id = ?', [productId]);
  if (!product) {
    return res.status(404).json({ message: 'Product not found.' });
  }

  const deliveredOrder = await db.get(
    `SELECT o.id
     FROM orders o
     INNER JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = ? AND oi.product_id = ?
       AND LOWER(o.status) IN ('shipped', 'completed')
     ORDER BY o.updated_at DESC
     LIMIT 1`,
    [req.user.id, productId]
  );
  if (!deliveredOrder) {
    return res.status(403).json({ message: 'You can review this product after your order has shipped.' });
  }

  const existing = await db.get('SELECT id FROM reviews WHERE product_id = ? AND user_id = ?', [productId, req.user.id]);
  if (existing) {
    return res.status(400).json({ message: 'You have already reviewed this product.' });
  }

  const result = await db.run(
    'INSERT INTO reviews (product_id, user_id, order_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
    [productId, req.user.id, deliveredOrder.id, numericRating, String(comment).trim()]
  );

  const review = {
    id: result.lastID,
    product_id: productId,
    user_id: req.user.id,
    rating: numericRating,
    comment: String(comment).trim(),
    created_at: new Date().toISOString()
  };

  res.status(201).json({ review });
});

module.exports = { listReviews, createReview };
