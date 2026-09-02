const { getDb } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const listCategories = asyncHandler(async (req, res) => {
  const db = await getDb();
  const categories = await db.all('SELECT * FROM categories ORDER BY name ASC');
  res.json({ categories });
});

const listProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 24));
  const sortKey = req.query.sort || 'newest';

  let whereClauses = [];
  let params = [];
  const db = await getDb();

  if (req.query.category) {
    const category = await db.get('SELECT id FROM categories WHERE slug = ?', [req.query.category]);
    if (category) {
      whereClauses.push('category_id = ?');
      params.push(category.id);
    }
  }

  if (req.query.minPrice) {
    whereClauses.push('price >= ?');
    params.push(Number(req.query.minPrice));
  }
  
  if (req.query.maxPrice) {
    whereClauses.push('price <= ?');
    params.push(Number(req.query.maxPrice));
  }
  
  if (req.query.inStock === 'true') {
    whereClauses.push('stock > 0');
  }
  
  if (req.query.featured === 'true') {
    whereClauses.push('featured = 1');
  }

  if (req.query.q) {
    const q = `%${req.query.q}%`;
    whereClauses.push('(products.name LIKE ? OR products.description LIKE ? OR products.usage_instructions LIKE ?)');
    params.push(q, q, q);
  }

  let whereSql = '';
  if (whereClauses.length > 0) {
    whereSql = 'WHERE ' + whereClauses.join(' AND ');
  }

  let orderSql = 'ORDER BY products.created_at DESC';
  if (sortKey === 'price_asc') orderSql = 'ORDER BY products.price ASC';
  else if (sortKey === 'price_desc') orderSql = 'ORDER BY products.price DESC';
  // Popularity, rating omitted here since they aren't seeded in SQLite currently.

  const offset = (page - 1) * limit;

  const productsQuery = `
    SELECT products.*, categories.name as category_name, categories.slug as category_slug
    FROM products
    LEFT JOIN categories ON products.category_id = categories.id
    ${whereSql}
    ${orderSql}
    LIMIT ? OFFSET ?
  `;

  const countQuery = `SELECT COUNT(*) as count FROM products ${whereSql}`;

  const productsData = await db.all(productsQuery, [...params, limit, offset]);
  const { count: total } = await db.get(countQuery, params);

  const products = productsData.map(p => ({
    id: p.id,
    _id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    usage_instructions: p.usage_instructions,
    price: p.price,
    stock: p.stock,
    images: [{ url: p.image }],
    featured: !!p.featured,
    active: !!p.active,
    category: {
      id: p.category_id,
      name: p.category_name,
      slug: p.category_slug
    }
  }));

  res.json({
    products,
    page,
    pages: Math.ceil(total / limit) || 1,
    total
  });
});

const getProduct = asyncHandler(async (req, res) => {
  const db = await getDb();
  let query = 'SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.slug = ?';
  let productData = await db.get(query, [req.params.id]);

  if (!productData && !isNaN(req.params.id)) {
    query = 'SELECT p.*, c.name as category_name, c.slug as category_slug FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?';
    productData = await db.get(query, [Number(req.params.id)]);
  }

  if (!productData) return res.status(404).json({ message: 'Product not found.' });

  const product = {
    id: productData.id,
    _id: productData.id,
    name: productData.name,
    slug: productData.slug,
    description: productData.description,
    usage_instructions: productData.usage_instructions,
    price: productData.price,
    stock: productData.stock,
    images: [{ url: productData.image }],
    featured: !!productData.featured,
    active: !!productData.active,
    category: {
      id: productData.category_id,
      _id: productData.category_id,
      name: productData.category_name,
      slug: productData.category_slug
    }
  };

  res.json({ product });
});

const getCategory = asyncHandler(async (req, res) => {
  const db = await getDb();
  const category = await db.get('SELECT * FROM categories WHERE slug = ?', [req.params.slug]);
  if (!category) return res.status(404).json({ message: 'Category not found.' });
  res.json({ category: { ...category, _id: category.id } });
});

module.exports = { listCategories, listProducts, getProduct, getCategory };
