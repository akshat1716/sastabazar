# 🚀 How to Connect sastabazar to Shopify

## 📋 Overview

This guide shows you **4 different ways** to connect your sastabazar website to Shopify:

1. **🎯 RECOMMENDED: Shopify as Backend + Custom Frontend**
2. **🔧 Shopify API Integration**
3. **📡 Webhook Integration**
4. **🔄 Full Migration to Shopify**

---

## 🎯 Option 1: Shopify as Backend + Custom Frontend (RECOMMENDED)

### ✅ Benefits:

- **Keep your sastabazar design**
- **Use Shopify for product management**
- **Automatic inventory sync**
- **Built-in payment processing**
- **Order management**

### 📋 Setup Steps:

#### Step 1: Create Shopify Store

1. Go to [shopify.com](https://shopify.com)
2. Click **"Start free trial"**
3. Enter your email and create password
4. Choose store name: `sastabazar-store`
5. Complete the setup wizard

#### Step 2: Get Shopify API Credentials

1. In Shopify Admin, go to **Settings** → **Apps and sales channels**
2. Click **"Develop apps"**
3. Click **"Create an app"**
4. Name it: `sastabazar-integration`
5. Configure Admin API access:
   - **Products**: Read access
   - **Orders**: Read/Write access
   - **Customers**: Read access
   - **Inventory**: Read access
6. Click **"Save"**
7. Click **"Install app"**
8. Copy your **Admin API access token**

#### Step 3: Configure Your sastabazar Website

1. Add Shopify credentials to your `.env` file:

```env
# Shopify Configuration
SHOPIFY_SHOP_NAME=sastabazar-store
SHOPIFY_API_KEY=your-api-key
SHOPIFY_API_SECRET=your-api-secret
SHOPIFY_ACCESS_TOKEN=your-access-token
SHOPIFY_WEBHOOK_SECRET=your-webhook-secret
```

2. Install required packages:

```bash
npm install @shopify/shopify-api axios
```

#### Step 4: Run Integration Script

```bash
# Sync products from Shopify to your database
node scripts/shopify-integration.js sync-products

# Sync orders from Shopify
node scripts/shopify-integration.js sync-orders
```

---

## 🔧 Option 2: Shopify API Integration

### ✅ Benefits:

- **Real-time data sync**
- **Custom product management**
- **Order processing**
- **Customer management**

### 📋 Implementation:

I'll create a complete integration script for you:

```javascript
// scripts/shopify-api-integration.js
const axios = require("axios");
const mongoose = require("mongoose");

class ShopifyAPI {
  constructor() {
    this.shopName = process.env.SHOPIFY_SHOP_NAME;
    this.accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    this.baseURL = `https://${this.shopName}.myshopify.com/admin/api/2023-10`;
    this.headers = {
      "X-Shopify-Access-Token": this.accessToken,
      "Content-Type": "application/json",
    };
  }

  // Get all products from Shopify
  async getProducts() {
    try {
      const response = await axios.get(`${this.baseURL}/products.json`, {
        headers: this.headers,
      });
      return response.data.products;
    } catch (error) {
      console.error("Error fetching products:", error.message);
      throw error;
    }
  }

  // Create product in Shopify
  async createProduct(productData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/products.json`,
        {
          product: productData,
        },
        {
          headers: this.headers,
        },
      );
      return response.data.product;
    } catch (error) {
      console.error("Error creating product:", error.message);
      throw error;
    }
  }

  // Update product in Shopify
  async updateProduct(productId, productData) {
    try {
      const response = await axios.put(
        `${this.baseURL}/products/${productId}.json`,
        {
          product: productData,
        },
        {
          headers: this.headers,
        },
      );
      return response.data.product;
    } catch (error) {
      console.error("Error updating product:", error.message);
      throw error;
    }
  }

  // Get orders from Shopify
  async getOrders() {
    try {
      const response = await axios.get(`${this.baseURL}/orders.json`, {
        headers: this.headers,
      });
      return response.data.orders;
    } catch (error) {
      console.error("Error fetching orders:", error.message);
      throw error;
    }
  }

  // Create order in Shopify
  async createOrder(orderData) {
    try {
      const response = await axios.post(
        `${this.baseURL}/orders.json`,
        {
          order: orderData,
        },
        {
          headers: this.headers,
        },
      );
      return response.data.order;
    } catch (error) {
      console.error("Error creating order:", error.message);
      throw error;
    }
  }
}

module.exports = ShopifyAPI;
```

---

## 📡 Option 3: Webhook Integration

### ✅ Benefits:

- **Real-time updates**
- **Automatic sync**
- **Event-driven architecture**

### 📋 Setup Steps:

#### Step 1: Create Webhook Endpoints

Add to your `server/index.js`:

```javascript
// Webhook endpoints for Shopify
app.post("/webhooks/shopify/products/create", (req, res) => {
  console.log("New product created in Shopify:", req.body);
  // Sync product to your database
  syncProductToDatabase(req.body);
  res.status(200).send("OK");
});

app.post("/webhooks/shopify/products/update", (req, res) => {
  console.log("Product updated in Shopify:", req.body);
  // Update product in your database
  updateProductInDatabase(req.body);
  res.status(200).send("OK");
});

app.post("/webhooks/shopify/orders/create", (req, res) => {
  console.log("New order created in Shopify:", req.body);
  // Process order in your system
  processOrder(req.body);
  res.status(200).send("OK");
});
```

#### Step 2: Configure Webhooks in Shopify

1. In Shopify Admin, go to **Settings** → **Notifications**
2. Scroll down to **Webhooks**
3. Click **"Create webhook"**
4. Configure webhooks:
   - **Product creation**: `https://your-domain.com/webhooks/shopify/products/create`
   - **Product update**: `https://your-domain.com/webhooks/shopify/products/update`
   - **Order creation**: `https://your-domain.com/webhooks/shopify/orders/create`

---

## 🔄 Option 4: Full Migration to Shopify

### ✅ Benefits:

- **Complete Shopify ecosystem**
- **Built-in features**
- **Professional themes**
- **App marketplace**

### 📋 Migration Steps:

#### Step 1: Export Data from sastabazar

```bash
# Export products to CSV
node bulk-import.js export products.csv

# Export customers to CSV
node scripts/export-customers.js
```

#### Step 2: Import to Shopify

1. In Shopify Admin, go to **Products**
2. Click **"Import"**
3. Upload your CSV file
4. Map columns correctly
5. Click **"Import"**

#### Step 3: Customize Shopify Store

1. **Theme**: Choose a professional theme
2. **Domain**: Connect your custom domain
3. **Payment**: Set up payment methods
4. **Shipping**: Configure shipping rates

---

## 🛠️ Complete Integration Script

Let me create a comprehensive script for you:

```javascript
// scripts/shopify-complete-integration.js
const ShopifyAPI = require("./shopify-api-integration");
const mongoose = require("mongoose");
const Product = require("../server/models/Product");
const Order = require("../server/models/Order");

class ShopifyIntegration {
  constructor() {
    this.shopify = new ShopifyAPI();
  }

  // Sync products from Shopify to sastabazar
  async syncProducts() {
    try {
      console.log("🔄 Syncing products from Shopify...");

      const shopifyProducts = await this.shopify.getProducts();
      console.log(`📦 Found ${shopifyProducts.length} products in Shopify`);

      let syncedCount = 0;
      let skippedCount = 0;

      for (const shopifyProduct of shopifyProducts) {
        try {
          const productData = {
            name: shopifyProduct.title,
            description: this.stripHtml(shopifyProduct.body_html),
            shortDescription: shopifyProduct.title,
            category: this.mapCategory(shopifyProduct.product_type),
            brand: shopifyProduct.vendor || "sastabazar",
            price: parseFloat(shopifyProduct.variants[0]?.price || 0),
            originalPrice: parseFloat(
              shopifyProduct.variants[0]?.compare_at_price ||
                shopifyProduct.variants[0]?.price ||
                0,
            ),
            stock: shopifyProduct.variants[0]?.inventory_quantity || 0,
            images: shopifyProduct.images.map((img) => img.src),
            tags: shopifyProduct.tags.split(",").map((tag) => tag.trim()),
            isActive: true,
            isFeatured: shopifyProduct.tags.includes("featured"),
            isDropshipping: shopifyProduct.tags.includes("dropshipping"),
            supplier: "Shopify",
            supplierProductId: shopifyProduct.id.toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Check if product exists
          const existingProduct = await Product.findOne({
            supplierProductId: productData.supplierProductId,
          });

          if (existingProduct) {
            await Product.findByIdAndUpdate(existingProduct._id, productData);
            console.log(`🔄 Updated: ${productData.name}`);
          } else {
            const product = new Product(productData);
            await product.save();
            console.log(`✅ Added: ${productData.name}`);
          }

          syncedCount++;
        } catch (error) {
          console.log(`⚠️ Skipped: ${shopifyProduct.title} - ${error.message}`);
          skippedCount++;
        }
      }

      console.log(`\n📊 Sync Summary:`);
      console.log(`✅ Synced: ${syncedCount} products`);
      console.log(`⚠️ Skipped: ${skippedCount} products`);
    } catch (error) {
      console.error("❌ Error syncing products:", error.message);
      throw error;
    }
  }

  // Sync orders from Shopify to sastabazar
  async syncOrders() {
    try {
      console.log("🔄 Syncing orders from Shopify...");

      const shopifyOrders = await this.shopify.getOrders();
      console.log(`📦 Found ${shopifyOrders.length} orders in Shopify`);

      let syncedCount = 0;

      for (const shopifyOrder of shopifyOrders) {
        try {
          const orderData = {
            orderNumber: shopifyOrder.order_number,
            customer: {
              name: `${shopifyOrder.customer?.first_name} ${shopifyOrder.customer?.last_name}`,
              email: shopifyOrder.customer?.email,
              phone: shopifyOrder.customer?.phone,
            },
            items: shopifyOrder.line_items.map((item) => ({
              productId: item.product_id.toString(),
              name: item.name,
              quantity: item.quantity,
              price: parseFloat(item.price),
            })),
            total: parseFloat(shopifyOrder.total_price),
            status: this.mapOrderStatus(shopifyOrder.fulfillment_status),
            shippingAddress: {
              street: shopifyOrder.shipping_address?.address1,
              city: shopifyOrder.shipping_address?.city,
              state: shopifyOrder.shipping_address?.province,
              zipCode: shopifyOrder.shipping_address?.zip,
              country: shopifyOrder.shipping_address?.country,
            },
            createdAt: new Date(shopifyOrder.created_at),
            updatedAt: new Date(shopifyOrder.updated_at),
          };

          // Check if order exists
          const existingOrder = await Order.findOne({
            orderNumber: orderData.orderNumber,
          });

          if (!existingOrder) {
            const order = new Order(orderData);
            await order.save();
            console.log(`✅ Added order: ${orderData.orderNumber}`);
            syncedCount++;
          }
        } catch (error) {
          console.log(
            `⚠️ Skipped order: ${shopifyOrder.order_number} - ${error.message}`,
          );
        }
      }

      console.log(`\n📊 Order Sync Summary:`);
      console.log(`✅ Synced: ${syncedCount} orders`);
    } catch (error) {
      console.error("❌ Error syncing orders:", error.message);
      throw error;
    }
  }

  // Helper methods
  stripHtml(html) {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  mapCategory(productType) {
    const categoryMap = {
      Electronics: "electronics",
      Clothing: "clothing",
      "Home & Garden": "home-goods",
      Sports: "sports",
      Beauty: "beauty",
      Books: "books",
      Toys: "toys",
      Automotive: "automotive",
    };
    return categoryMap[productType] || "general";
  }

  mapOrderStatus(fulfillmentStatus) {
    const statusMap = {
      fulfilled: "delivered",
      partial: "processing",
      unfulfilled: "pending",
      null: "pending",
    };
    return statusMap[fulfillmentStatus] || "pending";
  }

  // Main execution method
  async run(command) {
    try {
      await mongoose.connect(
        process.env.MONGODB_URI || "mongodb://localhost:27017/sastabazar",
      );
      console.log("✅ Connected to MongoDB");

      switch (command) {
        case "sync-products":
          await this.syncProducts();
          break;
        case "sync-orders":
          await this.syncOrders();
          break;
        case "sync-all":
          await this.syncProducts();
          await this.syncOrders();
          break;
        default:
          console.log(
            "Available commands: sync-products, sync-orders, sync-all",
          );
      }

      await mongoose.disconnect();
      console.log("🎉 Integration completed successfully!");
    } catch (error) {
      console.error("💥 Integration failed:", error.message);
      process.exit(1);
    }
  }
}

// CLI Interface
if (require.main === module) {
  const command = process.argv[2] || "sync-all";
  const integration = new ShopifyIntegration();
  integration.run(command);
}

module.exports = ShopifyIntegration;
```

---

## 🚀 Quick Start Guide

### Step 1: Create Shopify Store

1. Go to [shopify.com](https://shopify.com)
2. Start 14-day free trial
3. Complete setup wizard

### Step 2: Get API Credentials

1. Go to **Settings** → **Apps and sales channels**
2. Click **"Develop apps"**
3. Create new app
4. Configure API access
5. Install app and get access token

### Step 3: Configure Environment

Add to your `.env` file:

```env
SHOPIFY_SHOP_NAME=your-shop-name
SHOPIFY_ACCESS_TOKEN=your-access-token
```

### Step 4: Run Integration

```bash
# Sync products
node scripts/shopify-complete-integration.js sync-products

# Sync orders
node scripts/shopify-complete-integration.js sync-orders

# Sync everything
node scripts/shopify-complete-integration.js sync-all
```

---

## 🎯 Recommended Workflow

### For Maximum Efficiency:

1. **Start with Option 1** (Shopify Backend + Custom Frontend)
   - Keep your sastabazar design
   - Use Shopify for product management
   - Automatic sync

2. **Set up webhooks** for real-time updates
3. **Configure payment processing** through Shopify
4. **Set up order fulfillment** automation

---

## 💰 Cost Breakdown

- **Shopify Basic**: $29/month
- **Custom domain**: $10-15/year
- **SSL certificate**: Free with Shopify
- **Payment processing**: 2.9% + 30¢ per transaction

---

## 🎉 Benefits After Connection

- ✅ **Professional product management**
- ✅ **Automatic inventory sync**
- ✅ **Built-in payment processing**
- ✅ **Order management system**
- ✅ **Customer management**
- ✅ **Analytics and reporting**
- ✅ **Mobile-responsive design**
- ✅ **SEO optimization**

**Your sastabazar website will be fully integrated with Shopify's powerful e-commerce platform! 🚀**
