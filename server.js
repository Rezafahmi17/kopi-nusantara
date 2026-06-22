import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3001;
const DIST_DIR = path.join(__dirname, 'dist');

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kopi_nusantara',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
};

let pool;
const getPool = () => {
  if (!pool) pool = mysql.createPool(dbConfig);
  return pool;
};

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function sendJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function sendError(res, status, message, detail = undefined) {
  sendJSON(res, status, { ok: false, message, ...(detail ? { detail } : {}) });
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { resolve({}); }
    });
  });
}

const toBool = (value) => value === true || value === 1 || value === '1';

const mapMenuRow = (row) => ({
  id: Number(row.id),
  name: row.name,
  category: row.category,
  price: Number(row.price) || 0,
  description: row.description || '',
  icon: row.icon || '☕',
  available: toBool(row.available),
  recommended: toBool(row.recommended),
});

const mapExpenseRow = (row) => ({
  id: String(row.id),
  tanggal: row.tanggal instanceof Date ? row.tanggal.toISOString().slice(0, 10) : String(row.tanggal).slice(0, 10),
  kategori: row.kategori,
  deskripsi: row.deskripsi,
  jumlah: Number(row.jumlah) || 0,
});

const parseMaybeJSON = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); }
  catch { return fallback; }
};

async function getOrders() {
  const [orders] = await getPool().query(
    `SELECT id, short_id AS shortId, meja, nama, total, status, tanggal, pembayaran
     FROM orders
     ORDER BY tanggal DESC, created_at DESC`,
  );

  if (!orders.length) return [];

  const ids = orders.map(order => order.id);
  const [items] = await getPool().query(
    `SELECT id, order_id AS orderId, menu_id AS menuId, name, price, quantity, customization
     FROM order_items
     WHERE order_id IN (?)
     ORDER BY id ASC`,
    [ids],
  );

  const itemsByOrder = items.reduce((acc, item) => {
    if (!acc[item.orderId]) acc[item.orderId] = [];
    acc[item.orderId].push({
      id: item.menuId || item.id,
      menuId: item.menuId,
      name: item.name,
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      customization: parseMaybeJSON(item.customization, {}),
    });
    return acc;
  }, {});

  return orders.map(order => ({
    id: order.id,
    shortId: order.shortId,
    meja: order.meja,
    nama: order.nama,
    items: itemsByOrder[order.id] || [],
    total: Number(order.total) || 0,
    status: order.status,
    tanggal: order.tanggal instanceof Date ? order.tanggal.toISOString() : order.tanggal,
    pembayaran: order.pembayaran,
  }));
}

function normalizeOrder(orderData = {}) {
  const timestamp = Date.now();
  const items = Array.isArray(orderData.items) ? orderData.items : [];
  const total = items.reduce(
    (sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)),
    0,
  );

  return {
    id: orderData.id || `KN-ORD-${timestamp}-${Math.floor(Math.random() * 1000)}`,
    shortId: orderData.shortId || `KN-${String(timestamp).slice(-4)}${Math.floor(10 + Math.random() * 90)}`,
    meja: String(orderData.meja || '-'),
    nama: orderData.nama || 'Pelanggan Anonim',
    items: items.map(item => ({
      menuId: Number(item.id || item.menuId) || null,
      name: item.name || 'Menu',
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      customization: item.customization || {},
    })),
    total,
    status: orderData.status || 'Masuk',
    tanggal: orderData.tanggal ? new Date(orderData.tanggal) : new Date(),
    pembayaran: orderData.pembayaran || 'Pending',
  };
}

function normalizeMenuItem(item = {}) {
  return {
    name: String(item.name || '').trim(),
    category: item.category || 'Kopi Panas',
    price: Number(item.price) || 0,
    description: item.description || '',
    icon: item.icon || '☕',
    available: item.available === undefined ? true : toBool(item.available),
    recommended: item.recommended === undefined ? false : toBool(item.recommended),
  };
}

