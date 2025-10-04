const mongoose = require('mongoose');
const Product = require('./server/models/Product');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/sastabazar', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Sample products to add
const newProducts = [
  {
    name: "Wireless Bluetooth Headphones",
    description: "Premium wireless headphones with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.",
    shortDescription: "Premium wireless headphones with noise cancellation",
    category: "tech-accessories",
    brand: "sastabazar",
    basePrice: 2499,
    salePrice: 1999,
    isOnSale: true,
    isNewArrival: true,
    isFeatured: true,
    tags: ["wireless", "bluetooth", "noise-cancellation", "premium"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop",
        alt: "Wireless Bluetooth Headphones",
        isPrimary: true
      }
    ],
    stock: 50,
    sku: "WBH-001"
  },
  {
    name: "Smart Fitness Watch",
    description: "Advanced fitness tracking with heart rate monitoring, GPS, and 7-day battery life. Perfect for athletes and fitness enthusiasts.",
    shortDescription: "Advanced fitness tracking smartwatch",
    category: "tech-accessories",
    brand: "sastabazar",
    basePrice: 8999,
    salePrice: 7499,
    isOnSale: true,
    isNewArrival: false,
    isFeatured: true,
    tags: ["fitness", "smartwatch", "gps", "heart-rate"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop",
        alt: "Smart Fitness Watch",
        isPrimary: true
      }
    ],
    stock: 25,
    sku: "SFW-002"
  },
  {
    name: "Organic Cotton Bedding Set",
    description: "Luxurious 100% organic cotton bedding set with pillowcases, fitted sheet, and duvet cover. Available in multiple colors.",
    shortDescription: "Luxurious organic cotton bedding set",
    category: "home-goods",
    brand: "sastabazar",
    basePrice: 3999,
    salePrice: 2999,
    isOnSale: true,
    isNewArrival: false,
    isFeatured: false,
    tags: ["organic", "cotton", "bedding", "luxury"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop",
        alt: "Organic Cotton Bedding Set",
        isPrimary: true
      }
    ],
    stock: 30,
    sku: "OCB-003"
  },
  {
    name: "Stainless Steel Water Bottle",
    description: "Insulated stainless steel water bottle that keeps drinks cold for 24 hours or hot for 12 hours. BPA-free and eco-friendly.",
    shortDescription: "Insulated stainless steel water bottle",
    category: "home-goods",
    brand: "sastabazar",
    basePrice: 1299,
    salePrice: 999,
    isOnSale: true,
    isNewArrival: true,
    isFeatured: false,
    tags: ["stainless-steel", "insulated", "eco-friendly", "bpa-free"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&h=500&fit=crop",
        alt: "Stainless Steel Water Bottle",
        isPrimary: true
      }
    ],
    stock: 75,
    sku: "SSB-004"
  },
  {
    name: "Leather Crossbody Bag",
    description: "Handcrafted genuine leather crossbody bag with multiple compartments. Perfect for daily use and travel.",
    shortDescription: "Handcrafted genuine leather crossbody bag",
    category: "apparel",
    brand: "sastabazar",
    basePrice: 4599,
    salePrice: 3599,
    isOnSale: true,
    isNewArrival: false,
    isFeatured: true,
    tags: ["leather", "crossbody", "handcrafted", "travel"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1553062407-98e1b64c6a62?w=500&h=500&fit=crop",
        alt: "Leather Crossbody Bag",
        isPrimary: true
      }
    ],
    stock: 20,
    sku: "LCB-005"
  }
];

async function addProducts() {
  try {
    console.log('🔄 Adding products to sastabazar database...');
    
    for (const productData of newProducts) {
      const product = new Product(productData);
      await product.save();
      console.log(`✅ Added: ${productData.name} - ₹${productData.salePrice}`);
    }
    
    console.log(`\n🎉 Successfully added ${newProducts.length} products!`);
    
    // Show current product count
    const totalProducts = await Product.countDocuments();
    console.log(`📊 Total products in database: ${totalProducts}`);
    
  } catch (error) {
    console.error('❌ Error adding products:', error.message);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed.');
  }
}

addProducts();
