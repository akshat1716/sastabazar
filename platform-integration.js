const mongoose = require('mongoose');
const Product = require('./server/models/Product');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/sastabazar');

// Platform configurations
const platformConfig = {
  tradeindia: {
    name: 'TradeIndia',
    type: 'B2B Marketplace',
    baseUrl: 'https://www.tradeindia.com',
    apiEndpoint: 'https://api.tradeindia.com',
    features: ['bulk orders', 'wholesale prices', 'indian suppliers'],
    markup: 1.4, // 40% markup
    shippingTime: '5-10 days',
    minOrder: 10,
    categories: ['textiles', 'electronics', 'home goods', 'industrial']
  },
  
  indiamart: {
    name: 'IndiaMART',
    type: 'B2B Marketplace',
    baseUrl: 'https://www.indiamart.com',
    apiEndpoint: 'https://api.indiamart.com',
    features: ['local suppliers', 'fast shipping', 'verified suppliers'],
    markup: 1.3, // 30% markup
    shippingTime: '3-7 days',
    minOrder: 5,
    categories: ['apparel', 'electronics', 'home goods', 'beauty']
  },
  
  vfulfil: {
    name: 'VFulfil',
    type: 'Dropshipping Platform',
    baseUrl: 'https://www.vfulfil.com',
    apiEndpoint: 'https://api.vfulfil.com',
    features: ['automated fulfillment', 'curated products', 'easy integration'],
    markup: 1.5, // 50% markup
    shippingTime: '7-15 days',
    minOrder: 1,
    categories: ['electronics', 'apparel', 'home goods', 'accessories']
  }
};

// Sample products from each platform
const platformProducts = [
  // TradeIndia products
  {
    name: 'Premium Cotton Bed Sheets Set',
    description: 'High-quality cotton bed sheets set with premium finish. Perfect for comfortable sleep and home decor.',
    shortDescription: 'Premium cotton bed sheets set',
    category: 'home-goods',
    brand: 'CottonLux',
    platform: 'tradeindia',
    platformPrice: 800, // What you pay TradeIndia
    yourPrice: 1120, // What you sell for (40% markup)
    images: [
      {
        url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop',
        alt: 'Premium Cotton Bed Sheets',
        isPrimary: true
      }
    ],
    variants: [
      {
        name: 'Size',
        value: 'Single',
        price: 1120,
        stock: 999,
        sku: 'BEDSHEET-SINGLE-TI001'
      },
      {
        name: 'Size',
        value: 'Double',
        price: 1400,
        stock: 999,
        sku: 'BEDSHEET-DOUBLE-TI001'
      }
    ],
    basePrice: 1120,
    salePrice: 999,
    isOnSale: true,
    isNewArrival: true,
    isFeatured: true,
    tags: ['cotton', 'bed sheets', 'home', 'premium'],
    dimensions: { unit: 'cm' },
    materials: ['cotton'],
    colors: ['white', 'cream', 'blue'],
    rating: { average: 4.4, count: 0 },
    stock: 999,
    isActive: true,
    seo: { keywords: ['cotton', 'bed sheets', 'home'] },
    reviews: [],
    platformInfo: {
      name: 'TradeIndia',
      supplierPrice: 800,
      shippingTime: '5-10 days',
      minOrder: 10,
      profitMargin: 40
    }
  },
  
  // IndiaMART products
  {
    name: 'Smart LED Bulb Set',
    description: 'Energy-efficient smart LED bulbs with WiFi connectivity. Control brightness and color from your smartphone.',
    shortDescription: 'Smart LED bulbs with WiFi control',
    category: 'tech-accessories',
    brand: 'SmartLight',
    platform: 'indiamart',
    platformPrice: 300,
    yourPrice: 390,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop',
        alt: 'Smart LED Bulb Set',
        isPrimary: true
      }
    ],
    variants: [
      {
        name: 'Pack Size',
        value: '2 Pack',
        price: 390,
        stock: 999,
        sku: 'LED-2PACK-IM001'
      },
      {
        name: 'Pack Size',
        value: '4 Pack',
        price: 720,
        stock: 999,
        sku: 'LED-4PACK-IM001'
      }
    ],
    basePrice: 390,
    salePrice: 350,
    isOnSale: true,
    isNewArrival: true,
    isFeatured: true,
    tags: ['smart', 'LED', 'WiFi', 'energy efficient'],
    dimensions: { unit: 'cm' },
    materials: ['plastic', 'LED'],
    colors: ['white', 'warm white'],
    rating: { average: 4.2, count: 0 },
    stock: 999,
    isActive: true,
    seo: { keywords: ['smart', 'LED', 'bulb'] },
    reviews: [],
    platformInfo: {
      name: 'IndiaMART',
      supplierPrice: 300,
      shippingTime: '3-7 days',
      minOrder: 5,
      profitMargin: 30
    }
  },
  
  // VFulfil products
  {
    name: 'Wireless Phone Charger',
    description: 'Fast wireless charging pad compatible with all Qi-enabled devices. Sleek design with LED indicator.',
    shortDescription: 'Fast wireless charging pad',
    category: 'tech-accessories',
    brand: 'ChargePro',
    platform: 'vfulfil',
    platformPrice: 600,
    yourPrice: 900,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1609091839311-d5365fcc4a0b?w=500&h=500&fit=crop',
        alt: 'Wireless Phone Charger',
        isPrimary: true
      }
    ],
    variants: [
      {
        name: 'Color',
        value: 'Black',
        price: 900,
        stock: 999,
        sku: 'CHARGER-BLACK-VF001'
      },
      {
        name: 'Color',
        value: 'White',
        price: 900,
        stock: 999,
        sku: 'CHARGER-WHITE-VF001'
      }
    ],
    basePrice: 900,
    salePrice: 799,
    isOnSale: true,
    isNewArrival: true,
    isFeatured: true,
    tags: ['wireless', 'charger', 'fast charging', 'Qi'],
    dimensions: { unit: 'cm' },
    materials: ['plastic', 'metal'],
    colors: ['black', 'white'],
    rating: { average: 4.3, count: 0 },
    stock: 999,
    isActive: true,
    seo: { keywords: ['wireless', 'charger', 'phone'] },
    reviews: [],
    platformInfo: {
      name: 'VFulfil',
      supplierPrice: 600,
      shippingTime: '7-15 days',
      minOrder: 1,
      profitMargin: 50
    }
  }
];

