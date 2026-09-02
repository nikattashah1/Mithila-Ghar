const env = require('../config/env');

function unitPrice(product) {
  if (product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price) {
    return product.discountPrice;
  }
  return product.price;
}
function shippingFor(subtotal) {
  if (subtotal >= env.freeShippingThreshold) return 0;
  return env.shippingFee;
}
function nprToStripeAmount(npr) {
  return Math.max(50, Math.round((npr / env.nprPerUsd) * 100));
}
function roundMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}
module.exports = {
  unitPrice,
  shippingFor,
  nprToStripeAmount,
  roundMoney,
  unitPrice,
  shippingFor,
  nprToStripeAmount,
  roundMoney
};
