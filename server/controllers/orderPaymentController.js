const crypto = require('crypto');
const { getDb } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');
const { sendOrderPlacedEmail } = require('../services/emailService');

function generateOrderNumber() {
  return `MG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function createEsewaSignature(fields) {
  const message = `total_amount=${fields.total_amount},transaction_uuid=${fields.transaction_uuid},product_code=${fields.product_code}`;
  return crypto.createHmac('sha256', env.esewaSecretKey).update(message).digest('base64');
}

function createOrderPayloadForPayment(userId, shippingDetails, paymentMethod) {
  return {
    userId,
    shippingDetails,
    paymentMethod
  };
}

function calculateShippingFee(city = '', province = '') {
  const location = `${city || ''} ${province || ''}`.toLowerCase();
  if (location.includes('kathmandu')) return 0;
  return 100;
}

// Minimal checkout flow for card and cash-on-delivery orders.
const processCheckout = asyncHandler(async (req, res) => {
  const { paymentMethod, shippingDetails, cardDetails } = req.body;
  if (!paymentMethod || !shippingDetails) {
    return res.status(400).json({ message: 'Missing checkout parameters.' });
  }
  
  const db = await getDb();
  
  // 1. Fetch Cart
  const cartItems = await db.all(`
    SELECT c.*, p.price, p.stock, p.name 
    FROM cart_items c 
    JOIN products p ON c.product_id = p.id 
    WHERE c.user_id = ?
  `, [req.user.id]);
  
  if (cartItems.length === 0) {
    return res.status(400).json({ message: 'Cart is empty.' });
  }
  
  let subtotal = 0;
  for (let item of cartItems) {
    if (item.quantity > item.stock) {
      return res.status(400).json({ message: `Insufficient stock for \${item.name}` });
    }
    subtotal += item.price * item.quantity;
  }
  
  const shipping = calculateShippingFee(shippingDetails.city, shippingDetails.province);
  const total = subtotal + shipping;

  await db.run('BEGIN TRANSACTION');

  try {
    const paymentStatus = paymentMethod === 'COD' ? 'pending' : 'completed';
    let transactionReference = `TXN-\${Date.now()}`;
    
    const orderNumber = generateOrderNumber();
    
    // Insert Order
    const orderResult = await db.run(
      `INSERT INTO orders (user_id, order_number, subtotal, shipping, total, status, payment_status, payment_method, shipping_name, shipping_email, shipping_phone, shipping_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, orderNumber, subtotal, shipping, total, 'processing', paymentStatus, paymentMethod,
       shippingDetails.name, shippingDetails.email, shippingDetails.phone, shippingDetails.address]
    );
    const orderId = orderResult.lastID;
    
    // Insert Order Items and reduce stock
    for (let item of cartItems) {
      const lineSubtotal = item.price * item.quantity;
      await db.run(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
          VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.name, item.price, item.quantity, lineSubtotal]
      );
      await db.run('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
    }
    
    // Insert Payment Record
    const cardLast4 = cardDetails && cardDetails.cardNumber ? cardDetails.cardNumber.slice(-4) : null;
    await db.run(
      `INSERT INTO payments (order_id, user_id, payment_method, transaction_reference, amount, status, card_last4)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orderId, req.user.id, paymentMethod, transactionReference, total, paymentStatus, cardLast4]
    );

    // Clear cart
    await db.run('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    
    await db.run('COMMIT');

    try {
      await sendOrderPlacedEmail({
        shipping_email: shippingDetails.email,
        shipping_name: shippingDetails.name,
        order_number: orderNumber,
        total,
        status: 'Placed'
      });
    } catch (mailError) {
      console.error('Failed to send order placement email:', mailError);
    }

    res.status(201).json({ message: 'Order created', orderId, orderNumber });
  } catch (err) {
    await db.run('ROLLBACK');
    throw err;
  }
});

const createEsewaPayment = asyncHandler(async (req, res) => {
  const payload = req.body?.shippingDetails || req.body || {};
  const shippingDetails = payload && Object.keys(payload).length > 0 ? payload : {
    name: req.query.name,
    email: req.query.email,
    phone: req.query.phone,
    city: req.query.city,
    province: req.query.province,
    address: req.query.address || `${req.query.city || ''}, ${req.query.province || ''}`
  };

  if (!shippingDetails || !shippingDetails.name || !shippingDetails.email || !shippingDetails.phone || !shippingDetails.address) {
    return res.status(400).json({ message: 'Missing shipping details for eSewa payment.' });
  }

  const db = await getDb();
  const cartItems = await db.all(`
    SELECT c.*, p.price, p.stock, p.name 
    FROM cart_items c 
    JOIN products p ON c.product_id = p.id 
    WHERE c.user_id = ?
  `, [req.user.id]);

  if (cartItems.length === 0) {
    return res.status(400).json({ message: 'Cart is empty.' });
  }

  let subtotal = 0;
  for (const item of cartItems) {
    if (item.quantity > item.stock) {
      return res.status(400).json({ message: `Insufficient stock for ${item.name}` });
    }
    subtotal += item.price * item.quantity;
  }

  const shipping = calculateShippingFee(shippingDetails.city, shippingDetails.province);
  const total = subtotal + shipping;
  const orderNumber = generateOrderNumber();

  const orderResult = await db.run(
    `INSERT INTO orders (user_id, order_number, subtotal, shipping, total, status, payment_status, payment_method, shipping_name, shipping_email, shipping_phone, shipping_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, orderNumber, subtotal, shipping, total, 'pending', 'pending', 'ESEWA',
      shippingDetails.name, shippingDetails.email, shippingDetails.phone, shippingDetails.address]
  );

  const orderId = orderResult.lastID;

  for (const item of cartItems) {
    const lineSubtotal = item.price * item.quantity;
    await db.run(
      `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
        VALUES (?, ?, ?, ?, ?, ?)`,
      [orderId, item.product_id, item.name, item.price, item.quantity, lineSubtotal]
    );
  }

  await db.run(
    `INSERT INTO payments (order_id, user_id, payment_method, transaction_reference, amount, status)
      VALUES (?, ?, ?, ?, ?, ?)`,
    [orderId, req.user.id, 'ESEWA', orderNumber, total, 'pending']
  );

  const fields = {
    amount: subtotal.toFixed(2),
    tax_amount: '0',
    total_amount: total.toFixed(2),
    transaction_uuid: orderNumber,
    product_code: env.esewaMerchantCode,
    product_service_charge: '0',
    product_delivery_charge: shipping.toFixed(2),
    success_url: `${env.serverUrl}/api/payments/esewa/success?orderId=${orderId}`,
    failure_url: `${env.serverUrl}/api/payments/esewa/failure?orderId=${orderId}`,
    signed_field_names: 'total_amount,transaction_uuid,product_code'
  };

  fields.signature = createEsewaSignature(fields);

  res.json({
    message: 'eSewa payment initialized',
    orderId,
    paymentUrl: env.esewaPaymentUrl,
    fields
  });
});