async function addPlatformProducts() {
  try {
    console.log('🚀 Adding Products from Your Selected Platforms');
    console.log('================================================');
    console.log('Platforms: TradeIndia, IndiaMART, VFulfil');
    console.log('');
    
    const products = await Product.insertMany(platformProducts);
    
    console.log(`✅ Successfully added ${products.length} products from your platforms!`);
    console.log('\n📦 Product Details:');
    console.log('==================');
    
    products.forEach((product, index) => {
      const profit = product.basePrice - product.platformInfo.supplierPrice;
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   Platform: ${product.platformInfo.name}`);
      console.log(`   Category: ${product.category}`);
      console.log(`   Platform Price: ₹${product.platformInfo.supplierPrice}`);
      console.log(`   Your Price: ₹${product.basePrice}`);
      console.log(`   Sale Price: ₹${product.salePrice}`);
      console.log(`   Profit: ₹${profit} (${product.platformInfo.profitMargin}% margin)`);
      console.log(`   Shipping: ${product.platformInfo.shippingTime}`);
      console.log(`   Min Order: ${product.platformInfo.minOrder} units`);
    });
    
    console.log('\n💰 Platform Comparison:');
    console.log('======================');
    console.log('TradeIndia: 40% markup, 5-10 days shipping, min 10 units');
    console.log('IndiaMART:  30% markup, 3-7 days shipping, min 5 units');
    console.log('VFulfil:   50% markup, 7-15 days shipping, min 1 unit');
    
    console.log('\n🎯 Next Steps:');
    console.log('==============');
    console.log('1. Create accounts on TradeIndia, IndiaMART, VFulfil');
    console.log('2. Browse products and contact suppliers');
    console.log('3. Negotiate better prices for bulk orders');
    console.log('4. Set up automated order processing');
    console.log('5. Test order flow with sample products');
    
    console.log('\n🌐 Your Store URLs:');
    console.log('==================');
    console.log('Frontend: http://localhost:5173');
    console.log('Products: http://localhost:5173/products');
    console.log('Database: http://localhost:5001/api/db');
    
  } catch (error) {
    console.error('❌ Error adding platform products:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Export functions
module.exports = {
  addPlatformProducts,
  platformConfig
};

// Run if called directly
if (require.main === module) {
  addPlatformProducts();
}
