/* ══════════════════════════════════════════════════════════════
   AYUR EFKT — Main Application JS
   ══════════════════════════════════════════════════════════════ */

let products = [];
let cart = JSON.parse(localStorage.getItem('ae_cart') || '[]');

const PRODUCT_IMG = { serum: '/images/face_serum.png', gel: '/images/face_gel.png', combo: null };

document.addEventListener('DOMContentLoaded', async () => {
  initFallingBackground();
  initNav();
  await loadProducts();
  renderProductsSection();
  initCart();
  handleRoute();
  window.addEventListener('popstate', handleRoute);
});

// ══════════════════════════════════════════════════════════════
//  ROUTING
// ══════════════════════════════════════════════════════════════
function navigate(page, data = {}) {
  history.pushState({ page, data }, '', `#${page}`);
  handleRoute({ state: { page, data } });
}

function handleRoute(e) {
  const hash  = location.hash.slice(1) || 'home';
  const parts = hash.split('/');
  const page  = parts[0];

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  window.scrollTo(0, 0);

  if (page === 'home') {
    showPage('home-page');
  } else if (page === 'shop') {
    showPage('shop-page');
    renderShopPage();
  } else if (page === 'product' && parts[1]) {
    showPage('product-page');
    renderProductDetail(parts[1]);
  } else if (page === 'checkout') {
    showPage('checkout-page');
    renderCheckout();
  } else if (page === 'confirm') {
    showPage('confirm-page');
  } else {
    showPage('home-page');
  }
}

function showPage(id) {
  document.getElementById(id).classList.add('active');
}

// ══════════════════════════════════════════════════════════════
//  NAV
// ══════════════════════════════════════════════════════════════
function initNav() {
  window.addEventListener('scroll', () => {
    document.querySelector('.nav').classList.toggle('scrolled', window.scrollY > 20);
  });
}

function toggleMobileMenu() {
  document.getElementById('mobile-menu').classList.toggle('open');
}
function closeMobileMenu() {
  document.getElementById('mobile-menu').classList.remove('open');
}

// ══════════════════════════════════════════════════════════════
//  PRODUCTS
// ══════════════════════════════════════════════════════════════
async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    products  = await res.json();
  } catch {
    products = [];
  }
}

function productCardHTML(p) {
  const imgSrc   = PRODUCT_IMG[p.type];

  // Visual area — different for combo vs single products
  let visualHTML;
  if (p.type === 'combo') {
    visualHTML = `
      <div class="combo-visual">
        <div class="product-badge">${p.badge}</div>
        <span class="combo-savings">SAVE ₹${(p.originalPrice - p.price).toLocaleString('en-IN')}</span>
        <img src="/images/face_serum.png" alt="Serum">
        <img src="/images/face_gel.png" alt="Gel">
      </div>`;
  } else {
    visualHTML = `
      <div class="product-card-visual">
        <div class="product-badge">${p.badge}</div>
        ${imgSrc
          ? `<img src="${imgSrc}" alt="${p.name}" style="height:220px;width:auto;object-fit:contain;filter:drop-shadow(0 8px 24px rgba(200,134,42,0.25));">`
          : ''}
      </div>`;
  }

  return `
  <div class="product-card" onclick="navigate('product/${p.slug}')">
    ${visualHTML}
    <div class="product-card-body">
      <div class="product-card-name">${p.name}</div>
      <div class="product-card-desc">${p.description}</div>
      <div class="product-card-footer">
        <div class="product-price">
          <span class="price-currency">₹</span>
          <span class="price-current">${p.price.toLocaleString('en-IN')}</span>
          <span class="price-original">₹${p.originalPrice.toLocaleString('en-IN')}</span>
        </div>
        <button class="btn-add-cart" onclick="event.stopPropagation(); addToCart('${p.id}', 1)">Add to Cart</button>
      </div>
    </div>
  </div>`;
}

