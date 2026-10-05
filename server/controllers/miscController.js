const { getDb } = require('../config/db');
const env = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');
const validator = require('validator');
const { sendContactMessageEmail } = require('../services/emailService');

const subscribe = asyncHandler(async (req, res) => {
  const { email, name } = req.body;
  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address.' });
  }

  const db = await getDb();
  const existing = await db.get('SELECT id FROM marketing_subscriptions WHERE email = ?', [String(email).toLowerCase()]);
  if (existing) {
    return res.json({ message: 'You are already subscribed.' });
  }

  await db.run('INSERT INTO marketing_subscriptions (email, name) VALUES (?, ?)', [String(email).toLowerCase(), name || 'Subscriber']);
  res.status(201).json({ message: 'Subscribed successfully.' });
});

const trackEvent = asyncHandler(async (req, res) => {
  const { eventType, productId, metadata } = req.body;
  if (!eventType) return res.status(400).json({ message: 'Event type is required.' });

  const db = await getDb();
  await db.run(
    'INSERT INTO analytics_events (user_id, product_id, event_type, metadata) VALUES (?, ?, ?, ?)',
    [req.user ? req.user.id : null, productId || null, eventType, metadata ? JSON.stringify(metadata) : null]
  );

  res.status(201).json({ message: 'Event tracked.' });
});

const recommendations = asyncHandler(async (req, res) => {
  const db = await getDb();
  const currentProductId = Number(req.query.productId) || null;
  const currentProduct = currentProductId
    ? await db.get('SELECT category_id FROM products WHERE id = ?', [currentProductId])
    : null;
  const purchasedCategories = new Set();

  if (req.user) {
    const purchasedRows = await db.all(
      `SELECT DISTINCT products.category_id
       FROM order_items
       JOIN orders ON orders.id = order_items.order_id
       JOIN products ON products.id = order_items.product_id
       WHERE orders.user_id = ? AND orders.payment_status IN ('completed', 'paid')`,
      [req.user.id]
    );
    purchasedRows.forEach((row) => purchasedCategories.add(String(row.category_id)));
  }

  const candidates = await db.all(
    `SELECT products.*, categories.name AS category_name, categories.slug AS category_slug
     FROM products
     LEFT JOIN categories ON categories.id = products.category_id
     WHERE products.active = 1
     ORDER BY products.featured DESC, products.created_at DESC`
  );
  const ranked = candidates
    .filter((product) => product.id !== currentProductId)
    .map((product) => {
      const reasons = [];
      let score = product.featured ? 2 : 0;
      const categoryId = String(product.category_id);

      if (currentProduct?.category_id && categoryId === String(currentProduct.category_id)) {
        score += 8;
        reasons.push('Related to this product category');
      }
      if (purchasedCategories.has(categoryId)) {
        score += 15;
        reasons.unshift('Recommended based on your purchases');
      }
      if (product.featured) reasons.push('Featured in the shop');

      return { product, score, reason: reasons[0] || 'Popular at Mithila Ghar' };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, Math.min(8, Math.max(1, Number(req.query.limit) || 4)));

  res.json({
    explanation: req.user
      ? 'Recommendations use your paid purchase categories and the current product category.'
      : 'Guest recommendations use the current product category and featured products.',
    products: ranked.map(({ product, score, reason }) => ({
      _id: product.id,
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      description: product.description,
      image: product.image,
      images: [{ url: product.image, alt: product.name }],
      category: { id: product.category_id, name: product.category_name, slug: product.category_slug },
      score,
      recommendationReason: reason
    }))
  });
});

const contact = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email, and message are required.' });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address.' });
  }

  const db = await getDb();
  const contactMessage = {
    name: name.trim(),
    email: String(email).toLowerCase(),
    subject: req.body.subject,
    message: message.trim()
  };
  await db.run(
    'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)',
    [contactMessage.name, contactMessage.email, contactMessage.message]
  );

  const emailResult = await sendContactMessageEmail(contactMessage);
  if (!emailResult.sent) {
    return res.status(503).json({ message: 'Message saved, but email notification could not be sent.' });
  }

  res.json({ message: 'Your message has been received. We will get back to you soon!' });
});

const configPublic = asyncHandler(async (req, res) => {
  res.json({
    appName: 'Mithila Ghar',
    currency: 'NPR',
    supportEmail: 'support@mithilaghar.local',
    categories: ['Mithila Foods', 'Mithila Art', 'Handicrafts', 'Ritual & Festival Kits', 'Fashion']
  });
});

const submitContact = contact;

const sitemap = asyncHandler(async (req, res) => {
  const db = await getDb();
  const [categories, products] = await Promise.all([
    db.all('SELECT slug FROM categories ORDER BY slug ASC'),
    db.all('SELECT slug FROM products WHERE active = 1 ORDER BY slug ASC')
  ]);
  const requestHost = req.get('x-forwarded-host') || req.get('host');
  const requestProtocol = req.get('x-forwarded-proto') || req.protocol;
  const baseUrl = requestHost && !requestHost.startsWith('localhost')
    ? `${requestProtocol}://${requestHost}`
    : env.clientUrl.replace(/\/$/, '');
  const urls = [
    `${baseUrl}/`,
    `${baseUrl}/shop`,
    `${baseUrl}/categories`,
    ...categories.map(({ slug }) => `${baseUrl}/shop?category=${encodeURIComponent(slug)}`),
    ...products.map(({ slug }) => `${baseUrl}/product/${encodeURIComponent(slug)}`)
  ];
  const escapeXml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
  const entries = urls.map((url) => `<url><loc>${escapeXml(url)}</loc></url>`).join('');
  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`);
});

const robots = (req, res) => {
  res.type('text/plain');
  const requestHost = req.get('x-forwarded-host') || req.get('host');
  const requestProtocol = req.get('x-forwarded-proto') || req.protocol;
  const baseUrl = requestHost && !requestHost.startsWith('localhost')
    ? `${requestProtocol}://${requestHost}`
    : env.clientUrl.replace(/\/$/, '');
  res.send(`User-agent: *\nDisallow: /admin\nDisallow: /dashboard\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml`);
};

module.exports = { subscribe, trackEvent, recommendations, contact, configPublic, submitContact, sitemap, robots };
