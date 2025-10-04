// Shopify integration service for sastabazar
// This service handles all Shopify API interactions

import Client from 'shopify-buy';

// Initialize Shopify client
const client = Client.buildClient({
  domain: process.env.REACT_APP_SHOPIFY_STORE_URL || 'your-store.myshopify.com',
  storefrontAccessToken: process.env.REACT_APP_SHOPIFY_STOREFRONT_ACCESS_TOKEN || 'your-access-token'
});

export const shopifyService = {
  // Fetch all products from Shopify
  async getProducts(filters = {}) {
    try {
      let products = await client.product.fetchAll();
      
      // Apply filters
      if (filters.category) {
        products = products.filter(product => 
          product.productType?.toLowerCase() === filters.category.toLowerCase()
        );
      }
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        products = products.filter(product =>
          product.title.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm) ||
          product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      // Transform to match your existing product structure
      return products.map(product => ({
        _id: product.id,
        name: product.title,
        brand: 'sastabazar',
        category: product.productType?.toLowerCase().replace(/\s+/g, '-') || 'other',
        description: product.description,
        price: parseFloat(product.variants[0]?.price || 0),
        originalPrice: parseFloat(product.variants[0]?.compareAtPrice || product.variants[0]?.price || 0),
        images: product.images.map(img => img.src),
        variants: product.variants.map(variant => ({
          id: variant.id,
          name: variant.title,
          price: parseFloat(variant.price),
          originalPrice: parseFloat(variant.compareAtPrice || variant.price),
          stock: variant.available ? 999 : 0, // Shopify doesn't expose exact stock
          available: variant.available
        })),
        stock: product.variants.some(v => v.available) ? 999 : 0,
        rating: 4.5, // Default rating
        reviews: Math.floor(Math.random() * 200) + 50, // Random reviews
        tags: product.tags,
        featured: product.tags.includes('featured'),
        newArrival: product.tags.includes('new'),
        onSale: product.variants.some(v => v.compareAtPrice && v.compareAtPrice > v.price)
      }));
    } catch (error) {
      console.error('Error fetching products from Shopify:', error);
      return [];
    }
  },

  // Fetch single product by ID
  async getProduct(productId) {
    try {
      const product = await client.product.fetch(productId);
      
      return {
        _id: product.id,
        name: product.title,
        brand: 'sastabazar',
        category: product.productType?.toLowerCase().replace(/\s+/g, '-') || 'other',
        description: product.description,
        price: parseFloat(product.variants[0]?.price || 0),
        originalPrice: parseFloat(product.variants[0]?.compareAtPrice || product.variants[0]?.price || 0),
        images: product.images.map(img => img.src),
        variants: product.variants.map(variant => ({
          id: variant.id,
          name: variant.title,
          price: parseFloat(variant.price),
          originalPrice: parseFloat(variant.compareAtPrice || variant.price),
          stock: variant.available ? 999 : 0,
          available: variant.available
        })),
        stock: product.variants.some(v => v.available) ? 999 : 0,
        rating: 4.5,
        reviews: Math.floor(Math.random() * 200) + 50,
        tags: product.tags,
        featured: product.tags.includes('featured'),
        newArrival: product.tags.includes('new'),
        onSale: product.variants.some(v => v.compareAtPrice && v.compareAtPrice > v.price)
      };
    } catch (error) {
      console.error('Error fetching product from Shopify:', error);
      return null;
    }
  },

  // Get product categories
  async getCategories() {
    try {
      const products = await client.product.fetchAll();
      const categories = [...new Set(products.map(p => p.productType).filter(Boolean))];
      
      return categories.map(category => ({
        id: category.toLowerCase().replace(/\s+/g, '-'),
        name: category,
        icon: this.getCategoryIcon(category)
      }));
    } catch (error) {
      console.error('Error fetching categories from Shopify:', error);
      return [];
    }
  },

  // Get featured products
  async getFeaturedProducts() {
    try {
      const products = await client.product.fetchAll();
      return products
        .filter(product => product.tags.includes('featured'))
        .slice(0, 8)
        .map(product => this.transformProduct(product));
    } catch (error) {
      console.error('Error fetching featured products from Shopify:', error);
      return [];
    }
  },

  // Get new arrivals
  async getNewArrivals() {
    try {
      const products = await client.product.fetchAll();
      return products
        .filter(product => product.tags.includes('new'))
        .slice(0, 8)
        .map(product => this.transformProduct(product));
    } catch (error) {
      console.error('Error fetching new arrivals from Shopify:', error);
      return [];
    }
  },

  // Create a new checkout
  async createCheckout() {
    try {
      const checkout = await client.checkout.create();
      return checkout;
    } catch (error) {
      console.error('Error creating checkout:', error);
      return null;
    }
  },

  // Add items to cart
  async addToCart(checkoutId, variantId, quantity = 1) {
    try {
      const checkout = await client.checkout.addLineItems(checkoutId, [{
        variantId,
        quantity
      }]);
      return checkout;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return null;
    }
  },

  // Update cart item quantity
  async updateCartItem(checkoutId, lineItemId, quantity) {
    try {
      const checkout = await client.checkout.updateLineItems(checkoutId, [{
        id: lineItemId,
        quantity
      }]);
      return checkout;
    } catch (error) {
      console.error('Error updating cart item:', error);
      return null;
    }
  },

  // Remove item from cart
  async removeFromCart(checkoutId, lineItemId) {
    try {
      const checkout = await client.checkout.removeLineItems(checkoutId, [lineItemId]);
      return checkout;
    } catch (error) {
      console.error('Error removing from cart:', error);
      return null;
    }
  },

  // Get checkout by ID
  async getCheckout(checkoutId) {
    try {
      const checkout = await client.checkout.fetch(checkoutId);
      return checkout;
    } catch (error) {
      console.error('Error fetching checkout:', error);
      return null;
    }
  },

  // Helper function to transform product data
  transformProduct(product) {
    return {
      _id: product.id,
      name: product.title,
      brand: 'sastabazar',
      category: product.productType?.toLowerCase().replace(/\s+/g, '-') || 'other',
      description: product.description,
      price: parseFloat(product.variants[0]?.price || 0),
      originalPrice: parseFloat(product.variants[0]?.compareAtPrice || product.variants[0]?.price || 0),
      images: product.images.map(img => img.src),
      variants: product.variants.map(variant => ({
        id: variant.id,
        name: variant.title,
        price: parseFloat(variant.price),
        originalPrice: parseFloat(variant.compareAtPrice || variant.price),
        stock: variant.available ? 999 : 0,
        available: variant.available
      })),
      stock: product.variants.some(v => v.available) ? 999 : 0,
      rating: 4.5,
      reviews: Math.floor(Math.random() * 200) + 50,
      tags: product.tags,
      featured: product.tags.includes('featured'),
      newArrival: product.tags.includes('new'),
      onSale: product.variants.some(v => v.compareAtPrice && v.compareAtPrice > v.price)
    };
  },

  // Helper function to get category icons
  getCategoryIcon(category) {
    const iconMap = {
      'Apparel': '👕',
      'Home Goods': '🏠',
      'Tech Accessories': '💻',
      'Art & Prints': '🎨',
      'Beauty': '💄',
      'Sports': '⚽',
      'Books': '📚',
      'Food': '🍎'
    };
    return iconMap[category] || '🛍️';
  }
};

export default shopifyService; 