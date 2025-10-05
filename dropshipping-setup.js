const mongoose = require("mongoose");
const Product = require("./server/models/Product");
const axios = require("axios");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/sastabazar");

// Dropshipping configuration
const dropshippingConfig = {
  suppliers: {
    aliexpress: {
      name: "AliExpress",
      baseUrl: "https://api.aliexpress.com",
      markup: 1.5, // 50% markup
      shippingTime: "15-30 days",
      minOrder: 1,
    },
    alibaba: {
      name: "Alibaba",
      baseUrl: "https://api.alibaba.com",
      markup: 1.3, // 30% markup
      shippingTime: "10-20 days",
      minOrder: 1,
    },
    indiamart: {
      name: "IndiaMART",
      baseUrl: "https://api.indiamart.com",
      markup: 1.4, // 40% markup
      shippingTime: "5-10 days",
      minOrder: 1,
    },
  },

  // Product categories for dropshipping
  categories: {
    electronics: ["phones", "headphones", "smartwatches", "tablets"],
    apparel: ["t-shirts", "dresses", "shoes", "accessories"],
    "home-goods": ["kitchen", "decor", "furniture", "bedding"],
    beauty: ["skincare", "makeup", "haircare", "fragrances"],
  },
};

// Sample dropshipping products (simulating API data)
const sampleDropshippingProducts = [
  {
    name: "Wireless Bluetooth Earbuds",
    description:
      "High-quality wireless earbuds with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.",
    shortDescription: "Wireless earbuds with noise cancellation",
    category: "tech-accessories",
    brand: "TechPro",
    supplier: "aliexpress",
    supplierPrice: 800, // What you pay supplier
    yourPrice: 1200, // What you sell for (50% markup)
    images: [
      {
        url: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=500&h=500&fit=crop",
        alt: "Wireless Bluetooth Earbuds",
        isPrimary: true,
      },
    ],
    variants: [
      {
        name: "Color",
        value: "Black",
        price: 1200,
        stock: 999, // Dropshipping = unlimited stock
        sku: "EARBUDS-BLACK-DS001",
      },
      {
        name: "Color",
        value: "White",
        price: 1200,
        stock: 999,
        sku: "EARBUDS-WHITE-DS001",
      },
    ],
    basePrice: 1200,
    salePrice: 999,
    isOnSale: true,
    isNewArrival: true,
    isFeatured: true,
    tags: ["wireless", "bluetooth", "noise-cancellation", "dropshipping"],
    dimensions: { unit: "cm" },
    materials: [],
    colors: ["black", "white"],
    rating: { average: 4.5, count: 0 },
    stock: 999,
    isActive: true,
    isDropshipping: true,
    supplierInfo: {
      name: "AliExpress",
      shippingTime: "15-30 days",
      minOrder: 1,
      supplierPrice: 800,
    },
    seo: { keywords: ["wireless", "bluetooth", "earbuds"] },
    reviews: [],
  },
  {
    name: "Premium Cotton T-Shirt",
    description:
      "Ultra-soft premium cotton t-shirt with minimalist design. Perfect for everyday wear with exceptional comfort.",
    shortDescription: "Premium cotton t-shirt",
    category: "apparel",
    brand: "StyleCo",
    supplier: "aliexpress",
    supplierPrice: 200,
    yourPrice: 400,
    images: [
      {
        url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
        alt: "Premium Cotton T-Shirt",
        isPrimary: true,
      },
    ],
    variants: [
      {
        name: "Size",
        value: "S",
        price: 400,
        stock: 999,
        sku: "TSHIRT-S-DS001",
      },
      {
        name: "Size",
        value: "M",
        price: 400,
        stock: 999,
        sku: "TSHIRT-M-DS001",
      },
      {
        name: "Size",
        value: "L",
        price: 400,
        stock: 999,
        sku: "TSHIRT-L-DS001",
      },
    ],
    basePrice: 400,
    salePrice: 350,
    isOnSale: true,
    isNewArrival: false,
    isFeatured: true,
    tags: ["cotton", "premium", "t-shirt", "dropshipping"],
    dimensions: { unit: "cm" },
    materials: ["cotton"],
    colors: ["black", "white", "gray"],
    rating: { average: 4.2, count: 0 },
    stock: 999,
    isActive: true,
    isDropshipping: true,
    supplierInfo: {
      name: "AliExpress",
      shippingTime: "15-30 days",
      minOrder: 1,
      supplierPrice: 200,
    },
    seo: { keywords: ["cotton", "t-shirt", "premium"] },
    reviews: [],
  },
];

// Function to add dropshipping products
async function addDropshippingProducts() {
  try {
    console.log("🚀 Setting up Dropshipping for sastabazar");
    console.log("========================================");

    // Add sample dropshipping products
    const products = await Product.insertMany(sampleDropshippingProducts);

    console.log(`✅ Added ${products.length} dropshipping products!`);

    products.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   Supplier: ${product.supplierInfo.name}`);
      console.log(`   Supplier Price: ₹${product.supplierInfo.supplierPrice}`);
      console.log(`   Your Price: ₹${product.basePrice}`);
      console.log(
        `   Profit: ₹${product.basePrice - product.supplierInfo.supplierPrice}`,
      );
      console.log(`   Shipping: ${product.supplierInfo.shippingTime}`);
    });

    console.log("\n💰 Profit Margins:");
    console.log("==================");
    products.forEach((product) => {
      const profit = product.basePrice - product.supplierInfo.supplierPrice;
      const margin = ((profit / product.basePrice) * 100).toFixed(1);
      console.log(`${product.name}: ₹${profit} profit (${margin}% margin)`);
    });

    console.log("\n🎯 Next Steps:");
    console.log("==============");
    console.log("1. Set up supplier accounts (AliExpress, Alibaba)");
    console.log("2. Configure order automation");
    console.log("3. Set up payment processing");
    console.log("4. Test order flow");
    console.log("5. Start marketing your store!");
  } catch (error) {
    console.error("❌ Error adding dropshipping products:", error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Function to calculate profit margins
function calculateProfitMargin(supplierPrice, yourPrice) {
  const profit = yourPrice - supplierPrice;
  const margin = (profit / yourPrice) * 100;
  return { profit, margin: margin.toFixed(1) };
}

// Function to simulate order processing
function processDropshippingOrder(orderDetails) {
  const order = {
    orderId: `DS${Date.now()}`,
    customerDetails: orderDetails.customer,
    products: orderDetails.products,
    totalAmount: orderDetails.total,
    supplierOrders: [],
    status: "Processing",
    createdAt: new Date(),
  };

  // Create supplier orders
  orderDetails.products.forEach((product) => {
    const supplierOrder = {
      supplier: product.supplier,
      productId: product.id,
      quantity: product.quantity,
      supplierPrice: product.supplierPrice,
      totalCost: product.supplierPrice * product.quantity,
      shippingAddress: orderDetails.customer.address,
      status: "Pending",
    };
    order.supplierOrders.push(supplierOrder);
  });

  return order;
}

// Export functions
module.exports = {
  addDropshippingProducts,
  calculateProfitMargin,
  processDropshippingOrder,
  dropshippingConfig,
};

// Run if called directly
if (require.main === module) {
  addDropshippingProducts();
}
