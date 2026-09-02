const bcrypt = require('bcryptjs');
const { getDb } = require('../config/db');
const { initializeDatabase } = require('./initDb');

const DEMO_PASSWORD = 'Demo@12345';

const categories = [
  {
    name: 'Mithila Foods',
    slug: 'mithila-foods',
    description: 'Festive sweets, pickles, and traditional snacks from Mithila kitchens.',
    image: '/images/categories/foods.svg'
  },
  {
    name: 'Mithila Art',
    slug: 'mithila-art',
    description: 'Madhubani and Mithila paintings featuring peacocks, trees of life, and ritual motifs.',
    image: '/images/categories/art.svg'
  },
  {
    name: 'Handicrafts',
    slug: 'handicrafts',
    description: 'Handmade baskets, home decor, and artisan objects.',
    image: '/images/categories/handicrafts.svg'
  },
  {
    name: 'Ritual & Festival Kits',
    slug: 'ritual-festival-kits',
    description: 'Prepared kits for Chhath, pujas, and seasonal festivals.',
    image: '/images/categories/ritual.svg'
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    description: 'Sarees, scarves, and clothing with Mithila patterns.',
    image: '/images/categories/fashion.svg'
  }
];

const productsData = [
  // Mithila Foods (7)
  {
    name: 'Aamot (Amat) – Traditional Mithila Mango Preserve',
    slug: 'aamot-amat-mithila-mango-preserve',
    categorySlug: 'mithila-foods',
    description: 'Sweet preserved mango prepared in the traditional Mithila style.',
    usage_instructions: 'Serve as a traditional sweet preserve with rice or snacks.',
    price: 350,
    stock: 60,
    featured: 1,
    active: 1,
    image: '/images/products/aamot-amat-mithila-mango-preserve.jpg'
  },
  {
    name: 'Arikanchan – Traditional Mithila Food',
    slug: 'arikanchan-traditional-mithila-food',
    categorySlug: 'mithila-foods',
    description: 'Traditional homemade Mithila food prepared with local ingredients.',
    usage_instructions: 'Enjoy as a snack or with tea.',
    price: 350,
    stock: 50,
    featured: 0,
    active: 1,
    image: '/images/products/arikanchan-traditional-mithila-food.jpg'
  },
  {
    name: 'Fulauri – Traditional Mithila Rice Crackers',
    slug: 'fulauri-mithila-rice-crackers',
    categorySlug: 'mithila-foods',
    description: 'Crispy traditional rice crackers popular in Mithila households.',
    usage_instructions: 'Eat as a snack or serve with tea.',
    price: 250,
    stock: 80,
    featured: 0,
    active: 1,
    image: '/images/products/fulauri-mithila-rice-crackers.jpg'
  },
  {
    name: 'Khajuri – Traditional Mithila Snack',
    slug: 'traditional-khajuri',
    categorySlug: 'mithila-foods',
    description: 'Traditional sweet snack commonly served during festivals and tea time.',
    usage_instructions: 'Store in airtight container. Enjoy with tea.',
    price: 280,
    stock: 80,
    featured: 1,
    active: 1,
    image: '/images/products/traditional-khajuri.jpg'
  },
  {
    name: 'Masyaura – Traditional Mithila Dried Vegetable',
    slug: 'masyaura-traditional-mithila-dried-vegetable',
    categorySlug: 'mithila-foods',
    description: 'Sun-dried vegetable balls used in traditional Mithila cuisine.',
    usage_instructions: 'Fry or add to curries.',
    price: 300,
    stock: 60,
    featured: 0,
    active: 1,
    image: '/images/products/masyaura-traditional-mithila-dried-vegetable.jpg'
  },
  {
    name: 'Thekuwa – Traditional Mithila Sweet',
    slug: 'thekuwa-traditional-mithila-sweet',
    categorySlug: 'mithila-foods',
    description: 'Famous traditional sweet prepared especially during Chhath festival.',
    usage_instructions: 'Use as Chhath offering or enjoy as a snack.',
    price: 300,
    stock: 70,
    featured: 0,
    active: 1,
    image: '/images/products/thekuwa-traditional-mithila-sweet.jpg'
  },
  {
    name: 'Tilauri – Traditional Mithila Sesame Snack',
    slug: 'tilauri-traditional-mithila-sesame-snack',
    categorySlug: 'mithila-foods',
    description: 'Traditional sesame-based snack from the Mithila region.',
    usage_instructions: 'Serve as a snack during festivals or with tea.',
    price: 300,
    stock: 70,
    featured: 0,
    active: 1,
    image: '/images/products/tilauri-traditional-mithila-sesame-snack.jpg'
  },
  // Mithila Art (2)
  {
    name: 'Mithila Madhubani Painting',
    slug: 'mithila-madhubani-painting',
    categorySlug: 'mithila-art',
    description: 'Handmade Madhubani painting inspired by traditional Mithila art.',
    usage_instructions: 'Keep away from direct sunlight. Frame recommended.',
    price: 2500,
    stock: 12,
    featured: 1,
    active: 1,
    image: '/images/products/mithila-madhubani-painting.jpg'
  },
  {
    name: 'Mithila Traditional Wall Art',
    slug: 'mithila-traditional-wall-art',
    categorySlug: 'mithila-art',
    description: 'Decorative handcrafted wall art featuring Mithila motifs.',
    usage_instructions: 'Hang indoors. Avoid humidity.',
    price: 1500,
    stock: 15,
    featured: 0,
    active: 1,
    image: '/images/products/mithila-traditional-wall-art.jpg'
  },
  // Handicrafts (2)
  {
    name: 'Handmade Sikki Basket',
    slug: 'handmade-sikki-basket',
    categorySlug: 'handicrafts',
    description: 'Handmade basket woven from traditional sikki grass.',
    usage_instructions: 'Can be used for storage, decoration, or traditional gifting.',
    price: 800,
    stock: 40,
    featured: 0,
    active: 1,
    image: '/images/products/handmade-sikki-basket.jpg'
  },
  {
    name: 'Traditional Mithila Bamboo Craft',
    slug: 'traditional-mithila-bamboo-craft',
    categorySlug: 'handicrafts',
    description: 'Eco-friendly handcrafted bamboo basket for home use and decoration.',
    usage_instructions: 'Keep dry. Dust occasionally.',
    price: 700,
    stock: 40,
    featured: 0,
    active: 1,
    image: '/images/products/traditional-mithila-bamboo-craft.jpg'
  },
  // Ritual & Festival Kits (3)
  {
    name: 'Chhath Puja Samagri Kit',
    slug: 'chhath-puja-samagri-kit',
    categorySlug: 'ritual-festival-kits',
    description: 'Complete collection of essential items required for Chhath Puja.',
    usage_instructions: 'Contains commonly used ritual items for Chhath Puja. Suitable for home worship and traditional celebrations.',
    price: 1500,
    stock: 30,
    featured: 0,
    active: 1,
    image: '/images/products/chhath-puja-samagri-kit.jpg'
  },
  {
    name: 'Mithila Wedding Samagri Kit',
    slug: 'mithila-wedding-samagri-kit',
    categorySlug: 'ritual-festival-kits',
    description: 'Traditional wedding ceremony kit containing essential ritual items.',
    usage_instructions: 'Use all items during wedding rituals and ceremonies.',
    price: 2000,
    stock: 20,
    featured: 0,
    active: 1,
    image: '/images/products/wedding-kit.jpg'
  },
  {
    name: 'Taste of Mithila Gift Box',
    slug: 'taste-of-mithila-gift-box',
    categorySlug: 'ritual-festival-kits',
    description: 'Gift box containing a selection of traditional Mithila foods and cultural items.',
    usage_instructions: 'Distribute during celebrations, festivals, or as a housewarming gift.',
    price: 1800,
    stock: 25,
    featured: 0,
    active: 1,
    image: '/images/products/mithila-gift-box.jpg'
  },
  // Fashion (1)
  {
    name: 'Mithila Painted Saree',
    slug: 'mithila-painted-saree',
    categorySlug: 'fashion',
    description: 'Traditional saree decorated with Mithila-inspired artwork.',
    usage_instructions: 'Hand wash cold. Line dry.',
    price: 3500,
    stock: 20,
    featured: 1,
    active: 1,
    image: '/images/products/painted-mithila-saree.jpg'
  }
];

