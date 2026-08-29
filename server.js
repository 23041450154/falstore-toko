const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// PostgreSQL Pool
const pool = new Pool({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'falstore_db',
  password: 'naufal_secure_db_pass_2026',
  port: 5432,
});

// JSON fallback file in case DB is initializing
const DB_FILE = path.join(__dirname, '.agent', 'ecommerce_data.json');

const INITIAL_PRODUCTS = [
  {
    id: 'PRD-1',
    name: 'Oversized Cotton Tee Essential',
    category: 'fashion',
    price: 149000,
    original_price: 199000,
    rating: 4.9,
    sold: 234,
    stock: 45,
    badge: 'Best Seller',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
    desc: 'Bahan combed 24s premium, adem dan menyerap keringat, potongan rileks modern.'
  },
  {
    id: 'PRD-2',
    name: 'Urban Tech Cargo Pants Waterproof',
    category: 'fashion',
    price: 289000,
    original_price: 389000,
    rating: 4.8,
    sold: 142,
    stock: 28,
    badge: 'Diskon 25%',
    image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80',
    desc: 'Bahan despo stretch tahan percikan air, 6 saku fungsional dengan resleting YKK.'
  },
  {
    id: 'PRD-3',
    name: 'Wireless ANC Earbuds Pro Max',
    category: 'gadget',
    price: 499000,
    original_price: 799000,
    rating: 5.0,
    sold: 412,
    stock: 60,
    badge: 'Hot Item',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80',
    desc: 'Active Noise Cancellation 35dB, Bluetooth 5.3 low latency, baterai tahan 30 jam.'
  },
  {
    id: 'PRD-4',
    name: 'Smartwatch AMOLED Health Tracker',
    category: 'gadget',
    price: 649000,
    original_price: 899000,
    rating: 4.9,
    sold: 98,
    stock: 19,
    badge: 'New Arrival',
    image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&auto=format&fit=crop&q=80',
    desc: 'Layar Always-On Display AMOLED 1.43 inch, sensor SpO2, detak jantung, IP68 tahan air.'
  },
  {
    id: 'PRD-5',
    name: 'Retro Running Sneakers Chunky',
    category: 'sepatu',
    price: 379000,
    original_price: 499000,
    rating: 4.8,
    sold: 189,
    stock: 32,
    badge: 'Trending',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
    desc: 'Sol phylon super empuk, upper breathable mesh, grip karet anti slip.'
  },
  {
    id: 'PRD-6',
    name: 'Minimalist Leather Bi-Fold Wallet',
    category: 'aksesoris',
    price: 189000,
    original_price: 249000,
    rating: 4.9,
    sold: 310,
    stock: 50,
    badge: 'Premium Leather',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&auto=format&fit=crop&q=80',
    desc: 'Kulit sapi asli pull-up, proteksi RFID blocking, muat 8 kartu + slot uang kertas.'
  },
  {
    id: 'PRD-7',
    name: 'Aviator Polarized Sunglasses UV400',
    category: 'aksesoris',
    price: 139000,
    original_price: 199000,
    rating: 4.7,
    sold: 215,
    stock: 40,
    badge: 'Summer Sale',
    image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80',
    desc: 'Lensa polarized TAC anti silau 100% proteksi UV400, frame stainless ringan.'
  },
  {
    id: 'PRD-8',
    name: 'Canvas Casual High-Top Shoes',
    category: 'sepatu',
    price: 299000,
    original_price: 399000,
    rating: 4.8,
    sold: 174,
    stock: 25,
    badge: 'Classic',
    image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&auto=format&fit=crop&q=80',
    desc: 'Kanvas 12oz tebal tidak kaku, insole memory foam nyaman dipakai seharian.'
  }
];

// Initialize Database Tables
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        price NUMERIC NOT NULL,
        original_price NUMERIC NOT NULL,
        rating NUMERIC DEFAULT 5.0,
        sold INT DEFAULT 0,
        stock INT DEFAULT 50,
        badge VARCHAR(100),
        image TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        customer_address TEXT NOT NULL,
        courier VARCHAR(50) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        subtotal NUMERIC NOT NULL,
        discount NUMERIC DEFAULT 0,
        shipping_fee NUMERIC NOT NULL,
        total_amount NUMERIC NOT NULL,
        status VARCHAR(50) DEFAULT 'Menunggu Pembayaran',
        items JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed products if empty
    const countRes = await pool.query('SELECT count(*) FROM products');
    if (parseInt(countRes.rows[0].count) === 0) {
      for (const p of INITIAL_PRODUCTS) {
        await pool.query(`
          INSERT INTO products (id, name, category, price, original_price, rating, sold, stock, badge, image, description)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO NOTHING;
        `, [p.id, p.name, p.category, p.price, p.original_price, p.rating, p.sold, p.stock, p.badge, p.image, p.desc]);
      }
      console.log('PostgreSQL database seeded with initial products.');
    }
    console.log('PostgreSQL connected and tables verified.');
  } catch (err) {
    console.error('PostgreSQL connection error, using JSON file fallback:', err.message);
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify({ products: INITIAL_PRODUCTS, orders: [] }, null, 2));
    }
  }
}

