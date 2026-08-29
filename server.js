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
        provider VARCHAR(50) DEFAULT 'whatsapp',
        provider_id VARCHAR(100),
        name VARCHAR(150),
        phone VARCHAR(50),
        email VARCHAR(150),
        avatar TEXT,
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

// 1. Social OAuth Login API (Google, WhatsApp, Telegram — Zero Manual Input)
app.post('/api/auth/social-login', async (req, res) => {
  try {
    const { provider, name, email, phone, avatar, provider_id } = req.body;
    if (!provider) return res.status(400).json({ success: false, error: 'Provider wajib dipilih' });

    let userRes;
    const finalPhone = phone ? phone.replace(/\D/g, '') : '';
    const finalEmail = email || '';
    const finalName = name || (provider === 'google' ? 'Google User' : provider === 'telegram' ? 'Telegram User' : 'WhatsApp User');
    const finalAvatar = avatar || '';

    // Check if user already exists by provider_id, phone, or email
    const existing = await pool.query(
      `SELECT * FROM users WHERE (provider = $1 AND provider_id = $2) OR (phone = $3 AND $3 != '') OR (email = $4 AND $4 != '') LIMIT 1;`,
      [provider, provider_id || finalEmail || finalPhone, finalPhone, finalEmail]
    );

    if (existing.rows.length > 0) {
      userRes = await pool.query(
        `UPDATE users SET name = COALESCE($1, name), avatar = COALESCE($2, avatar), address = COALESCE(address, 'Jl. Jenderal Sudirman No. 45, Palembang') WHERE id = $3 RETURNING *;`,
        [finalName, finalAvatar, existing.rows[0].id]
      );
    } else {
      userRes = await pool.query(
        `INSERT INTO users (provider, provider_id, name, phone, email, avatar, address)
         VALUES ($1, $2, $3, $4, $5, $6, 'Jl. Jenderal Sudirman No. 45, Palembang')
         RETURNING *;`,
        [provider, provider_id || finalEmail || finalPhone || ('ID-' + Date.now()), finalName, finalPhone || '6281234567890', finalEmail || 'member@naufal.me', finalAvatar]
      );
    }

    res.json({ success: true, user: userRes.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get User Orders
app.get('/api/orders/user/:identifier', async (req, res) => {
  try {
    let idf = req.params.identifier.replace(/\D/g, '');
    if (idf.startsWith('0')) idf = '62' + idf.substring(1);

    const result = await pool.query(
      `SELECT * FROM orders WHERE customer_phone LIKE $1 OR customer_name ILIKE $2 ORDER BY created_at DESC;`,
      [`%${idf.slice(-8)}%`, `%${req.params.identifier}%`]
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
