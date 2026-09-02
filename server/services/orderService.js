const crypto = require('crypto');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Cart = require('../models/Cart');
const { unitPrice, shippingFor, roundMoney } = require('../utils/pricing');
const { withTransaction } = require('../utils/transactions');

function buildOrderItems(productsWithQty) {
  const items = productsWithQty.map(({ product, quantity }) => {
    const price = unitPrice(product);
    return {
      product: product._id,
      name: product.name,
      sku: product.sku,
      image: product.images?.[0]?.url || '',
      quantity,
      unitPrice: price,
      lineTotal: roundMoney(price * quantity)
    };
  });
  const subtotal = roundMoney(items.reduce((sum, i) => sum + i.lineTotal, 0));
  const shippingFee = shippingFor(subtotal);
  return {
    items,
    subtotal,
    shippingFee,
    discount: 0,
    total: roundMoney(subtotal + shippingFee)
  };
}

async function loadCartProducts(cart) {
  const ids = cart.items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: ids } });
  const map = new Map(products.map((p) => [String(p._id), p]));
  const result = [];
  for (const item of cart.items) {
    const product = map.get(String(item.product));
    if (!product) {
      const error = new Error('A product in the cart is no longer available.');
      error.statusCode = 400;
      throw error;
    }
    if (product.stock < item.quantity) {
      const error = new Error(`${product.name} does not have enough stock.`);
      error.statusCode = 400;
      throw error;
    }
    result.push({ product, quantity: item.quantity });
  }
  if (!result.length) {
    const error = new Error('Your cart is empty.');
    error.statusCode = 400;
    throw error;
  }
  return result;
}

async function createPendingOrder({ user, cart, shippingAddress, paymentMethod, transactionId }) {
  const productsWithQty = await loadCartProducts(cart);
  const totals = buildOrderItems(productsWithQty);
  const order = await Order.create({
    user: user?._id || null,
    items: totals.items,
    shippingAddress,
    subtotal: totals.subtotal,
    shippingFee: totals.shippingFee,
    discount: totals.discount,
    total: totals.total,
    paymentMethod,
    paymentStatus: 'Pending',
    orderStatus: 'Pending',
    transactionId
  });
  await Payment.create({
    order: order._id,
    user: user?._id || null,
    provider: paymentMethod,
    transactionId,
    amount: totals.total,
    currency: 'NPR',
    status: 'Pending',
    paymentMethod
  });
  return order;
}

async function fulfillPaidOrder({ order, transactionId, rawStatus }) {
  return withTransaction(async (session) => {
    const current = await Order.findById(order._id).session(session || undefined);
    if (!current) {
      const error = new Error('Order not found.');
      error.statusCode = 404;
      throw error;
    }
    if (current.paymentStatus === 'Paid') {
      return current;
    }

    for (const item of current.items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity, popularityScore: item.quantity } },
        { new: true, session: session || undefined }
      );
      if (!updated) {
        const error = new Error('Stock changed before payment could be completed.');
        error.statusCode = 409;
        throw error;
      }
    }

    current.paymentStatus = 'Paid';
    current.orderStatus = 'Paid';
    current.transactionId = transactionId;
    current.stockReserved = true;
    await current.save({ session: session || undefined });

    await Payment.findOneAndUpdate(
      { transactionId },
      { status: 'Paid', rawStatus: rawStatus || 'succeeded' },
      { session: session || undefined }
    );

    if (current.user) {
      await Cart.findOneAndUpdate(
        { user: current.user },
        { $set: { items: [] } },
        { session: session || undefined }
      );
    }
    return current;
  });
}

async function markPaymentFailed({ transactionId, reason }) {
  const payment = await Payment.findOneAndUpdate(
    { transactionId, status: 'Pending' },
    { status: 'Failed', rawStatus: reason || 'failed' }
  );
  if (payment) {
    await Order.findByIdAndUpdate(payment.order, {
      paymentStatus: 'Failed',
      orderStatus: 'Cancelled'
    });
  }
  return payment;
}

function newTxnId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

module.exports = {
  buildOrderItems,
  loadCartProducts,
  createPendingOrder,
  fulfillPaidOrder,
  markPaymentFailed,
  newTxnId,
  buildOrderItems: buildOrderItems,
  loadCartProducts: loadCartProducts,
  createPendingOrder: createPendingOrder,
  fulfillPaidOrder: fulfillPaidOrder,
  markPaymentFailed: markPaymentFailed,
  newTxnId: newTxnId
};
