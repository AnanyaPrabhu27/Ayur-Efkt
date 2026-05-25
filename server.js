const express    = require('express');
const cors       = require('cors');
const mongoose   = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const fs         = require('fs');
const path       = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── MongoDB ───────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ── Schemas ───────────────────────────────────────────────────
const orderSchema = new mongoose.Schema({
  id:            { type: String, required: true, unique: true },
  uuid:          String,
  customer:      Object,
  address:       Object,
  items:         Array,
  total:         Number,
  paymentMethod: String,
  status:        { type: String, default: 'confirmed' },
  createdAt:     { type: Date, default: Date.now }
});

const reviewSchema = new mongoose.Schema({
  id:        { type: String, default: () => uuidv4() },
  productId: String,
  name:      String,
  rating:    Number,
  comment:   String,
  createdAt: { type: Date, default: Date.now }
});

const Order  = mongoose.model('Order',  orderSchema);
const Review = mongoose.model('Review', reviewSchema);

// ── Products (from JSON) ──────────────────────────────────────
const dataPath = (file) => path.join(__dirname, 'data', file);
const readJSON  = (file) => JSON.parse(fs.readFileSync(dataPath(file), 'utf8'));

// ── Email ─────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SHOP_EMAIL,
    pass: process.env.SHOP_APP_PASSWORD,
  }
});

