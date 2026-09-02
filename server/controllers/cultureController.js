const Festival = require('../models/Festival');
const Bundle = require('../models/Bundle');
const CultureGuide = require('../models/CultureGuide');
const Artisan = require('../models/Artisan');
const Workshop = require('../models/Workshop');
const WorkshopInquiry = require('../models/WorkshopInquiry');
const CorporateInquiry = require('../models/CorporateInquiry');
const Product = require('../models/Product');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const asyncHandler = require('../utils/asyncHandler');
const { getOrCreateSessionId } = require('../utils/session');
const cartService = require('../services/cartService');

const listFestivals = asyncHandler(async (req, res) => {
  const festivals = await Festival.find().sort({ name: 1 });
  res.json({ festivals });
});

const getFestival = asyncHandler(async (req, res) => {
  const festival = await Festival.findOne({ slug: req.params.slug });
  if (!festival) return res.status(404).json({ message: 'Festival not found.' });
  const products = await Product.find({
    $or: [{ festival: festival._id }, { festivalName: new RegExp(festival.name.split(' ')[0], 'i') }]
  })
    .populate('category', 'name slug')
    .limit(24);
  const bundles = await Bundle.find({ festival: festival._id }).populate('products', 'name slug price discountPrice images');
  const guides = await CultureGuide.find({ festival: festival._id });
  await AnalyticsEvent.create({
    eventType: 'festival_view',
    user: req.user?._id || null,
    sessionId: getOrCreateSessionId(req, res),
    metadata: { slug: festival.slug }
  });
  res.json({ festival, products, bundles, guides });
});

const listBundles = asyncHandler(async (req, res) => {
  const bundles = await Bundle.find()
    .populate('festival', 'name slug')
    .populate('products', 'name slug price discountPrice images stock');
  res.json({ bundles });
});

const getBundle = asyncHandler(async (req, res) => {
  const bundle = await Bundle.findOne({ slug: req.params.slug })
    .populate('festival', 'name slug')
    .populate('products');
  if (!bundle) return res.status(404).json({ message: 'Kit not found.' });
  const individualTotal = (bundle.products || []).reduce((sum, p) => {
    const price = p.discountPrice && p.discountPrice < p.price ? p.discountPrice : p.price;
    return sum + price;
  }, 0);
  res.json({ bundle, individualTotal, savings: Math.max(0, individualTotal - bundle.bundlePrice) });
});

const addBundleToCart = asyncHandler(async (req, res) => {
  const bundle = await Bundle.findById(req.params.id).populate('products');
  if (!bundle) return res.status(404).json({ message: 'Kit not found.' });
  const cart = await cartService.getOrCreateCart({
    userId: req.user?._id || null,
    sessionId: req.user ? null : getOrCreateSessionId(req, res)
  });
  for (const product of bundle.products) {
    await cartService.addItem(cart, product._id, 1);
  }
  const fresh = await cartService.getOrCreateCart({
    userId: req.user?._id || null,
    sessionId: req.user ? null : getOrCreateSessionId(req, res)
  });
  res.json({ message: 'Festival kit added to cart.', cart: await cartService.summarizeCart(fresh) });
});

const listGuides = asyncHandler(async (req, res) => {
  const guides = await CultureGuide.find().populate('festival', 'name slug').sort({ title: 1 });
  res.json({ guides });
});

const getGuide = asyncHandler(async (req, res) => {
  const guide = await CultureGuide.findOne({ slug: req.params.slug })
    .populate('festival', 'name slug')
    .populate('relatedProducts', 'name slug price discountPrice images rating');
  if (!guide) return res.status(404).json({ message: 'Guide not found.' });
  await AnalyticsEvent.create({
    eventType: 'culture_guide_view',
    user: req.user?._id || null,
    sessionId: getOrCreateSessionId(req, res),
    metadata: { slug: guide.slug }
  });
  res.json({ guide });
});

const listArtisans = asyncHandler(async (req, res) => {
  const artisans = await Artisan.find().sort({ name: 1 });
  res.json({ artisans });
});

const listWorkshops = asyncHandler(async (req, res) => {
  const workshops = await Workshop.find().sort({ title: 1 });
  res.json({ workshops });
});

const inquireWorkshop = asyncHandler(async (req, res) => {
  const workshop = await Workshop.findById(req.params.id);
  if (!workshop) return res.status(404).json({ message: 'Workshop not found.' });
  const { name, email, phone, message } = req.body;
  if (!name || !email) return res.status(400).json({ message: 'Name and email are required.' });
  await WorkshopInquiry.create({ workshop: workshop._id, name, email, phone, message });
  await AnalyticsEvent.create({
    eventType: 'workshop_view',
    user: req.user?._id || null,
    metadata: { workshopId: workshop._id, inquiry: true }
  });
  res.status(201).json({ message: 'Registration interest saved. This is a demo inquiry, not a paid booking.' });
});

const corporateInquiry = asyncHandler(async (req, res) => {
  const { companyName, contactName, email, phone, quantity, message } = req.body;
  if (!companyName || !contactName || !email || !message) {
    return res.status(400).json({ message: 'Company, contact name, email, and message are required.' });
  }
  const inquiry = await CorporateInquiry.create({
    companyName,
    contactName,
    email,
    phone,
    quantity: Number(quantity) || 1,
    message
  });
  await AnalyticsEvent.create({
    eventType: 'corporate_inquiry',
    user: req.user?._id || null,
    metadata: { companyName }
  });
  res.status(201).json({ message: 'Thank you. Our B2B desk will review this demo inquiry.', inquiryId: inquiry._id });
});

module.exports = {
  listFestivals,
  getFestival,
  listBundles,
  getBundle,
  addBundleToCart,
  listGuides,
  getGuide,
  listArtisans,
  listWorkshops,
  inquireWorkshop,
  corporateInquiry
};
