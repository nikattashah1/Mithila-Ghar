process.env.NODE_ENV = 'test';
process.env.USE_MEMORY_DB = 'false';
process.env.JWT_SECRET = 'test-secret';
process.env.CLIENT_URL = 'http://localhost:5173';

const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../app');
const { seedDatabase, DEMO_PASSWORD } = require('../seed/seed');
const { getDb } = require('../config/db');

let mongod;

before(async () => {
  mongod = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await mongoose.connect(mongod.getUri('mithila-test'));
  await seedDatabase({ quiet: true });
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('auth', () => {
  test('registration hashes password and returns jwt', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'New Student',
      email: 'student@mithilaghar.local',
      password: 'Student@123',
      confirmPassword: 'Student@123'
    });
    assert.equal(res.status, 201);
    assert.ok(res.body.token);

    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE email = ?', ['student@mithilaghar.local']);
    assert.ok(user);
    assert.notEqual(user.password_hash, 'Student@123');
  });

  test('login succeeds and rejects bad password', async () => {
    const ok = await request(app).post('/api/auth/login').send({
      email: 'customer1@mithilaghar.local',
      password: DEMO_PASSWORD
    });
    assert.equal(ok.status, 200);
    assert.ok(ok.body.token);
    const bad = await request(app).post('/api/auth/login').send({
      email: 'customer1@mithilaghar.local',
      password: 'wrong-password'
    });
    assert.equal(bad.status, 401);
  });

  test('login rate limits after five failed attempts', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/api/auth/login').send({
        email: 'customer1@mithilaghar.local',
        password: 'wrong-password'
      });
      if (i < 4) {
        assert.equal(res.status, 401);
      } else {
        assert.equal(res.status, 429);
      }
    }
  });

  test('unauthorized access is rejected', async () => {
    const res = await request(app).get('/api/wallet');
    assert.equal(res.status, 401);
    const customer = await request(app).post('/api/auth/login').send({
      email: 'customer1@mithilaghar.local',
      password: DEMO_PASSWORD
    });
    const admin = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${customer.body.token}`);
    assert.equal(admin.status, 403);
  });
});

describe('catalog and cart', () => {
  test('product retrieval', async () => {
    const res = await request(app).get('/api/products');
    assert.equal(res.status, 200);
    assert.ok(res.body.products.length >= 15);
  });

  test('esewa payment init returns signed sandbox form', async () => {
    const login = await request(app).post('/api/auth/login').send({
      email: 'customer1@mithilaghar.local',
      password: DEMO_PASSWORD
    });
    const product = await request(app).get('/api/products');
    const firstProduct = product.body.products[0];

    await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ productId: firstProduct.id, quantity: 1 });

    const res = await request(app)
      .post('/api/payments/esewa/init')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({
        shippingDetails: {
          name: 'Test User',
          email: 'customer1@mithilaghar.local',
          phone: '9800000000',
          city: 'Kathmandu',
          province: 'Bagmati',
          address: 'Basundhara, Kathmandu'
        },
        paymentMethod: 'ESEWA'
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.paymentUrl, 'https://rc-epay.esewa.com.np/api/epay/main/v2/form');
    assert.ok(res.body.fields.total_amount);
    assert.ok(res.body.fields.signature);
    assert.equal(Number(res.body.fields.product_delivery_charge), 0);
  });

  test('shipping fee is free in Kathmandu and NPR 100 elsewhere', async () => {
    const login = await request(app).post('/api/auth/login').send({
      email: 'customer1@mithilaghar.local',
      password: DEMO_PASSWORD
    });
    const product = await request(app).get('/api/products');
    const firstProduct = product.body.products[0];

    await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ productId: firstProduct.id, quantity: 1 });

    const kathmandu = await request(app)
      .get('/api/payments/esewa/init')
      .set('Authorization', `Bearer ${login.body.token}`)
      .query({
        name: 'Test User',
        email: 'customer1@mithilaghar.local',
        phone: '9800000000',
        city: 'Kathmandu',
        province: 'Bagmati',
        address: 'Basundhara, Kathmandu'
      });

    const other = await request(app)
      .get('/api/payments/esewa/init')
      .set('Authorization', `Bearer ${login.body.token}`)
      .query({
        name: 'Test User',
        email: 'customer1@mithilaghar.local',
        phone: '9800000000',
        city: 'Pokhara',
        province: 'Gandaki',
        address: 'Lake Side, Pokhara'
      });

    assert.equal(kathmandu.status, 200);
    assert.equal(Number(kathmandu.body.fields.product_delivery_charge), 0);
    assert.equal(other.status, 200);
    assert.equal(Number(other.body.fields.product_delivery_charge), 100);
  });

  test('cart add, update, remove and stock checks', async () => {
    const db = await getDb();
    const product = await db.get('SELECT * FROM products WHERE slug = ?', ['traditional-khajuri']);
    assert.ok(product, 'expected khajuri product to exist');

    const login = await request(app).post('/api/auth/login').send({
      email: 'customer1@mithilaghar.local',
      password: DEMO_PASSWORD
    });

    await request(app)
      .delete('/api/cart')
      .set('Authorization', `Bearer ${login.body.token}`);

    const add = await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ productId: product.id, quantity: 2 });
    assert.equal(add.status, 201);
    assert.equal(add.body.cart.items[0].quantity, 2);

    const update = await request(app)
      .put(`/api/cart/${product.id}`)
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ quantity: 3 });
    assert.equal(update.status, 200);
    assert.equal(update.body.cart.items[0].quantity, 3);

    const over = await request(app)
      .put(`/api/cart/${product.id}`)
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ quantity: 9999 });
    assert.equal(over.status, 400);

    const invalidQty = await request(app)
      .put(`/api/cart/${product.id}`)
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ quantity: -1 });
    assert.equal(invalidQty.status, 400);

    const badId = await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ productId: 'not-an-id', quantity: 1 });
    assert.equal(badId.status, 400);

    const remove = await request(app)
      .delete(`/api/cart/${product.id}`)
      .set('Authorization', `Bearer ${login.body.token}`);
    assert.equal(remove.status, 200);
    assert.equal(remove.body.cart.items.length, 0);
  });

  test('wishlist rejects out-of-stock products', async () => {
    const db = await getDb();
    const product = await db.get('SELECT * FROM products LIMIT 1');
    assert.ok(product, 'expected at least one product for wishlist test');

    await db.run('UPDATE products SET stock = 0 WHERE id = ?', [product.id]);

    const login = await request(app).post('/api/auth/login').send({
      email: 'customer1@mithilaghar.local',
      password: DEMO_PASSWORD
    });

    const res = await request(app)
      .post('/api/wishlist')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ productId: product.id });

    assert.equal(res.status, 400);
    assert.match(res.body.message, /out of stock|stock/i);
  });
});

describe('wallet', () => {
  test('p2p transfer and insufficient balance', async () => {
    const u1 = await request(app).post('/api/auth/login').send({
      email: 'walletuser1@mithilaghar.local',
      password: DEMO_PASSWORD
    });
    const before = await request(app).get('/api/wallet').set('Authorization', `Bearer ${u1.body.token}`);
    assert.equal(before.body.wallet.balance, 2000);

    const sent = await request(app)
      .post('/api/wallet/transfer')
      .set('Authorization', `Bearer ${u1.body.token}`)
      .send({ recipient: 'walletuser2', amount: 500, note: 'Lab 5 demo' });
    assert.equal(sent.status, 200);
    assert.equal(sent.body.wallet.balance, 1500);

    const u2 = await request(app).post('/api/auth/login').send({
      email: 'walletuser2@mithilaghar.local',
      password: DEMO_PASSWORD
    });
    const after = await request(app).get('/api/wallet').set('Authorization', `Bearer ${u2.body.token}`);
    assert.equal(after.body.wallet.balance, 1500);

    const negative = await request(app)
      .post('/api/wallet/transfer')
      .set('Authorization', `Bearer ${u1.body.token}`)
      .send({ recipient: 'walletuser2', amount: -10 });
    assert.equal(negative.status, 400);

    const tooMuch = await request(app)
      .post('/api/wallet/transfer')
      .set('Authorization', `Bearer ${u1.body.token}`)
      .send({ recipient: 'walletuser2', amount: 999999 });
    assert.equal(tooMuch.status, 400);
    assert.match(tooMuch.body.message, /Insufficient/);
  });
});
