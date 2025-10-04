const mongoose = require('mongoose');
const Product = require('./server/models/Product');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/sastabazar');

// Dropshipping products from AliExpress/Alibaba
const dropshippingProducts = [
  {
    name: 'Wireless Bluetooth Earbuds',
    description: 'High-quality wireless earbuds with noise cancellation, 30-hour battery life, and premium sound quality. Perfect for music lovers and professionals.',
    shortDescription: 'Wireless earbuds with noise cancellation',
    category: 'tech-accessories',
    brand: 'TechPro',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=500&h=500&fit=crop',
        alt: 'Wireless Bluetooth Earbuds',
        isPrimary: true
      }
    ],
    variants: [
      {
        name: 'Color',
        value: 'Black',
        price: 1200,
        stock: 999,
        sku: 'EARBUDS-BLACK-DS001'
      },
      {
        name: 'Color',
        value: 'White',
        price: 1200,
        stock: 999,
        sku: 'EARBUDS-WHITE-DS001'
      }
    ],
    basePrice: 1200,
    salePrice: 999,
    isOnSale: true,
    isNewArrival: true,
    isFeatured: true,
    tags: ['wireless', 'bluetooth', 'noise-cancellation', 'dropshipping'],
    dimensions: { unit: 'cm' },
    materials: [],
    colors: ['black', 'white'],
    rating: { average: 4.5, count: 0 },
    stock: 999,
    isActive: true,
    seo: { keywords: ['wireless', 'bluetooth', 'earbuds'] },
    reviews: [],
    // Dropshipping info
    supplierPrice: 800,
    supplier: 'AliExpress',
    shippingTime: '15-30 days',
    profitMargin: 33
  },
  {
    name: 'Premium Cotton T-Shirt',
    description: 'Ultra-soft premium cotton t-shirt with minimalist design. Perfect for everyday wear with exceptional comfort and breathability.',
    shortDescription: 'Premium cotton t-shirt',
    category: 'apparel',
    brand: 'StyleCo',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop',
        alt: 'Premium Cotton T-Shirt',
        isPrimary: true
      }
    ],
    variants: [
      {
        name: 'Size',
        value: 'S',
        price: 400,
        stock: 999,
        sku: 'TSHIRT-S-DS001'
      },
      {
        name: 'Size',
        value: 'M',
        price: 400,
        stock: 999,
        sku: 'TSHIRT-M-DS001'
      },
      {
        name: 'Size',
        value: 'L',
        price: 400,
        stock: 999,
        sku: 'TSHIRT-L-DS001'
      }
    ],
    basePrice: 400,
    salePrice: 350,
    isOnSale: true,
    isNewArrival: false,
    isFeatured: true,
    tags: ['cotton', 'premium', 't-shirt', 'dropshipping'],
    dimensions: { unit: 'cm' },
    materials: ['cotton'],
    colors: ['black', 'white', 'gray'],
    rating: { average: 4.2, count: 0 },
    stock: 999,
    isActive: true,
    seo: { keywords: ['cotton', 't-shirt', 'premium'] },
    reviews: [],
    // Dropshipping info
    supplierPrice: 200,
    supplier: 'AliExpress',
    shippingTime: '15-30 days',
    profitMargin: 50
  },
  {
    name: 'Smart Fitness Watch',
    description: 'Advanced smart fitness watch with heart rate monitoring, GPS tracking, and 7-day battery life. Perfect for fitness enthusiasts and health-conscious individuals.',
    shortDescription: 'Smart fitness watch with health monitoring',
    category: 'tech-accessories',
    brand: 'FitTech',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1544117519-31a4b719223d?w=500&h=500&fit=crop',
        alt: 'Smart Fitness Watch',
        isPrimary: true
      }
    ],
    variants: [
      {
        name: 'Color',
        value: 'Black',
        price: 2500,
        stock: 999,
        sku: 'WATCH-BLACK-DS001'
      },
      {
        name: 'Color',
        value: 'Silver',
        price: 2500,
        stock: 999,
        sku: 'WATCH-SILVER-DS001'
      }
    ],
    basePrice: 2500,
    salePrice: 1999,
    isOnSale: true,
    isNewArrival: true,
    isFeatured: true,
    tags: ['smartwatch', 'fitness', 'health', 'dropshipping'],
    dimensions: { unit: 'cm' },
    materials: ['silicone', 'metal'],
    colors: ['black', 'silver'],
    rating: { average: 4.3, count: 0 },
    stock: 999,
    isActive: true,
    seo: { keywords: ['smartwatch', 'fitness', 'health'] },
    reviews: [],
    // Dropshipping info
    supplierPrice: 1500,
    supplier: 'AliExpress',
    shippingTime: '15-30 days',
    profitMargin: 40
  }
];

async function addDropshippingProducts() {
  try {
    console.log('🚀 Adding Dropshipping Products to sastabazar');
    console.log('==============================================');
    
    const products = await Product.insertMany(dropshippingProducts);
    
    console.log(`✅ Successfully added ${products.length} dropshipping products!`);
    console.log('\n📦 Product Details:');
    console.log('==================');
    
    products.forEach((product, index) => {
      const profit = product.basePrice - product.supplierPrice;
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   Category: ${product.category}`);
      console.log(`   Supplier: ${product.supplier}`);
      console.log(`   Supplier Price: ₹${product.supplierPrice}`);
      console.log(`   Your Price: ₹${product.basePrice}`);
      console.log(`   Sale Price: ₹${product.salePrice}`);
      console.log(`   Profit: ₹${profit} (${product.profitMargin}% margin)`);
      console.log(`   Shipping: ${product.shippingTime}`);
    });
    
    console.log('\n💰 Total Profit Potential:');
    console.log('==========================');
    const totalProfit = products.reduce((sum, product) => {
      return sum + (product.basePrice - product.supplierPrice);
    }, 0);
    console.log(`Average profit per product: ₹${Math.round(totalProfit / products.length)}`);
    
    console.log('\n🎯 Next Steps:');
    console.log('==============');
    console.log('1. Set up AliExpress/Alibaba accounts');
    console.log('2. Test order flow with sample products');
    console.log('3. Set up automated order processing');
    console.log('4. Start marketing your store');
    console.log('5. Monitor profit margins and adjust prices');
    
    console.log('\n🌐 Your Store URLs:');
    console.log('==================');
    console.log('Frontend: http://localhost:5173');
    console.log('Products: http://localhost:5173/products');
    console.log('Database: http://localhost:5001/api/db');
    
  } catch (error) {
    console.error('❌ Error adding dropshipping products:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Run the function
addDropshippingProducts();