const handleEsewaSuccess = asyncHandler(async (req, res) => {
  const rawOrderId = String(req.query.orderId || '').split('?')[0];
  const orderId = rawOrderId && /^\d+$/.test(rawOrderId) ? Number(rawOrderId) : null;
  if (orderId) {
    const db = await getDb();
    const order = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);

    await db.run(
      'UPDATE orders SET payment_status = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['completed', 'processing', orderId]
    );
    await db.run(
      'UPDATE payments SET status = ?, transaction_reference = ? WHERE order_id = ?',
      ['completed', `ESEWA-${Date.now()}`, orderId]
    );
    await db.run('DELETE FROM cart_items WHERE user_id = ?', [order?.user_id || req.user?.id || 0]);

    if (order && order.shipping_email) {
      try {
        await sendOrderPlacedEmail({
          shipping_email: order.shipping_email,
          shipping_name: order.shipping_name,
          order_number: order.order_number,
          total: order.total,
          status: 'Placed'
        });
      } catch (mailError) {
        console.error('Failed to send eSewa order confirmation email:', mailError);
      }
    }
  }

  const clientUrl = `${env.clientUrl}/payment-success?payment=esewa${orderId ? `&orderId=${orderId}` : ''}`;
  res.redirect(clientUrl);
});

const handleEsewaFailure = asyncHandler(async (req, res) => {
  const orderId = req.query.orderId;
  if (orderId) {
    const db = await getDb();
    await db.run(
      'UPDATE orders SET payment_status = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['failed', 'cancelled', Number(orderId)]
    );
    await db.run(
      'UPDATE payments SET status = ? WHERE order_id = ?',
      ['failed', Number(orderId)]
    );
  }

  const clientUrl = `${env.clientUrl}/payment-failure?payment=esewa${orderId ? `&orderId=${orderId}` : ''}`;
  res.redirect(clientUrl);
});

const getMyOrders = asyncHandler(async (req, res) => {
  const db = await getDb();
  const orders = await db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
  
  const mappedOrders = orders.map(o => ({
    _id: o.id,
    id: o.id,
    orderNumber: o.order_number,
    subtotal: o.subtotal,
    shipping: o.shipping,
    total: o.total,
    status: o.status,
    paymentStatus: o.payment_status,
    paymentMethod: o.payment_method,
    createdAt: o.created_at
  }));
                   
  res.json({ orders: mappedOrders });
});

const getOrderById = asyncHandler(async (req, res) => {
  const db = await getDb();
  const order = await db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  
  if (!order) return res.status(404).json({ message: 'Order not found' });
  
  const rawItems = await db.all('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
  const items = rawItems.map(i => ({
    productName: i.product_name,
    product: i.product_id, // simple mapping referencing product
    price: i.unit_price,
    quantity: i.quantity
  }));
  
  res.json({
    order: {
      _id: order.id,
      id: order.id,
      orderNumber: order.order_number,
      shippingDetails: {
        name: order.shipping_name,
        email: order.shipping_email,
        phone: order.shipping_phone,
        address: order.shipping_address
      },
      orderItems: items,
      subtotal: order.subtotal,
      shipping: order.shipping,
      total: order.total,
      status: order.status,
      createdAt: order.created_at,
      paymentMethod: order.payment_method
    }
  });
});

module.exports = {
  processCheckout,
  createEsewaPayment,
  handleEsewaSuccess,
  handleEsewaFailure,
  getMyOrders,
  getOrderById
};
