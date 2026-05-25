# 🌿 Ayur Efkt — E-Commerce Website

A full-stack e-commerce website for **Ayur Efkt**, an Ayurvedic skincare brand.

<p align="center">
  <a href="https://ayur-efkt.onrender.com/" target="_blank">
    <img src="https://img.shields.io/badge/LIVE%20DEMO-Click%20Here-brightgreen?style=for-the-badge" alt="Live Demo"/>
  </a>
</p>

## Tech Stack
- **Frontend**: Vanilla HTML, CSS, JavaScript (canvas animations)
- **Backend**: Node.js + Express
- **Data Store**: JSON files (no database required)



## Project Structure
```
ayurefkt/
├── server.js            ← Express backend
├── package.json
├── data/
│   ├── products.json    ← Product catalog
│   └── orders.json      ← Saved orders
└── public/
    ├── index.html       ← Single-page app
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

## Setup & Run

### 1. Install dependencies
```bash
npm install
```

### 2. Start the server
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

### 3. Open in browser
Visit: **http://localhost:3000**

## Features
- 🎨 Animated botanical canvas hero background
- 🛍️ Sliding cart drawer with quantity controls
- 📦 Product detail pages with ingredient tabs
- 💳 Checkout with COD / UPI / Card selection
- ✅ Order confirmation with order ID
- 📱 Fully responsive for mobile
- 💾 Cart persists via localStorage

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| GET | `/api/products/:slug` | Get single product |
| POST | `/api/orders` | Place an order |
| GET | `/api/orders/:id` | Get order by ID |

## Adding New Products
Edit `data/products.json` and follow the existing format.
Orders are saved to `data/orders.json` automatically.