async function seedDatabase({ quiet = false } = {}) {
  await initializeDatabase();
  const db = await getDb();

  // Clear existing data
  await db.exec('DELETE FROM order_items');
  await db.exec('DELETE FROM payments');
  await db.exec('DELETE FROM wallet_transactions');
  await db.exec('DELETE FROM orders');
  await db.exec('DELETE FROM cart_items');
  await db.exec('DELETE FROM wishlist_items');
  await db.exec('DELETE FROM products');
  await db.exec('DELETE FROM categories');
  await db.exec('DELETE FROM wallets');
  await db.exec('DELETE FROM users');
  
  // Seed Users
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const usersToInsert = [
    ['Mithila Ghar Admin', 'admin@mithilaghar.local', passwordHash, 'admin'],
    ['Sita Sharma', 'customer1@mithilaghar.local', passwordHash, 'customer'],
    ['Ram Yadav', 'customer2@mithilaghar.local', passwordHash, 'customer'],
    ['Wallet User One', 'walletuser1@mithilaghar.local', passwordHash, 'customer'],
    ['Wallet User Two', 'walletuser2@mithilaghar.local', passwordHash, 'customer']
  ];
  
  const userMap = {};
  for (const u of usersToInsert) {
    const res = await db.run(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      u
    );
    userMap[u[1]] = res.lastID;
  }

  // Seed Categories
  const catMap = {};
  for (const c of categories) {
    const res = await db.run(
      'INSERT INTO categories (name, slug, description, image) VALUES (?, ?, ?, ?)',
      [c.name, c.slug, c.description, c.image]
    );
    catMap[c.slug] = res.lastID;
  }

  // Seed Products
  for (const p of productsData) {
    await db.run(
      `INSERT INTO products (name, slug, description, usage_instructions, price, stock, image, featured, active, category_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.name, p.slug, p.description, p.usage_instructions, p.price, p.stock, p.image, p.featured, p.active, catMap[p.categorySlug]]
    );
  }

  // Seed Wallets
  const w1Res = await db.run('INSERT INTO wallets (user_id, balance, currency) VALUES (?, ?, ?)', [userMap['walletuser1@mithilaghar.local'], 2000, 'NPR']);
  const w2Res = await db.run('INSERT INTO wallets (user_id, balance, currency) VALUES (?, ?, ?)', [userMap['walletuser2@mithilaghar.local'], 1000, 'NPR']);
  await db.run('INSERT INTO wallets (user_id, balance, currency) VALUES (?, ?, ?)', [userMap['customer1@mithilaghar.local'], 500, 'NPR']);
  await db.run('INSERT INTO wallets (user_id, balance, currency) VALUES (?, ?, ?)', [userMap['customer2@mithilaghar.local'], 500, 'NPR']);
  
  // Seed Wallet Transactions
  await db.run(
    `INSERT INTO wallet_transactions (wallet_id, receiver_user_id, type, amount, reference, status, description) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [w1Res.lastID, userMap['walletuser1@mithilaghar.local'], 'TOP_UP', 2000, 'SEED_TOP_W1', 'completed', 'Seed demonstration balance']
  );
  await db.run(
    `INSERT INTO wallet_transactions (wallet_id, receiver_user_id, type, amount, reference, status, description) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [w2Res.lastID, userMap['walletuser2@mithilaghar.local'], 'TOP_UP', 1000, 'SEED_TOP_W2', 'completed', 'Seed demonstration balance']
  );

  if (!quiet) {
    console.log('Seed complete. 15 products, 5 categories inserted.');
    console.log('Demo password for all accounts: Demo@12345');
    console.log('Admin: admin@mithilaghar.local');
    console.log('Customers: customer1@mithilaghar.local, customer2@mithilaghar.local');
    console.log('Wallet demo: walletuser1 / walletuser2 (emails @mithilaghar.local)');
  }
}

async function run() {
  const { connectDb, disconnectDb } = require('../config/db');
  await connectDb();
  await seedDatabase();
  await disconnectDb();
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { seedDatabase, DEMO_PASSWORD };
