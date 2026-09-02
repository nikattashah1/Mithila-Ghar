const Product = require('../models/Product');
const Order = require('../models/Order');
const Wishlist = require('../models/Wishlist');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const Recommendation = require('../models/Recommendation');

async function buildRecommendations({ userId, sessionId, productId, limit = 8 }) {
  const products = await Product.find().populate('category', 'name slug');
  if (!products.length) return { items: [], explanation: 'No products available yet.' };

  const scores = new Map(products.map((p) => [String(p._id), { product: p, score: p.popularityScore || 0, reasons: [] }]));

  const views = await AnalyticsEvent.find({
    eventType: 'product_view',
    ...(userId ? { user: userId } : sessionId ? { sessionId } : {})
  })
    .sort({ timestamp: -1 })
    .limit(20);

  const viewedIds = views.map((v) => String(v.product)).filter(Boolean);
  const viewedProducts = products.filter((p) => viewedIds.includes(String(p._id)));
  const viewedCategories = new Set(viewedProducts.map((p) => String(p.category?._id || p.category)));
  const viewedTags = new Set(viewedProducts.flatMap((p) => p.tags || []));

  if (productId) {
    const current = products.find((p) => String(p._id) === String(productId));
    if (current) {
      viewedCategories.add(String(current.category?._id || current.category));
      (current.tags || []).forEach((t) => viewedTags.add(t));
    }
  }

  let purchaseCategories = new Set();
  let wishlist = [];
  if (userId) {
    const orders = await Order.find({ user: userId, paymentStatus: 'Paid' });
    const purchasedIds = new Set(orders.flatMap((o) => o.items.map((i) => String(i.product))));
    purchaseCategories = new Set(
      products.filter((p) => purchasedIds.has(String(p._id))).map((p) => String(p.category?._id || p.category))
    );
    const list = await Wishlist.findOne({ user: userId });
    wishlist = (list?.products || []).map(String);
  }

  for (const [id, entry] of scores.entries()) {
    if (productId && id === String(productId)) {
      entry.score = -999;
      continue;
    }
    const catId = String(entry.product.category?._id || entry.product.category);
    if (viewedCategories.has(catId)) {
      entry.score += 25;
      const catName = entry.product.category?.name || 'this category';
      entry.reasons.push(`Because you viewed ${catName}`);
    }
    if (purchaseCategories.has(catId)) {
      entry.score += 30;
      entry.reasons.push('Recommended based on your purchases');
    }
    const overlap = (entry.product.tags || []).filter((t) => viewedTags.has(t)).length;
    if (overlap) {
      entry.score += overlap * 8;
      entry.reasons.push('Related to this product');
    }
    if (wishlist.includes(id)) {
      entry.score += 12;
      entry.reasons.push('Saved in your wishlist');
    }
    if ((entry.product.popularityScore || 0) > 5) {
      entry.reasons.push(`Popular in ${entry.product.category?.name || 'the shop'}`);
    }
  }

  const ranked = [...scores.values()]
    .filter((e) => e.score > -500)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((e) => ({
      product: e.product,
      reason: e.reasons[0] || 'Popular at Mithila Ghar',
      score: e.score
    }));

  if (userId || sessionId) {
    await Recommendation.deleteMany({
      ...(userId ? { user: userId } : { sessionId })
    });
    if (ranked.length) {
      await Recommendation.insertMany(
        ranked.map((r) => ({
          user: userId || null,
          sessionId: userId ? '' : sessionId || '',
          product: r.product._id,
          reason: r.reason,
          score: r.score
        }))
      );
    }
  }

  const explanation = userId
    ? 'Personalized using your views, purchases, wishlist, and popular products.'
    : 'Guest recommendations use the current product, category, and popularity.';

  return { items: ranked, explanation };
}

module.exports = { buildRecommendations };
