const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// PostgreSQL Connection Pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  database: process.env.DB_NAME || 'falstore_db',
  password: process.env.DB_PASSWORD || 'naufal_secure_db_pass_2026',
  port: process.env.DB_PORT || 5432,
});

// Initialize Database Schema
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(150),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        price NUMERIC(12, 2) NOT NULL,
        original_price NUMERIC(12, 2),
        image TEXT NOT NULL,
        badge VARCHAR(100),
        description TEXT,
        stock INT DEFAULT 50,
        rating NUMERIC(3, 2) DEFAULT 4.9,
        sold INT DEFAULT 120,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        customer_address TEXT NOT NULL,
        courier VARCHAR(50) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        total_amount NUMERIC(12, 2) NOT NULL,
        discount_code VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Menunggu Pembayaran',
        items JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('[DB] PostgreSQL Tables Initialized.');
  } catch (err) {
    console.error('[DB] Init error:', err);
  }
}
initDB();

// 1. WhatsApp Authentication / Direct Login API
app.post('/api/auth/wa-login', async (req, res) => {
  try {
    let { phone, name, address } = req.body;
    if (!phone) return res.status(400).json({ success: false, error: 'Nomor WhatsApp wajib diisi' });

    // Normalize Indonesian Phone Number (08xxx -> 628xxx)
    phone = phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.substring(1);
    if (!phone.startsWith('62')) phone = '62' + phone;

    if (!name) name = 'Member FalStore (' + phone.slice(-4) + ')';

    const userRes = await pool.query(
      `INSERT INTO users (phone, name, address)
       VALUES ($1, $2, $3)
       ON CONFLICT (phone) DO UPDATE 
       SET name = COALESCE(NULLIF(EXCLUDED.name, ''), users.name),
           address = COALESCE(NULLIF(EXCLUDED.address, ''), users.address)
       RETURNING *;`,
      [phone, name, address || '']
    );

    res.json({ success: true, user: userRes.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get User Orders by Phone
app.get('/api/orders/user/:phone', async (req, res) => {
  try {
    let phone = req.params.phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '62' + phone.substring(1);

    const result = await pool.query(
      `SELECT * FROM orders WHERE customer_phone LIKE $1 ORDER BY created_at DESC;`,
      [`%${phone.slice(-9)}%`]
    );
    res.json({ success: true, orders: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Products Endpoints
app.get('/api/products', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category && category !== 'all') {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json({ success: true, products: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, category, price, image, badge, desc, stock } = req.body;
    const id = 'PROD-' + Date.now().toString().slice(-6);
    const result = await pool.query(
      `INSERT INTO products (id, name, category, price, original_price, image, badge, description, stock)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [id, name, category, price, price * 1.2, image, badge || 'Pilihan', desc || '', stock || 50]
    );
    res.status(201).json({ success: true, product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Orders Endpoints
app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 50');
    res.json({ success: true, orders: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan' });
    res.json({ success: true, order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { customer_name, customer_phone, customer_address, courier, payment_method, items, discount_code } = req.body;
    const id = 'INV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

    const subtotal = items.reduce((acc, item) => acc + (Number(item.price) * item.qty), 0);
    const discount = (discount_code === 'FALSTORE50') ? subtotal * 0.5 : 0;
    const shipping = 15000;
    const total_amount = subtotal - discount + shipping;

    const result = await pool.query(
      `INSERT INTO orders (id, customer_name, customer_phone, customer_address, courier, payment_method, total_amount, discount_code, items)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [id, customer_name, customer_phone, customer_address, courier, payment_method, total_amount, discount_code, JSON.stringify(items)]
    );

    res.status(201).json({ success: true, order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Pesanan tidak ditemukan' });
    res.json({ success: true, order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Store Statistics
app.get('/api/stats', async (req, res) => {
  try {
    const revRes = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status != 'Dibatalkan'");
    const ordRes = await pool.query("SELECT COUNT(*) as count FROM orders");
    const prdRes = await pool.query("SELECT COUNT(*) as count FROM products");
    res.json({
      success: true,
      stats: {
        totalRevenue: Number(revRes.rows[0].total),
        totalOrders: Number(ordRes.rows[0].count),
        totalProducts: Number(prdRes.rows[0].count),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[FalStore] Server running at http://0.0.0.0:${PORT}`);
});
