const { getDb } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const dashboard = asyncHandler(async (req, res) => {
  const db = await getDb();

  const [users, products, orders, paidOrders, payments, walletTx, subscribers, productViews, addToCart] = await Promise.all([
    db.get('SELECT COUNT(*) as count FROM users'),
    db.get('SELECT COUNT(*) as count FROM products'),
    db.get('SELECT COUNT(*) as count FROM orders'),
    db.all('SELECT total FROM orders WHERE payment_status = ?', ['completed']),
    db.get('SELECT COUNT(*) as count FROM payments WHERE status = ?', ['completed']),
    db.get('SELECT COUNT(*) as count FROM wallet_transactions'),
    db.get('SELECT COUNT(*) as count FROM marketing_subscriptions'),
    db.get('SELECT COUNT(*) as count FROM analytics_events WHERE event_type = ?', ['product_view']),
    db.get('SELECT COUNT(*) as count FROM analytics_events WHERE event_type = ?', ['add_to_cart'])
  ]);

  const revenue = (paidOrders || []).reduce((sum, row) => sum + Number(row.total || 0), 0);
  const mostViewed = await db.get(
    'SELECT product_id AS _id, COUNT(*) AS count FROM analytics_events WHERE event_type = ? AND product_id IS NOT NULL GROUP BY product_id ORDER BY count DESC LIMIT 1',
    ['product_view']
  );
  const mostCarted = await db.get(
    'SELECT product_id AS _id, COUNT(*) AS count FROM analytics_events WHERE event_type = ? AND product_id IS NOT NULL GROUP BY product_id ORDER BY count DESC LIMIT 1',
    ['add_to_cart']
  );

  const populateProduct = async (row) => {
    if (!row?._id) return null;
    const product = await db.get('SELECT id, name, slug FROM products WHERE id = ?', [row._id]);
    return product ? { product: { ...product, _id: product.id }, count: row.count } : null;
  };

  res.json({
    cards: {
      totalUsers: users.count,
      totalProducts: products.count,
      totalOrders: orders.count,
      totalRevenue: revenue,
      successfulPayments: payments.count,
      walletTransactions: walletTx.count,
      newsletterSubscribers: subscribers.count,
      productViews: productViews.count,
      addToCartEvents: addToCart.count
    },
    mostViewedProduct: await populateProduct(mostViewed),
    mostAddedToCartProduct: await populateProduct(mostCarted)
  });
});

const adminProducts = asyncHandler(async (req, res) => {
  const db = await getDb();
  const products = await db.all(
    `SELECT p.*, c.name as category_name, c.slug as category_slug
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     ORDER BY p.created_at DESC`
  );

  res.json({ products: products.map((product) => ({
    _id: product.id,
    ...product,
    category: product.category_id ? { _id: product.category_id, name: product.category_name, slug: product.category_slug } : null
  })) });
});

const createProduct = asyncHandler(async (req, res) => {
  const db = await getDb();
  const payload = req.body || {};
  const result = await db.run(
    `INSERT INTO products (name, slug, description, usage_instructions, price, stock, image, featured, active, category_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.name,
      payload.slug || payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      payload.description || '',
      payload.usage_instructions || '',
      Number(payload.price || 0),
      Number(payload.stock || 0),
      payload.image || '',
      payload.featured ? 1 : 0,
      payload.active === false ? 0 : 1,
      payload.category_id || null
    ]
  );

  const product = await db.get('SELECT * FROM products WHERE id = ?', [result.lastID]);
  res.status(201).json({ product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const db = await getDb();
  const existing = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ message: 'Product not found.' });

  const payload = req.body || {};
  const updates = {
    name: payload.name ?? existing.name,
    slug: payload.slug ?? existing.slug,
    description: payload.description ?? existing.description,
    usage_instructions: payload.usage_instructions ?? existing.usage_instructions,
    price: Number(payload.price ?? existing.price),
    stock: Number(payload.stock ?? existing.stock),
    image: payload.image ?? existing.image,
    featured: payload.featured !== undefined ? (payload.featured ? 1 : 0) : existing.featured,
    active: payload.active !== undefined ? (payload.active ? 1 : 0) : existing.active,
    category_id: payload.category_id ?? existing.category_id
  };

  await db.run(
    `UPDATE products SET name = ?, slug = ?, description = ?, usage_instructions = ?, price = ?, stock = ?, image = ?, featured = ?, active = ?, category_id = ? WHERE id = ?`,
    [updates.name, updates.slug, updates.description, updates.usage_instructions, updates.price, updates.stock, updates.image, updates.featured, updates.active, updates.category_id, req.params.id]
  );

  const product = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
  res.json({ product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const db = await getDb();
  const existing = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ message: 'Product not found.' });
  await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
  res.json({ message: 'Product deleted.' });
});

const adminOrders = asyncHandler(async (req, res) => {
  const db = await getDb();
  const orders = await db.all('SELECT * FROM orders ORDER BY created_at DESC');
  res.json({ orders });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const db = await getDb();
  const order = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  if (!order) return res.status(404).json({ message: 'Order not found.' });

  const { orderStatus } = req.body || {};
  if (orderStatus) {
    await db.run('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [orderStatus, req.params.id]);
  }

  const updated = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  res.json({ order: updated });
});

const adminUsers = asyncHandler(async (req, res) => {
  const db = await getDb();
  const users = await db.all('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
  res.json({ users });
});

const adminPayments = asyncHandler(async (req, res) => {
  const db = await getDb();
  const payments = await db.all('SELECT * FROM payments ORDER BY created_at DESC');
  res.json({ payments });
});

const adminWalletTx = asyncHandler(async (req, res) => {
  const db = await getDb();
  const transactions = await db.all('SELECT * FROM wallet_transactions ORDER BY created_at DESC');
  res.json({ transactions });
});

const adminMarketing = asyncHandler(async (req, res) => {
  const db = await getDb();
  const subscribers = await db.all('SELECT * FROM marketing_subscriptions ORDER BY created_at DESC');
  const featured = await db.get('SELECT COUNT(*) as count FROM products WHERE featured = 1');
  const discounted = await db.get('SELECT COUNT(*) as count FROM products WHERE price > 0');
  res.json({
    totalSubscribers: subscribers.length,
    recentSubscribers: subscribers.slice(0, 20),
    campaign: {
      name: 'Chhath & Harvest Seasonal Promotion',
      status: 'Active (demo)',
      featuredProducts: featured.count,
      discountProducts: discounted.count
    }
  });
});

const adminRecommendations = asyncHandler(async (req, res) => {
  const db = await getDb();
  const rows = await db.all('SELECT * FROM recommendations ORDER BY created_at DESC');
  res.json({ stats: rows, total: rows.length });
});

const adminAudit = asyncHandler(async (req, res) => {
  const db = await getDb();
  const logs = await db.all('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100');
  res.json({ logs });
});

const adminContacts = asyncHandler(async (req, res) => {
  const db = await getDb();
  const messages = await db.all('SELECT * FROM contact_messages ORDER BY created_at DESC');
  res.json({ messages });
});

const adminCategories = asyncHandler(async (req, res) => {
  const db = await getDb();
  const categories = await db.all('SELECT * FROM categories ORDER BY name ASC');
  res.json({ categories });
});

module.exports = {
  dashboard,
  adminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  adminOrders,
  updateOrderStatus,
  adminUsers,
  adminPayments,
  adminWalletTx,
  adminMarketing,
  adminRecommendations,
  adminAudit,
  adminContacts,
  adminCategories
};
