const mongoose = require('mongoose');
const Product = require('./server/models/Product');

mongoose.connect('mongodb://localhost:27017/sastabazar', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function addMinimalProducts() {
  try {
    const products = [
      {
        name: '2 in 1 Garlic Peeler Set',
        description: 'Premium stainless steel garlic peeler set with dual functionality. Perfect for mincing and peeling garlic efficiently.',
        shortDescription: 'Premium stainless steel garlic peeler set.',
        category: 'home-goods',
        brand: 'VFulfil',
        images: [
          { url: 'https://images.unsplash.com/photo-1583847268964-dd287de79117?w=500&h=500&fit=crop', alt: '2 in 1 Garlic Peeler Set', isPrimary: true }
        ],
        variants: [{ name: 'Color', value: 'Silver', price: 399, stock: 100, sku: 'GARLIC-PEELER-SILVER-VF001' }],
        basePrice: 399,
        salePrice: 349,
        isOnSale: true,
        isNewArrival: true,
        isFeatured: true,
        tags: ['garlic peeler', 'kitchen', 'stainless steel', 'home goods', 'vfulfil'],
        stock: 100,
        isActive: true,
      },
      {
        name: 'Basic Cotton T-Shirt',
        description: 'Comfortable and stylish basic cotton t-shirt. Perfect for everyday wear.',
        shortDescription: 'Comfortable basic cotton t-shirt.',
        category: 'home-goods',
        brand: 'sastabazar',
        images: [
          { url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop', alt: 'Basic Cotton T-Shirt', isPrimary: true }
        ],
        variants: [{ name: 'Size', value: 'M', price: 299, stock: 50, sku: 'TSHIRT-BASIC-M-SB001' }],
        basePrice: 299,
        salePrice: 249,
        isOnSale: true,
        isNewArrival: false,
        isFeatured: false,
        tags: ['tshirt', 'cotton', 'basic', 'home goods'],
        stock: 50,
        isActive: true,
      },
    ];

    for (const productData of products) {
      const product = new Product(productData);
      await product.save();
      console.log(`✅ Product "${product.name}" added successfully!`);
    }
    console.log('\n🎉 Minimal products added!');
  } catch (error) {
    console.error('❌ Error adding products:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

if (require.main === module) {
  addMinimalProducts();
}