function normalizeExpense(expense = {}) {
  return {
    id: expense.id || `EXP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    tanggal: expense.tanggal || new Date().toISOString().slice(0, 10),
    kategori: expense.kategori || 'Lainnya',
    deskripsi: expense.deskripsi || 'Pengeluaran Tanpa Keterangan',
    jumlah: Number(expense.jumlah) || 0,
  };
}

async function handleApi(req, res, url) {
  if (url.pathname === '/api/health') {
    try {
      await getPool().query('SELECT 1');
      return sendJSON(res, 200, { ok: true, message: 'API aktif dan database MySQL terhubung.' });
    } catch (error) {
      return sendError(res, 500, 'API aktif, tetapi database MySQL belum terhubung.', error.message);
    }
  }

  if (url.pathname === '/api/menu' && req.method === 'GET') {
    const [rows] = await getPool().query('SELECT * FROM menus ORDER BY id ASC');
    return sendJSON(res, 200, rows.map(mapMenuRow));
  }

  if (url.pathname === '/api/menu' && req.method === 'POST') {
    const item = normalizeMenuItem(await readBody(req));
    if (!item.name || !item.price) return sendError(res, 400, 'Nama menu dan harga wajib diisi.');

    const [result] = await getPool().query(
      `INSERT INTO menus (name, category, price, description, icon, available, recommended)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [item.name, item.category, item.price, item.description, item.icon, item.available ? 1 : 0, item.recommended ? 1 : 0],
    );

    const [rows] = await getPool().query('SELECT * FROM menus WHERE id = ?', [result.insertId]);
    return sendJSON(res, 201, mapMenuRow(rows[0]));
  }

  const menuMatch = url.pathname.match(/^\/api\/menu\/(\d+)$/);
  if (menuMatch && req.method === 'PATCH') {
    const id = Number(menuMatch[1]);
    const body = await readBody(req);
    const item = normalizeMenuItem(body);

    const fields = [];
    const values = [];
    for (const key of ['name', 'category', 'price', 'description', 'icon']) {
      if (body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(item[key]);
      }
    }
    if (body.available !== undefined) {
      fields.push('available = ?');
      values.push(item.available ? 1 : 0);
    }
    if (body.recommended !== undefined) {
      fields.push('recommended = ?');
      values.push(item.recommended ? 1 : 0);
    }
    if (!fields.length) return sendError(res, 400, 'Tidak ada data menu yang diubah.');

    values.push(id);
    const [result] = await getPool().query(`UPDATE menus SET ${fields.join(', ')} WHERE id = ?`, values);
    if (!result.affectedRows) return sendError(res, 404, 'Menu tidak ditemukan.');

    const [rows] = await getPool().query('SELECT * FROM menus WHERE id = ?', [id]);
    return sendJSON(res, 200, mapMenuRow(rows[0]));
  }

  if (menuMatch && req.method === 'DELETE') {
    const [result] = await getPool().query('DELETE FROM menus WHERE id = ?', [Number(menuMatch[1])]);
    if (!result.affectedRows) return sendError(res, 404, 'Menu tidak ditemukan.');
    return sendJSON(res, 200, { ok: true });
  }

  if (url.pathname === '/api/orders' && req.method === 'GET') {
    return sendJSON(res, 200, await getOrders());
  }

  if (url.pathname === '/api/orders' && req.method === 'POST') {
    const order = normalizeOrder(await readBody(req));
    const conn = await getPool().getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(
        `INSERT INTO orders (id, short_id, meja, nama, total, status, tanggal, pembayaran)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [order.id, order.shortId, order.meja, order.nama, order.total, order.status, order.tanggal, order.pembayaran],
      );

      for (const item of order.items) {
        await conn.query(
          `INSERT INTO order_items (order_id, menu_id, name, price, quantity, customization)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [order.id, item.menuId, item.name, item.price, item.quantity, JSON.stringify(item.customization || {})],
        );
      }

      await conn.commit();
      return sendJSON(res, 201, { ...order, tanggal: order.tanggal.toISOString() });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  const orderMatch = url.pathname.match(/^\/api\/orders\/(.+)$/);
  if (orderMatch && req.method === 'PATCH') {
    const id = decodeURIComponent(orderMatch[1]);
    const body = await readBody(req);
    const fields = [];
    const values = [];

    if (body.status !== undefined && body.status !== null) {
      fields.push('status = ?');
      values.push(body.status);
    }
    if (body.pembayaran !== undefined && body.pembayaran !== null) {
      fields.push('pembayaran = ?');
      values.push(body.pembayaran);
    }
    if (!fields.length) return sendError(res, 400, 'Tidak ada data pesanan yang diubah.');

    values.push(id);
    const [result] = await getPool().query(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`, values);
    if (!result.affectedRows) return sendError(res, 404, 'Pesanan tidak ditemukan.');

    const orders = await getOrders();
    return sendJSON(res, 200, orders.find(order => order.id === id));
  }

  if (url.pathname === '/api/expenses' && req.method === 'GET') {
    const [rows] = await getPool().query('SELECT * FROM expenses ORDER BY tanggal DESC, created_at DESC');
    return sendJSON(res, 200, rows.map(mapExpenseRow));
  }

  if (url.pathname === '/api/expenses' && req.method === 'POST') {
    const expense = normalizeExpense(await readBody(req));
    await getPool().query(
      `INSERT INTO expenses (id, tanggal, kategori, deskripsi, jumlah)
       VALUES (?, ?, ?, ?, ?)`,
      [expense.id, expense.tanggal, expense.kategori, expense.deskripsi, expense.jumlah],
    );
    return sendJSON(res, 201, expense);
  }

  const expenseMatch = url.pathname.match(/^\/api\/expenses\/(.+)$/);
  if (expenseMatch && req.method === 'DELETE') {
    const id = decodeURIComponent(expenseMatch[1]);
    const [result] = await getPool().query('DELETE FROM expenses WHERE id = ?', [id]);
    if (!result.affectedRows) return sendError(res, 404, 'Pengeluaran tidak ditemukan.');
    return sendJSON(res, 200, { ok: true });
  }

  return sendError(res, 404, 'Endpoint API tidak ditemukan.');
}

function serveStatic(req, res) {
  const requestPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  let filePath = path.join(DIST_DIR, requestPath === '/' ? 'index.html' : requestPath);
  if (!filePath.startsWith(DIST_DIR)) filePath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) filePath = path.join(DIST_DIR, 'index.html');
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return sendJSON(res, 200, { ok: true });

  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (url.pathname.startsWith('/api/')) {
      return await handleApi(req, res, url);
    }

    return serveStatic(req, res);
  } catch (error) {
    console.error('[API ERROR]', error);
    return sendError(res, 500, 'Server error. Periksa koneksi MySQL dan struktur database.', error.message);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('=================================================');
  console.log(`Kopi Nusantara berjalan di http://localhost:${PORT}`);
  console.log(`Database MySQL: ${dbConfig.database} @ ${dbConfig.host}:${dbConfig.port}`);
  console.log('Untuk HP: sambungkan ke WiFi yang sama, lalu buka alamat IP laptop:3001');
  console.log('Contoh: http://192.168.1.5:3001');
  console.log('=================================================');
});
