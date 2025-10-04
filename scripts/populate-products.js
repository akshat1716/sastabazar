#!/usr/bin/env node

// Script to populate the database with sample products
// Usage: node scripts/populate-products.js

const mongoose = require('mongoose');
const Product = require('../server/models/Product');

// Sample products data
const sampleProducts = [
  // Apparel Category
  {
    name: "Premium Cotton T-Shirt",
    brand: "sastabazar",
    category: "apparel",
    shortDescription: "Ultra-soft premium cotton t-shirt with minimalist design.",
    description: "Ultra-soft premium cotton t-shirt with minimalist design. Perfect for everyday wear with exceptional comfort and breathability. Made from 100% organic cotton with a comfortable fit that's perfect for any occasion.",
    basePrice: 1299,
    salePrice: 999,
    isOnSale: true,
    isNewArrival: false,
    isFeatured: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
        alt: "Premium Cotton T-Shirt",
        isPrimary: true
      },
      {
        url: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500&h=500&fit=crop",
        alt: "Premium Cotton T-Shirt Back View"
      }
    ],
    variants: [
      {
        name: "Size",
        value: "S",
        price: 1299,
        stock: 50,
        sku: "TSHIRT-S-BLACK"
      },
      {
        name: "Size",
        value: "M",
        price: 1299,
        stock: 50,
        sku: "TSHIRT-M-BLACK"
      },
      {
        name: "Size",
        value: "L",
        price: 1299,
        stock: 50,
        sku: "TSHIRT-L-BLACK"
      },
      {
        name: "Size",
        value: "XL",
        price: 1299,
        stock: 50,
        sku: "TSHIRT-XL-BLACK"
      }
    ],
    tags: ["cotton", "premium", "minimalist", "comfortable"]
  },
  {
    name: "Designer Denim Jacket",
    brand: "sastabazar",
    category: "apparel",
    shortDescription: "Classic denim jacket with modern tailoring.",
    description: "Classic denim jacket with modern tailoring. Features premium denim construction with comfortable fit and timeless style. Perfect for layering in any season with a versatile design that goes with everything.",
    basePrice: 3499,
    salePrice: 2799,
    isOnSale: true,
    isNewArrival: false,
    isFeatured: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1544022613-e87ca540a84a?w=500&h=500&fit=crop",
        alt: "Designer Denim Jacket",
        isPrimary: true
      },
      {
        url: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=500&h=500&fit=crop",
        alt: "Designer Denim Jacket Back View"
      }
    ],
    variants: [
      {
        name: "Size",
        value: "S",
        price: 3499,
        stock: 25,
        sku: "JACKET-S-BLUE"
      },
      {
        name: "Size",
        value: "M",
        price: 3499,
        stock: 25,
        sku: "JACKET-M-BLUE"
      },
      {
        name: "Size",
        value: "L",
        price: 3499,
        stock: 25,
        sku: "JACKET-L-BLUE"
      },
      {
        name: "Size",
        value: "XL",
        price: 3499,
        stock: 25,
        sku: "JACKET-XL-BLUE"
      }
    ],
    tags: ["denim", "jacket", "classic", "premium"]
  },
  {
    name: "Minimalist Ceramic Vase",
    brand: "sastabazar",
    category: "home-goods",
    shortDescription: "Handcrafted ceramic vase with minimalist design.",
    description: "Handcrafted ceramic vase with minimalist design. Perfect for displaying fresh flowers or as a standalone decorative piece. Each vase is uniquely crafted by skilled artisans using traditional techniques.",
    basePrice: 899,
    salePrice: 699,
    isOnSale: true,
    isNewArrival: false,
    isFeatured: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=500&fit=crop",
        alt: "Minimalist Ceramic Vase",
        isPrimary: true
      },
      {
        url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop",
        alt: "Minimalist Ceramic Vase Side View"
      }
    ],
    variants: [
      {
        name: "Size",
        value: "Small",
        price: 899,
        stock: 30,
        sku: "VASE-SMALL-WHITE"
      },
      {
        name: "Size",
        value: "Medium",
        price: 899,
        stock: 30,
        sku: "VASE-MEDIUM-WHITE"
      },
      {
        name: "Size",
        value: "Large",
        price: 899,
        stock: 30,
        sku: "VASE-LARGE-WHITE"
      }
    ],
    tags: ["ceramic", "vase", "minimalist", "handcrafted"]
  }
];

// MongoDB connection string - update this with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sastabazar';

async function populateProducts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    // Clear existing products (optional - comment out if you want to keep existing)
    console.log('Clearing existing products...');
    await Product.deleteMany({});
    console.log('Existing products cleared.');

    // Insert sample products
    console.log('Inserting sample products...');
    const insertedProducts = await Product.insertMany(sampleProducts);
    console.log(`Successfully inserted ${insertedProducts.length} products!`);

    // Display summary
    console.log('\n📦 Products Summary:');
    const categories = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    categories.forEach(cat => {
      console.log(`  ${cat._id}: ${cat.count} products`);
    });

    console.log('\n✅ Database population completed successfully!');
    console.log('\n🚀 Your sastabazar store is now ready with sample products!');
    console.log('   Visit: http://localhost:5173/products to see your products');

  } catch (error) {
    console.error('❌ Error populating database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
}

// Run the script
populateProducts(); 