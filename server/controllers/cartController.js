const { getDb } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { getOrCreateSessionId } = require('../utils/session');

function getIdentifier(req, res) {
  return req.user ? req.user.id.toString() : String(getOrCreateSessionId(req, res));
}

const getCart = asyncHandler(async (req, res) => {
  const identifier = getIdentifier(req, res);
  const db = await getDb();
  
  const query = `
    SELECT c.*, p.name, p.slug, p.price, p.image, p.stock
    FROM cart_items c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
  `;
  
  const items = await db.all(query, [identifier]);

  // Subtotal mapped to match React expectations
  let subtotal = 0;
  const mappedItems = items.map(item => {
    subtotal += item.price * item.quantity;
    return {
      _id: item.id,
      id: item.id,
      product: {
        _id: item.product_id,
        id: item.product_id,
        name: item.name,
        slug: item.slug,
        price: item.price,
        stock: item.stock,
        images: [{ url: item.image }]
      },
      quantity: item.quantity
    };
  });

  res.json({ items: mappedItems, subtotal });
});

const addToCart = asyncHandler(async (req, res) => {
  const identifier = getIdentifier(req, res);
  const { productId, quantity = 1 } = req.body;
  const db = await getDb();

  if (!productId) return res.status(400).json({ message: 'Product ID is required.' });

  const parsedProductId = Number(productId);
  if (!Number.isInteger(parsedProductId) || parsedProductId <= 0) {
    return res.status(400).json({ message: 'Invalid product ID.' });
  }

  const product = await db.get('SELECT stock FROM products WHERE id = ?', [parsedProductId]);
  if (!product) return res.status(400).json({ message: 'Product not found.' });

  const existing = await db.get('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?', [identifier, productId]);

  if (existing) {
    const newQty = existing.quantity + Number(quantity);
    if (newQty > product.stock) {
      return res.status(400).json({ message: 'Requested quantity exceeds available stock.' });
    }
    await db.run('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing.id]);
  } else {
    if (quantity > product.stock) {
      return res.status(400).json({ message: 'Requested quantity exceeds available stock.' });
    }
    await db.run('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)', [
      identifier, productId, quantity
    ]);
  }

  // Fetch updated list of cart items
  const query = `
    SELECT c.*, p.name, p.slug, p.price, p.image, p.stock
    FROM cart_items c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
  `;
  const items = await db.all(query, [identifier]);
  let subtotal = 0;
  const mappedItems = items.map(item => {
    subtotal += item.price * item.quantity;
    return {
      _id: item.id,
      product: {
        _id: item.product_id,
        name: item.name,
        slug: item.slug,
        price: item.price,
        stock: item.stock,
        images: [{ url: item.image }]
      },
      quantity: item.quantity
    };
  });

  res.status(201).json({ cart: { items: mappedItems, subtotal } });
});

const updateCartItem = asyncHandler(async (req, res) => {
  const identifier = getIdentifier(req, res);
  const quantity = Number(req.body.quantity ?? req.body.qty ?? 1);
  const productId = Number(req.params.productId || req.params.id);

  if (!Number.isFinite(quantity) || quantity < 1) {
    return res.status(400).json({ message: 'Quantity must be greater than 0.' });
  }

  const db = await getDb();
  const cartItem = await db.get('SELECT * FROM cart_items WHERE product_id = ? AND user_id = ?', [productId, identifier]);
  if (!cartItem) return res.status(404).json({ message: 'Cart item not found.' });

  const product = await db.get('SELECT stock FROM products WHERE id = ?', [productId]);
  if (quantity > product.stock) {
    return res.status(400).json({ message: 'Requested quantity exceeds available stock.' });
  }

  await db.run('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, cartItem.id]);

  const query = `
    SELECT c.*, p.name, p.slug, p.price, p.image, p.stock
    FROM cart_items c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
  `;
  const items = await db.all(query, [identifier]);
  let subtotal = 0;
  const mappedItems = items.map(item => {
    subtotal += item.price * item.quantity;
    return {
      _id: item.id,
      id: item.id,
      product: {
        _id: item.product_id,
        id: item.product_id,
        name: item.name,
        slug: item.slug,
        price: item.price,
        stock: item.stock,
        images: [{ url: item.image }]
      },
      quantity: item.quantity
    };
  });

  res.json({ cart: { items: mappedItems, subtotal }, message: 'Cart updated' });
});

const removeCartItem = asyncHandler(async (req, res) => {
  const identifier = getIdentifier(req, res);
  const productId = Number(req.params.productId || req.params.id);
  const db = await getDb();
  await db.run('DELETE FROM cart_items WHERE product_id = ? AND user_id = ?', [productId, identifier]);
  const query = `
    SELECT c.*, p.name, p.slug, p.price, p.image, p.stock
    FROM cart_items c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
  `;
  const items = await db.all(query, [identifier]);
  let subtotal = 0;
  const mappedItems = items.map(item => {
    subtotal += item.price * item.quantity;
    return {
      _id: item.id,
      id: item.id,
      product: {
        _id: item.product_id,
        id: item.product_id,
        name: item.name,
        slug: item.slug,
        price: item.price,
        stock: item.stock,
        images: [{ url: item.image }]
      },
      quantity: item.quantity
    };
  });

  res.json({ cart: { items: mappedItems, subtotal }, message: 'Item removed from cart' });
});

const clearCart = asyncHandler(async (req, res) => {
  const identifier = getIdentifier(req, res);
  const db = await getDb();
  await db.run('DELETE FROM cart_items WHERE user_id = ?', [identifier]);
  res.json({ message: 'Cart cleared' });
});

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, removeFromCart: removeCartItem, clearCart };
