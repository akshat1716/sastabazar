const express = require("express");
const Product = require("../models/Product");
const User = require("../models/User");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Wishlist = require("../models/Wishlist");
const Review = require("../models/Review");

const router = express.Router();

// Database viewer homepage
router.get("/", (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>sastabazar Database Viewer</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .nav { display: flex; gap: 10px; margin-bottom: 20px; }
        .nav a { padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        .nav a:hover { background: #0056b3; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-number { font-size: 2em; font-weight: bold; color: #007bff; margin-bottom: 10px; }
        .data-table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        .data-table th { background: #f8f9fa; font-weight: bold; }
        h3, h4 { color: #333; margin-bottom: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>sastabazar Database Viewer</h1>
          <p>Real-time database statistics and data browsing</p>
        </div>
        
        <div class="nav">
          <a href="/api/db/products">View Products</a>
          <a href="/api/db/users">View Users</a>
          <a href="/api/db/orders">View Orders</a>
          <a href="/api/db/carts">View Carts</a>
          <a href="/api/db/wishlists">View Wishlists</a>
          <a href="/api/db/reviews">View Reviews</a>
        </div>
        
        <div class="stats-grid" id="stats">
          <div class="stat-card">Loading...</div>
        </div>
        
        <div id="data">
          <div class="stat-card">Loading data...</div>
        </div>
      </div>
      
      <script>
        // Load overview data
        fetch('/api/db/stats')
          .then(response => response.json())
          .then(data => {
            const statsHtml = Object.entries(data).map(function([key, value]) {
              return '<div class="stat-card"><div class="stat-number">' + value + '</div><div>' + key + '</div></div>';
            }).join('');
            document.getElementById('stats').innerHTML = statsHtml;
          });
          
        // Load collection data
        fetch('/api/db/overview')
          .then(response => response.json())
          .then(data => {
            let html = '<h3>Recent Data</h3>';
            Object.entries(data).forEach(function([collection, items]) {
              if (items.length > 0) {
                html += '<h4>' + collection + '</h4>';
                html += '<table class="data-table">';
                html += '<tr>' + Object.keys(items[0]).map(function(key) {
                  return '<th>' + key + '</th>';
                }).join('') + '</tr>';
                items.slice(0, 5).forEach(function(item) {
                  html += '<tr>' + Object.values(item).map(function(value) {
                    return '<td>' + JSON.stringify(value) + '</td>';
                  }).join('') + '</tr>';
                });
                html += '</table>';
              }
            });
            document.getElementById('data').innerHTML = html;
          });
      </script>
    </body>
    </html>
  `;

  res.send(html);
});

// Get database statistics
router.get("/stats", async (req, res) => {
  try {
    const stats = {
      Products: await Product.countDocuments(),
      Users: await User.countDocuments(),
      Orders: await Order.countDocuments(),
      Carts: await Cart.countDocuments(),
      Wishlists: await Wishlist.countDocuments(),
      Reviews: await Review.countDocuments(),
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get overview of all collections
router.get("/overview", async (req, res) => {
  try {
    const overview = {
      Products: await Product.find().limit(5).lean(),
      Users: await User.find()
        .select("name email role createdAt")
        .limit(5)
        .lean(),
      Orders: await Order.find().limit(5).lean(),
      Carts: await Cart.find().limit(5).lean(),
      Wishlists: await Wishlist.find().limit(5).lean(),
      Reviews: await Review.find().limit(5).lean(),
    };
    res.json(overview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get products
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find().lean();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password").lean();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get orders
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find().lean();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get carts
router.get("/carts", async (req, res) => {
  try {
    const carts = await Cart.find().lean();
    res.json(carts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get wishlists
router.get("/wishlists", async (req, res) => {
  try {
    const wishlists = await Wishlist.find().lean();
    res.json(wishlists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reviews
router.get("/reviews", async (req, res) => {
  try {
    const reviews = await Review.find().lean();
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
