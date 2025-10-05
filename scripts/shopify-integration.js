#!/usr/bin/env node

/**
 * Shopify Integration Script for sastabazar
 *
 * This script connects your sastabazar website to Shopify
 * and syncs products, orders, and customers
 */

const axios = require("axios");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config();

// Configuration
const CONFIG = {
  shopify: {
    shopName: process.env.SHOPIFY_SHOP_NAME || "your-shop-name",
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN || "your-access-token",
    apiVersion: "2023-10",
  },
  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/sastabazar",
  },
};

class ShopifyAPI {
  constructor() {
    this.shopName = CONFIG.shopify.shopName;
    this.accessToken = CONFIG.shopify.accessToken;
    this.apiVersion = CONFIG.shopify.apiVersion;
    this.baseURL = `https://${this.shopName}.myshopify.com/admin/api/${this.apiVersion}`;
    this.headers = {
      "X-Shopify-Access-Token": this.accessToken,
      "Content-Type": "application/json",
    };
  }

  // Test connection to Shopify
  async testConnection() {
    try {
      console.log("🔄 Testing Shopify connection...");
      const response = await axios.get(`${this.baseURL}/shop.json`, {
        headers: this.headers,
      });
      console.log(`✅ Connected to Shopify store: ${response.data.shop.name}`);
      console.log(`📍 Store URL: ${response.data.shop.domain}`);
      return true;
    } catch (error) {
      console.error("❌ Failed to connect to Shopify:", error.message);
      if (error.response?.status === 401) {
        console.error("🔑 Check your SHOPIFY_ACCESS_TOKEN in .env file");
      }
      return false;
    }
  }

  // Get all products from Shopify
  async getProducts(limit = 250) {
    try {
      console.log("🔄 Fetching products from Shopify...");
      const response = await axios.get(`${this.baseURL}/products.json`, {
        headers: this.headers,
        params: { limit },
      });
      console.log(`📦 Found ${response.data.products.length} products`);
      return response.data.products;
    } catch (error) {
      console.error("❌ Error fetching products:", error.message);
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
      console.log(`✅ Created product: ${productData.title}`);
      return response.data.product;
    } catch (error) {
      console.error("❌ Error creating product:", error.message);
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
      console.log(`🔄 Updated product: ${productData.title}`);
      return response.data.product;
    } catch (error) {
      console.error("❌ Error updating product:", error.message);
      throw error;
    }
  }

  // Get orders from Shopify
  async getOrders(limit = 250) {
    try {
      console.log("🔄 Fetching orders from Shopify...");
      const response = await axios.get(`${this.baseURL}/orders.json`, {
        headers: this.headers,
        params: { limit },
      });
      console.log(`📦 Found ${response.data.orders.length} orders`);
      return response.data.orders;
    } catch (error) {
      console.error("❌ Error fetching orders:", error.message);
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
      console.log(`✅ Created order: ${orderData.order_number}`);
      return response.data.order;
    } catch (error) {
      console.error("❌ Error creating order:", error.message);
      throw error;
    }
  }

  // Get customers from Shopify
  async getCustomers(limit = 250) {
    try {
      console.log("🔄 Fetching customers from Shopify...");
      const response = await axios.get(`${this.baseURL}/customers.json`, {
        headers: this.headers,
        params: { limit },
      });
      console.log(`📦 Found ${response.data.customers.length} customers`);
      return response.data.customers;
    } catch (error) {
      console.error("❌ Error fetching customers:", error.message);
      throw error;
    }
  }
}

class ShopifyIntegration {
  constructor() {
    this.shopify = new ShopifyAPI();
  }

