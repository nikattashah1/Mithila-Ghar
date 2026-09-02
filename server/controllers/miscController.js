const { getDb } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const validator = require('validator');

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
  const products = await db.all(
    'SELECT * FROM products WHERE active = 1 ORDER BY featured DESC, created_at DESC LIMIT 4'
  );

  res.json({
    products: products.map((product) => ({
      _id: product.id,
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      description: product.description,
      image: product.image,
      images: [{ url: product.image }],
      category: null
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
  await db.run(
    'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)',
    [name.trim(), String(email).toLowerCase(), message.trim()]
  );

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
  res.type('application/xml');
  res.send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
});

const robots = (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /admin\nDisallow: /dashboard\nAllow: /');
};

module.exports = { subscribe, trackEvent, recommendations, contact, configPublic, submitContact, sitemap, robots };