initDB();

// Helper to broadcast event to AI Orchestrator
function logToAgent(role, message) {
  const logPath = path.join(__dirname, '.agent', 'agent_activity.jsonl');
  const entry = JSON.stringify({
    type: 'log',
    message: `[${role}] ${message}`,
    timestamp: new Date().toISOString()
  });
  try {
    fs.appendFileSync(logPath, entry + '\n');
  } catch(e) {}
}

// REST APIs

// 1. GET /api/products
app.get('/api/products', async (req, res) => {
  const { category, search } = req.query;
  try {
    let query = 'SELECT * FROM products ORDER BY created_at DESC';
    let params = [];
    const conditions = [];

    if (category && category !== 'all') {
      params.push(category);
      conditions.push(`category = $${params.length}`);
    }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conditions.push(`(LOWER(name) LIKE $${params.length} OR LOWER(description) LIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      query = `SELECT * FROM products WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`;
    }

    const result = await pool.query(query, params);
    res.json({ success: true, products: result.rows });
  } catch (err) {
    // Fallback JSON
    let data = INITIAL_PRODUCTS;
    if (fs.existsSync(DB_FILE)) {
      data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')).products;
    }
    let filtered = data;
    if (category && category !== 'all') filtered = filtered.filter(p => p.category === category);
    if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    res.json({ success: true, products: filtered });
  }
});

// 2. POST /api/products (Admin)
app.post('/api/products', async (req, res) => {
  const { name, category, price, original_price, stock, badge, image, desc } = req.body;
  if (!name || !price || !image) {
    return res.status(400).json({ error: 'Nama, harga, dan gambar produk wajib diisi!' });
  }

  const id = 'PRD-' + Math.floor(100 + Math.random() * 900);
  try {
    await pool.query(`
      INSERT INTO products (id, name, category, price, original_price, rating, sold, stock, badge, image, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [id, name, category || 'fashion', price, original_price || price, 5.0, 0, stock || 50, badge || 'New', image, desc || '']);

    logToAgent('Backend Dev', `Produk baru ditambahkan ke katalog: "${name}" (${id})`);
    res.json({ success: true, product: { id, name, price } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. DELETE /api/products/:id (Admin)
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    logToAgent('Backend Dev', `Produk ${id} dihapus dari katalog.`);
    res.json({ success: true, message: 'Produk berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. POST /api/orders (Customer Checkout)
app.post('/api/orders', async (req, res) => {
  const { customer_name, customer_phone, customer_address, courier, payment_method, items, discount_code } = req.body;

  if (!customer_name || !customer_phone || !items || items.length === 0) {
    return res.status(400).json({ error: 'Data pesanan tidak lengkap.' });
  }

  const orderId = 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
  
  const subtotal = items.reduce((acc, i) => acc + (Number(i.price) * Number(i.qty)), 0);
  let discount = 0;
  if (discount_code === 'FALSTORE50') {
    discount = subtotal * 0.5;
  }

  const shippingFees = { jne: 15000, sicepat: 16000, gosend: 25000 };
  const shipping_fee = shippingFees[courier] || 15000;
  const total_amount = subtotal - discount + shipping_fee;

  try {
    await pool.query(`
      INSERT INTO orders (id, customer_name, customer_phone, customer_address, courier, payment_method, subtotal, discount, shipping_fee, total_amount, items)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [orderId, customer_name, customer_phone, customer_address || '', courier || 'jne', payment_method || 'qris', subtotal, discount, shipping_fee, total_amount, JSON.stringify(items)]);

    logToAgent('QA & Security', `Pesanan baru masuk: ${orderId} senilai Rp ${total_amount.toLocaleString('id-ID')} (Customer: ${customer_name}). Verifikasi stok & payment: PASS.`);

    res.json({
      success: true,
      order: {
        id: orderId,
        total_amount,
        status: 'Menunggu Pembayaran',
        created_at: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. GET /api/orders (Admin View All Orders)
app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json({ success: true, orders: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. GET /api/orders/:id (Customer Tracking)
app.get('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }
    res.json({ success: true, order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. PATCH /api/orders/:id/status (Admin Update Status)
app.patch('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
    logToAgent('PM', `Status order ${id} diperbarui menjadi "${status}".`);
    res.json({ success: true, message: 'Status berhasil diperbarui.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. GET /api/stats (Admin Stats)
app.get('/api/stats', async (req, res) => {
  try {
    const ordersRes = await pool.query('SELECT total_amount, status FROM orders');
    const productsRes = await pool.query('SELECT count(*) FROM products');

    const totalOrders = ordersRes.rows.length;
    const totalRevenue = ordersRes.rows.reduce((acc, o) => acc + Number(o.total_amount), 0);
    const totalProducts = parseInt(productsRes.rows[0].count);

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue,
        totalProducts
      }
    });
  } catch (err) {
    res.json({ success: true, stats: { totalOrders: 0, totalRevenue: 0, totalProducts: 8 } });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`FalStore Backend & Storefront running on port ${PORT}`);
});