  // Transform Shopify product to sastabazar format
  transformProduct(shopifyProduct) {
    return {
      name: shopifyProduct.title,
      description: this.stripHtml(shopifyProduct.body_html || ""),
      shortDescription: shopifyProduct.title,
      category: this.mapCategory(shopifyProduct.product_type),
      brand: shopifyProduct.vendor || "sastabazar",
      price: this.parsePrice(shopifyProduct.variants[0]?.price),
      originalPrice:
        this.parsePrice(shopifyProduct.variants[0]?.compare_at_price) ||
        this.parsePrice(shopifyProduct.variants[0]?.price),
      stock: shopifyProduct.variants[0]?.inventory_quantity || 0,
      images: shopifyProduct.images.map((img) => img.src),
      tags: shopifyProduct.tags
        ? shopifyProduct.tags.split(",").map((tag) => tag.trim())
        : [],
      isActive: true,
      isFeatured: shopifyProduct.tags?.includes("featured") || false,
      isDropshipping: shopifyProduct.tags?.includes("dropshipping") || false,
      supplier: "Shopify",
      supplierProductId: shopifyProduct.id.toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Sync products from Shopify to sastabazar database
  async syncProducts() {
    try {
      console.log("🚀 Starting product sync...");

      // Test connection first
      const connected = await this.shopify.testConnection();
      if (!connected) {
        throw new Error("Failed to connect to Shopify");
      }

      // Connect to MongoDB
      await mongoose.connect(CONFIG.mongodb.uri);
      console.log("✅ Connected to MongoDB");

      // Load Product model
      const Product = require("../server/models/Product");

      // Get products from Shopify
      const shopifyProducts = await this.shopify.getProducts();

      let syncedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (const shopifyProduct of shopifyProducts) {
        try {
          const productData = this.transformProduct(shopifyProduct);

          // Check if product already exists
          const existingProduct = await Product.findOne({
            supplierProductId: productData.supplierProductId,
          });

          if (existingProduct) {
            // Update existing product
            await Product.findByIdAndUpdate(existingProduct._id, productData);
            console.log(`🔄 Updated: ${productData.name}`);
          } else {
            // Create new product
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

      console.log(`\n📊 Product Sync Summary:`);
      console.log(`✅ Synced: ${syncedCount} products`);
      console.log(`⚠️ Skipped: ${skippedCount} products`);
      console.log(`❌ Errors: ${errorCount} products`);

      await mongoose.disconnect();
      return { syncedCount, skippedCount, errorCount };
    } catch (error) {
      console.error("❌ Error syncing products:", error.message);
      throw error;
    }
  }

  // Export products to CSV
  async exportProductsToCSV() {
    try {
      console.log("📄 Exporting products to CSV...");

      const shopifyProducts = await this.shopify.getProducts();
      const csvHeader =
        "name,description,shortDescription,category,brand,price,originalPrice,stock,images,tags,isActive,isFeatured,isDropshipping,supplier,supplierProductId";

      const csvRows = shopifyProducts.map((product) => {
        const transformed = this.transformProduct(product);
        return [
          `"${transformed.name}"`,
          `"${transformed.description}"`,
          `"${transformed.shortDescription}"`,
          transformed.category,
          transformed.brand,
          transformed.price,
          transformed.originalPrice,
          transformed.stock,
          `"${transformed.images.join(",")}"`,
          `"${transformed.tags.join(",")}"`,
          transformed.isActive,
          transformed.isFeatured,
          transformed.isDropshipping,
          transformed.supplier,
          transformed.supplierProductId,
        ].join(",");
      });

      const csvContent = [csvHeader, ...csvRows].join("\n");

      const filename = `shopify-products-${new Date().toISOString().split("T")[0]}.csv`;
      const filepath = path.join(__dirname, "..", filename);

      fs.writeFileSync(filepath, csvContent);
      console.log(`✅ CSV exported to: ${filepath}`);

      return filepath;
    } catch (error) {
      console.error("❌ Error exporting CSV:", error.message);
      throw error;
    }
  }

  // Sync orders from Shopify
  async syncOrders() {
    try {
      console.log("🚀 Starting order sync...");

      // Test connection first
      const connected = await this.shopify.testConnection();
      if (!connected) {
        throw new Error("Failed to connect to Shopify");
      }

      // Connect to MongoDB
      await mongoose.connect(CONFIG.mongodb.uri);
      console.log("✅ Connected to MongoDB");

      // Load Order model
      const Order = require("../server/models/Order");

      // Get orders from Shopify
      const shopifyOrders = await this.shopify.getOrders();

      let syncedCount = 0;
      let skippedCount = 0;

      for (const shopifyOrder of shopifyOrders) {
        try {
          const orderData = {
            orderNumber: shopifyOrder.order_number,
            customer: {
              name: `${shopifyOrder.customer?.first_name || ""} ${shopifyOrder.customer?.last_name || ""}`.trim(),
              email: shopifyOrder.customer?.email || "",
              phone: shopifyOrder.customer?.phone || "",
            },
            items: shopifyOrder.line_items.map((item) => ({
              productId: item.product_id?.toString() || "",
              name: item.name,
              quantity: item.quantity,
              price: this.parsePrice(item.price),
            })),
            total: this.parsePrice(shopifyOrder.total_price),
            status: this.mapOrderStatus(shopifyOrder.fulfillment_status),
            shippingAddress: {
              street: shopifyOrder.shipping_address?.address1 || "",
              city: shopifyOrder.shipping_address?.city || "",
              state: shopifyOrder.shipping_address?.province || "",
              zipCode: shopifyOrder.shipping_address?.zip || "",
              country: shopifyOrder.shipping_address?.country || "",
            },
            createdAt: new Date(shopifyOrder.created_at),
            updatedAt: new Date(shopifyOrder.updated_at),
          };

          // Check if order already exists
          const existingOrder = await Order.findOne({
            orderNumber: orderData.orderNumber,
          });

          if (!existingOrder) {
            const order = new Order(orderData);
            await order.save();
            console.log(`✅ Added order: ${orderData.orderNumber}`);
            syncedCount++;
          } else {
            console.log(`⚠️ Order already exists: ${orderData.orderNumber}`);
            skippedCount++;
          }
        } catch (error) {
          console.log(
            `⚠️ Skipped order: ${shopifyOrder.order_number} - ${error.message}`,
          );
          skippedCount++;
        }
      }

      console.log(`\n📊 Order Sync Summary:`);
      console.log(`✅ Synced: ${syncedCount} orders`);
      console.log(`⚠️ Skipped: ${skippedCount} orders`);

      await mongoose.disconnect();
      return { syncedCount, skippedCount };
    } catch (error) {
      console.error("❌ Error syncing orders:", error.message);
      throw error;
    }
  }

  // Helper methods
  stripHtml(html) {
    if (!html) return "";
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
      Health: "health",
      Jewelry: "jewelry",
    };
    return categoryMap[productType] || "general";
  }

  parsePrice(price) {
    return price ? parseFloat(price) : 0;
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
      console.log("🚀 Starting Shopify Integration...\n");

      switch (command) {
        case "test":
          await this.shopify.testConnection();
          break;
        case "sync-products":
          await this.syncProducts();
          break;
        case "sync-orders":
          await this.syncOrders();
          break;
        case "export-products":
          await this.exportProductsToCSV();
          break;
        case "sync-all":
          await this.syncProducts();
          await this.syncOrders();
          break;
        default:
          console.log("Available commands:");
          console.log("  test           - Test Shopify connection");
          console.log("  sync-products  - Sync products from Shopify");
          console.log("  sync-orders    - Sync orders from Shopify");
          console.log("  export-products - Export products to CSV");
          console.log("  sync-all       - Sync everything");
      }

      console.log("\n🎉 Integration completed successfully!");
    } catch (error) {
      console.error("\n💥 Integration failed:", error.message);
      process.exit(1);
    }
  }
}

// CLI Interface
if (require.main === module) {
  const command = process.argv[2] || "test";
  const integration = new ShopifyIntegration();
  integration.run(command);
}

module.exports = ShopifyIntegration;