function renderProductsSection() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  grid.innerHTML = products.map(productCardHTML).join('');
}

function renderShopPage() {
  const grid = document.getElementById('shop-grid');
  if (!grid) return;
  grid.innerHTML = products.map(productCardHTML).join('');
}

// ══════════════════════════════════════════════════════════════
//  PRODUCT DETAIL
// ══════════════════════════════════════════════════════════════
function renderProductDetail(slug) {
  const p = products.find(x => x.slug === slug || x.id === slug);
  if (!p) { navigate('shop'); return; }

  const imgSrc   = PRODUCT_IMG[p.type];
  const discount = Math.round((1 - p.price / p.originalPrice) * 100);

  // Visual for detail page
  let detailVisual;
  if (p.type === 'combo') {
    detailVisual = `
      <div style="display:flex;gap:2rem;align-items:center;justify-content:center;padding:2rem;height:100%;">
        <img src="/images/face_serum.png" alt="Serum" style="max-height:55vh;width:auto;object-fit:contain;filter:drop-shadow(0 20px 40px rgba(0,0,0,0.2));animation:float 4s ease-in-out infinite;">
        <img src="/images/face_gel.png" alt="Gel" style="max-height:55vh;width:auto;object-fit:contain;filter:drop-shadow(0 20px 40px rgba(0,0,0,0.2));animation:float 4s ease-in-out 0.5s infinite;">
      </div>`;
  } else {
    detailVisual = imgSrc
      ? `<img src="${imgSrc}" alt="${p.name}" style="max-height:70%;max-width:80%;object-fit:contain;filter:drop-shadow(0 20px 40px rgba(200,134,42,0.3));">`
      : '';
  }

  document.getElementById('product-page').innerHTML = `
  <div class="product-detail-page">
    <div class="product-detail-hero">
      <div class="product-detail-visual">
        ${detailVisual}
      </div>
      <div class="product-detail-info">
        <div class="breadcrumb">
          <span onclick="navigate('home')">Home</span> / <span onclick="navigate('shop')">Shop</span> / ${p.name}
        </div>
        <div class="detail-badge">${p.badge} · ${p.size}</div>
        <h1 class="detail-title">${p.name}</h1>
        ${p.type === 'combo' ? `
        <div style="background:linear-gradient(135deg,#2C3E2D,#3D5C3F);color:#faf6ee;border-radius:12px;padding:1rem 1.5rem;margin-bottom:1.5rem;display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:0.85rem;letter-spacing:0.1em;text-transform:uppercase;">You Save</span>
          <span style="font-family:var(--font-serif);font-size:1.8rem;font-weight:500;color:#E4A84B;">₹${(p.originalPrice - p.price).toLocaleString('en-IN')}</span>
        </div>` : ''}
        <p class="detail-description">${p.longDescription}</p>
        <div class="detail-price-row">
          <span class="detail-price-current">₹${p.price.toLocaleString('en-IN')}</span>
          <span class="detail-price-original">₹${p.originalPrice.toLocaleString('en-IN')}</span>
          <span class="detail-discount">${discount}% OFF</span>
        </div>
        <div class="qty-row">
          <span class="qty-label">Quantity</span>
          <div class="qty-control">
            <button class="qty-btn" onclick="changeQty(-1)">−</button>
            <span class="qty-num" id="detail-qty">1</span>
            <button class="qty-btn" onclick="changeQty(1)">+</button>
          </div>
        </div>
        <div class="detail-actions">
          <button class="btn-add-large" onclick="addToCart('${p.id}', getDetailQty())">Add to Cart</button>
          <button class="btn-buy-now" onclick="buyNow('${p.id}', getDetailQty())">Buy Now</button>
        </div>
        <div class="detail-tabs">
          <button class="tab-btn active" onclick="switchTab(this,'tab-ingredients')">Ingredients</button>
          <button class="tab-btn" onclick="switchTab(this,'tab-benefits')">Benefits</button>
          <button class="tab-btn" onclick="switchTab(this,'tab-usage')">How to Use</button>
          <button class="tab-btn" onclick="switchTab(this,'tab-reviews'); loadReviews('${p.id}')">Reviews</button>
        </div>
        <div id="tab-ingredients" class="tab-content active">
          <div class="ingredients-list">
            ${p.ingredients.map(i => `<span class="ingredient-tag">${i}</span>`).join('')}
          </div>
        </div>
        <div id="tab-benefits" class="tab-content">
          <ul class="benefits-list">
            ${p.benefits.map(b => `<li>${b}</li>`).join('')}
          </ul>
        </div>
        <div id="tab-usage" class="tab-content">
          <div class="how-to-use-text">${p.howToUse}</div>
        </div>
        <div id="tab-reviews" class="tab-content">
          <div id="reviews-list" style="margin-top:1rem;">Loading reviews...</div>
          <div style="margin-top:2rem;padding-top:1.5rem;border-top:1px solid var(--cream-dark);">
            <h4 style="font-family:var(--font-serif);font-size:1.1rem;color:var(--forest);margin-bottom:1rem;">Leave a Review</h4>
            <div style="display:flex;flex-direction:column;gap:0.8rem;">
              <input class="form-input" id="review-name" placeholder="Your name" />
              <select class="form-input" id="review-rating">
                <option value="5">★★★★★ — Excellent</option>
                <option value="4">★★★★☆ — Good</option>
                <option value="3">★★★☆☆ — Average</option>
                <option value="2">★★☆☆☆ — Poor</option>
                <option value="1">★☆☆☆☆ — Terrible</option>
              </select>
              <textarea class="form-input" id="review-comment" rows="3" placeholder="Share your experience..." style="resize:vertical;"></textarea>
              <button class="btn-add-large" style="max-width:200px;" onclick="submitReview('${p.id}')">Submit Review</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function changeQty(delta) {
  const el = document.getElementById('detail-qty');
  if (!el) return;
  let v = parseInt(el.textContent) + delta;
  if (v < 1) v = 1;
  if (v > 10) v = 10;
  el.textContent = v;
}
function getDetailQty() {
  const el = document.getElementById('detail-qty');
  return el ? parseInt(el.textContent) : 1;
}
function switchTab(btn, tabId) {
  btn.closest('.product-detail-info').querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.closest('.product-detail-info').querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(tabId).classList.add('active');
}

// ══════════════════════════════════════════════════════════════
//  REVIEWS
// ══════════════════════════════════════════════════════════════
async function loadReviews(productId) {
  const el = document.getElementById('reviews-list');
  if (!el) return;
  try {
    const res     = await fetch(`/api/reviews/${productId}`);
    const reviews = await res.json();
    if (reviews.length === 0) {
      el.innerHTML = `<p style="color:var(--text-light);font-size:0.9rem;">No reviews yet — be the first!</p>`;
    } else {
      el.innerHTML = reviews.map(r => `
        <div style="padding:1rem 0;border-bottom:1px solid var(--cream-dark);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;">
            <span style="font-family:var(--font-serif);font-size:1rem;font-weight:500;color:var(--forest);">${r.name}</span>
            <span style="color:var(--amber);font-size:0.85rem;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
          </div>
          <p style="font-size:0.88rem;color:var(--text-mid);line-height:1.6;margin:0 0 0.4rem;">${r.comment}</p>
          <span style="font-size:0.72rem;color:var(--text-light);">${new Date(r.createdAt).toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'})}</span>
        </div>`).join('');
    }
  } catch {
    el.innerHTML = `<p style="color:var(--text-light);">Could not load reviews.</p>`;
  }
}

async function submitReview(productId) {
  const name    = document.getElementById('review-name')?.value?.trim();
  const rating  = document.getElementById('review-rating')?.value;
  const comment = document.getElementById('review-comment')?.value?.trim();

  if (!name || !comment) { showToast('Please fill in your name and review'); return; }

  try {
    const res  = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, name, rating, comment })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    document.getElementById('review-name').value    = '';
    document.getElementById('review-comment').value = '';
    showToast('Review submitted!');
    loadReviews(productId);
  } catch {
    showToast('Could not submit review. Try again.');
  }
}

// ══════════════════════════════════════════════════════════════
//  CART
// ══════════════════════════════════════════════════════════════
function initCart() {
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('ae_cart', JSON.stringify(cart));
}

function addToCart(productId, qty = 1) {
  const p = products.find(x => x.id === productId);
  if (!p) return;
  const existing = cart.find(i => i.id === productId);
  if (existing) {
    existing.qty = Math.min(existing.qty + qty, 10);
  } else {
    cart.push({
      id:    p.id,
      name:  p.name,
      price: p.price,
      size:  p.size,
      img:   p.type === 'combo' ? '/images/face_serum.png' : (PRODUCT_IMG[p.type] || null),
      qty
    });
  }
  saveCart();
  updateCartUI();
  showToast(`${p.name} added to cart`);
}

function buyNow(productId, qty = 1) {
  addToCart(productId, qty);
  navigate('checkout');
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCart();
  updateCartUI();
}

function changeCartQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(productId);
  else { saveCart(); updateCartUI(); }
}

function cartTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function updateCartUI() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  const badge = document.getElementById('cart-badge');
  if (badge) { badge.textContent = total; badge.classList.toggle('show', total > 0); }

  const itemsEl = document.getElementById('cart-items');
  if (!itemsEl) return;

  if (cart.length === 0) {
    itemsEl.innerHTML = `
      <div class="cart-empty">
        <div style="margin-bottom:1rem;">
          <img src="/images/logo.png" style="height:60px;opacity:0.3;">
        </div>
        <p>Your cart is empty</p>
      </div>`;
  } else {
    itemsEl.innerHTML = cart.map(i => `
    <div class="cart-item">
      <div class="cart-item-visual">
        ${i.img
          ? `<img src="${i.img}" alt="${i.name}" style="width:100%;height:100%;object-fit:contain;">`
          : `<div style="width:100%;height:100%;background:var(--amber-pale);border-radius:8px;"></div>`}
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${i.name}</div>
        <div class="cart-item-size">${i.size}</div>
        <div class="cart-item-price-row">
          <span class="cart-item-price">₹${(i.price * i.qty).toLocaleString('en-IN')}</span>
          <div class="cart-item-qty">
            <button class="cart-qty-btn" onclick="changeCartQty('${i.id}',-1)">−</button>
            <span>${i.qty}</span>
            <button class="cart-qty-btn" onclick="changeCartQty('${i.id}',1)">+</button>
          </div>
        </div>
        <div class="cart-item-remove" onclick="removeFromCart('${i.id}')">Remove</div>
      </div>
    </div>`).join('');
  }

  const subtotal = cartTotal();
  const shipping = subtotal >= 499 ? 0 : 60;
  const grand    = subtotal + shipping;
  document.getElementById('cart-subtotal').textContent  = `₹${subtotal.toLocaleString('en-IN')}`;
  document.getElementById('cart-shipping').textContent  = shipping === 0 ? 'FREE' : `₹${shipping}`;
  document.getElementById('cart-grand').textContent     = `₹${grand.toLocaleString('en-IN')}`;
  document.getElementById('free-ship-note').textContent =
    subtotal >= 499 ? 'You qualify for free shipping!' : `Add ₹${(499 - subtotal)} more for free shipping`;
}

function openCart() {
  document.getElementById('cart-overlay').classList.add('open');
  document.getElementById('cart-drawer').classList.add('open');
  updateCartUI();
}
function closeCart() {
  document.getElementById('cart-overlay').classList.remove('open');
  document.getElementById('cart-drawer').classList.remove('open');
}

// ══════════════════════════════════════════════════════════════
//  CHECKOUT
// ══════════════════════════════════════════════════════════════
function renderCheckout() {
  const summaryEl = document.getElementById('checkout-summary');
  if (!summaryEl) return;
  const subtotal = cartTotal();
  const shipping = subtotal >= 499 ? 0 : 60;
  const grand    = subtotal + shipping;

  summaryEl.innerHTML = `
    ${cart.map(i => `
    <div class="summary-item">
      <span class="summary-item-name">${i.name}</span>
      <span class="summary-item-qty">×${i.qty}</span>
      <span class="summary-item-price">₹${(i.price * i.qty).toLocaleString('en-IN')}</span>
    </div>`).join('')}
    <div class="summary-row"><span>Subtotal</span><span>₹${subtotal.toLocaleString('en-IN')}</span></div>
    <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? 'FREE' : '₹' + shipping}</span></div>
    <div class="summary-total">
      <span class="summary-total-label">Total</span>
      <span class="summary-total-price">₹${grand.toLocaleString('en-IN')}</span>
    </div>`;
  window._checkoutGrand = grand;
}

async function placeOrder() {
  const get      = id => document.getElementById(id)?.value?.trim();
  const customer = { firstName: get('fname'), lastName: get('lname'), email: get('email'), phone: get('phone') };
  const address  = { line1: get('address'), city: get('city'), state: get('state'), pincode: get('pincode') };
  const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value || 'COD';

  if (!customer.firstName || !customer.email || !customer.phone || !address.line1 || !address.city || !address.pincode) {
    showToast('Please fill all required fields'); return;
  }
  if (cart.length === 0) { showToast('Your cart is empty'); return; }

  const btn      = document.getElementById('place-order-btn');
  btn.textContent = 'Placing Order…';
  btn.disabled    = true;

  try {
    const res  = await fetch('/api/orders', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ customer, address, items: cart, total: window._checkoutGrand, paymentMethod, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to place order');

    cart = [];
    saveCart();
    updateCartUI();
    renderOrderConfirmation(data.order);
    navigate('confirm');
  } catch (err) {
    showToast(err.message || 'Something went wrong. Please try again.');
  } finally {
    btn.textContent = 'Place Order';
    btn.disabled    = false;
  }
}

function renderOrderConfirmation(order) {
  const el = document.getElementById('confirm-content');
  if (!el) return;
  el.innerHTML = `
    <div class="confirm-icon">
      <img src="/images/logo.png" alt="Ayur Efkt" style="height:80px;width:auto;object-fit:contain;">
    </div>
    <h2 class="confirm-title">Order Confirmed!</h2>
    <p class="confirm-subtitle">
      Thank you, <strong>${order.customer.firstName}</strong>!<br>
      Your Ayurvedic treasures are on their way to you.
    </p>
    <div class="confirm-order-id">${order.id}</div>
    <div class="confirm-details">
      <div class="confirm-detail-row">
        <span class="confirm-detail-label">Email</span>
        <span class="confirm-detail-value">${order.customer.email}</span>
      </div>
      <div class="confirm-detail-row">
        <span class="confirm-detail-label">Payment</span>
        <span class="confirm-detail-value">${order.paymentMethod}</span>
      </div>
      <div class="confirm-detail-row">
        <span class="confirm-detail-label">Total Paid</span>
        <span class="confirm-detail-value">₹${order.total.toLocaleString('en-IN')}</span>
      </div>
      <div class="confirm-detail-row">
        <span class="confirm-detail-label">Estimated Delivery</span>
        <span class="confirm-detail-value">5–7 business days</span>
      </div>
    </div>
    <button class="btn-primary" onclick="navigate('shop')" style="display:inline-block;margin-top:0.5rem">Continue Shopping</button>`;
}

// ══════════════════════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════════════════════
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}