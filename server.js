const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Helpers ─────────────────────────────────────────────────────────────────
const dataPath = (file) => path.join(__dirname, 'data', file);
const readJSON  = (file) => JSON.parse(fs.readFileSync(dataPath(file), 'utf8'));
const writeJSON = (file, data) => fs.writeFileSync(dataPath(file), JSON.stringify(data, null, 2));

// ── Products API ─────────────────────────────────────────────────────────────
app.get('/api/products', (req, res) => {
  res.json(readJSON('products.json'));
});

app.get('/api/products/:slug', (req, res) => {
  const products = readJSON('products.json');
  const product = products.find(p => p.slug === req.params.slug || p.id === req.params.slug);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// ── Orders API ────────────────────────────────────────────────────────────────
app.post('/api/orders', (req, res) => {
  const { customer, items, total, paymentMethod, address } = req.body;

  if (!customer || !items || !total) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check stock
  const products = readJSON('products.json');
  for (const item of items) {
    const product = products.find(p => p.id === item.id);
    if (!product) return res.status(400).json({ error: `Product ${item.id} not found` });
    if (product.stock < item.quantity) {
      return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
    }
  }

  // Deduct stock
  for (const item of items) {
    const product = products.find(p => p.id === item.id);
    product.stock -= item.quantity;
  }
  writeJSON('products.json', products);

  // Save order
  const orders = readJSON('orders.json');
  const order = {
    id: 'AE-' + Date.now().toString().slice(-6),
    uuid: uuidv4(),
    customer,
    address,
    items,
    total,
    paymentMethod,
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };
  orders.push(order);
  writeJSON('orders.json', orders);

  res.status(201).json({ success: true, order });
});

app.get('/api/orders/:id', (req, res) => {
  const orders = readJSON('orders.json');
  const order = orders.find(o => o.id === req.params.id || o.uuid === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// ── Catch-all: serve SPA ─────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🌿 Ayur Efkt server running at http://localhost:${PORT}\n`);
});