async function sendOrderEmails(order) {
  const itemsHTML = order.items.map(i => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0e8d6;color:#2c3e2d;">${i.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0e8d6;text-align:center;">×${i.qty}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0e8d6;text-align:right;font-weight:600;">₹${(i.price * i.qty).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const customerMail = {
    from: `"${process.env.SHOP_NAME}" <${process.env.SHOP_EMAIL}>`,
    to: order.customer.email,
    subject: `Order Confirmed — ${order.id} | Ayur Efkt`,
    html: `
    <div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;background:#faf6ee;padding:40px;border-radius:16px;">
      <div style="text-align:center;margin-bottom:32px;">
        <h1 style="font-size:2rem;color:#2c3e2d;font-weight:400;margin:0;">Ayur Efkt</h1>
        <p style="color:#8a8a7a;font-size:0.75rem;letter-spacing:0.25em;text-transform:uppercase;margin:6px 0 0;">Skin Care</p>
      </div>
      <div style="background:#2c3e2d;color:#faf6ee;padding:28px;border-radius:12px;text-align:center;margin-bottom:28px;">
        <p style="margin:0;font-size:0.75rem;letter-spacing:0.2em;text-transform:uppercase;opacity:0.65;">Order Confirmed</p>
        <h2 style="margin:10px 0 0;font-size:1.6rem;font-weight:400;">${order.id}</h2>
      </div>
      <p style="color:#4a4a44;line-height:1.8;font-size:0.95rem;">
        Dear <strong>${order.customer.firstName}</strong>,<br><br>
        Thank you for your order! Your Ayurvedic treasures are being carefully prepared and will be on their way soon.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:24px 0;">
        <thead>
          <tr style="border-bottom:2px solid #2c3e2d;">
            <th style="text-align:left;padding:10px 0;font-size:0.75rem;letter-spacing:0.12em;text-transform:uppercase;color:#2c3e2d;">Product</th>
            <th style="text-align:center;padding:10px 0;font-size:0.75rem;letter-spacing:0.12em;text-transform:uppercase;color:#2c3e2d;">Qty</th>
            <th style="text-align:right;padding:10px 0;font-size:0.75rem;letter-spacing:0.12em;text-transform:uppercase;color:#2c3e2d;">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHTML}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:14px 0 0;font-weight:700;text-transform:uppercase;font-size:0.85rem;color:#2c3e2d;">Total</td>
            <td style="padding:14px 0 0;text-align:right;font-size:1.3rem;font-weight:700;color:#2c3e2d;">₹${order.total.toLocaleString('en-IN')}</td>
          </tr>
        </tfoot>
      </table>
      <div style="background:#f0e8d6;border-radius:12px;padding:20px;margin:24px 0;">
        <p style="margin:0 0 10px;font-size:0.72rem;letter-spacing:0.18em;text-transform:uppercase;color:#8a8a7a;">Shipping To</p>
        <p style="margin:0;color:#2c3e2d;line-height:1.8;font-size:0.92rem;">
          ${order.customer.firstName} ${order.customer.lastName}<br>
          ${order.address.line1}<br>
          ${order.address.city}, ${order.address.state} — ${order.address.pincode}<br>
          📞 ${order.customer.phone}
        </p>
      </div>
      <div style="background:#f5e6c8;border-radius:12px;padding:16px;text-align:center;margin:24px 0;">
        <p style="margin:0;color:#2c3e2d;font-size:0.88rem;">
          <strong>Payment:</strong> ${order.paymentMethod} &nbsp;|&nbsp;
          <strong>Delivery:</strong> 5–7 business days
        </p>
      </div>
      <p style="color:#8a8a7a;font-size:0.8rem;text-align:center;margin-top:32px;line-height:1.8;">
        Questions? Reach us on <a href="https://www.instagram.com/ayur_efkt/" style="color:#c8862a;">@ayur_efkt</a><br>
        Made with love in India 🌿
      </p>
    </div>`
  };

  const ownerHTML = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:12px;">
      <h2 style="color:#2c3e2d;margin-top:0;">🛍️ New Order — ${order.id}</h2>
      <p style="color:#666;font-size:0.85rem;">${new Date(order.createdAt).toLocaleString('en-IN')}</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;background:white;border-radius:8px;overflow:hidden;">
        <tr style="background:#2c3e2d;color:white;">
          <th style="padding:10px 16px;text-align:left;">Product</th>
          <th style="padding:10px 16px;text-align:center;">Qty</th>
          <th style="padding:10px 16px;text-align:right;">Price</th>
        </tr>
        ${order.items.map(i => `
        <tr>
          <td style="padding:10px 16px;border-bottom:1px solid #eee;">${i.name}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #eee;text-align:center;">${i.qty}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #eee;text-align:right;">₹${(i.price * i.qty).toLocaleString('en-IN')}</td>
        </tr>`).join('')}
        <tr style="background:#f5e6c8;">
          <td colspan="2" style="padding:12px 16px;font-weight:700;">Total</td>
          <td style="padding:12px 16px;text-align:right;font-weight:700;font-size:1.1rem;">₹${order.total.toLocaleString('en-IN')}</td>
        </tr>
      </table>
      <div style="background:white;border-radius:8px;padding:16px;margin:16px 0;">
        <h3 style="margin:0 0 10px;color:#2c3e2d;font-size:0.9rem;text-transform:uppercase;">Customer</h3>
        <p style="margin:0;line-height:1.8;color:#333;">
          <strong>${order.customer.firstName} ${order.customer.lastName}</strong><br>
          Email: ${order.customer.email}<br>
          Phone: ${order.customer.phone}
        </p>
      </div>
      <div style="background:white;border-radius:8px;padding:16px;margin:16px 0;">
        <h3 style="margin:0 0 10px;color:#2c3e2d;font-size:0.9rem;text-transform:uppercase;">Ship To</h3>
        <p style="margin:0;line-height:1.8;color:#333;">
          ${order.address.line1}<br>
          ${order.address.city}, ${order.address.state} — ${order.address.pincode}
        </p>
      </div>
      <div style="background:#2c3e2d;color:white;border-radius:8px;padding:16px;text-align:center;">
        <p style="margin:0;">Payment: <strong>${order.paymentMethod}</strong></p>
      </div>
    </div>`;

  await transporter.sendMail(customerMail);

  const notifyList = (process.env.NOTIFY_EMAILS || process.env.SHOP_EMAIL).split(',');
  for (const email of notifyList) {
    await transporter.sendMail({
      from: `"${process.env.SHOP_NAME}" <${process.env.SHOP_EMAIL}>`,
      to: email.trim(),
      subject: `🛍️ New Order ${order.id} — ₹${order.total.toLocaleString('en-IN')}`,
      html: ownerHTML
    });
  }
}

// ── Products API ──────────────────────────────────────────────
app.get('/api/products', (req, res) => {
  res.json(readJSON('products.json'));
});

app.get('/api/products/:slug', (req, res) => {
  const products = readJSON('products.json');
  const product  = products.find(p => p.slug === req.params.slug || p.id === req.params.slug);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// ── Orders API ────────────────────────────────────────────────
app.post('/api/orders', async (req, res) => {
  try {
    const { customer, items, total, paymentMethod, address } = req.body;
    if (!customer || !items || !total) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const order = new Order({
      id: 'AE-' + Date.now().toString().slice(-6),
      uuid: uuidv4(),
      customer,
      address,
      items,
      total,
      paymentMethod,
      status: 'confirmed',
      createdAt: new Date()
    });

    await order.save();
    sendOrderEmails(order).catch(err => console.error('Email error:', err));
    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findOne({
      $or: [{ id: req.params.id }, { uuid: req.params.id }]
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// ── Reviews API ───────────────────────────────────────────────
app.get('/api/reviews/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const { productId, name, rating, comment } = req.body;
    if (!productId || !name || !rating || !comment) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const review = new Review({
      productId,
      name,
      rating: Math.min(5, Math.max(1, parseInt(rating))),
      comment
    });
    await review.save();
    res.status(201).json({ success: true, review });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save review' });
  }
});

// ── Serve SPA ─────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🌿 Ayur Efkt running at http://localhost:${PORT}\n`);
});