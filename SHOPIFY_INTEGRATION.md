# 🛍️ Shopify Integration Guide for sastabazar

## 📋 Integration Options

### **Option 1: Shopify Storefront API (Recommended)**
- Keep your custom frontend design
- Use Shopify as the backend for products, orders, payments
- Best for: Custom design with Shopify's reliability

### **Option 2: Shopify Headless Commerce**
- Use Shopify's admin for product management
- Custom frontend with Shopify's APIs
- Best for: Full control with Shopify's infrastructure

### **Option 3: Shopify App Development**
- Create a Shopify app that integrates with your site
- Best for: Advanced integrations and custom features

---

## 🚀 Option 1: Shopify Storefront API Integration

### **Step 1: Set up Shopify Storefront API**

1. **Create a Shopify Partner Account**
   - Go to [partners.shopify.com](https://partners.shopify.com)
   - Create a partner account

2. **Create a Private App**
   ```bash
   # In your Shopify admin:
   # Settings > Apps and sales channels > Develop apps > Create an app
   # Configure Storefront API permissions
   ```

3. **Get API Credentials**
   - Store URL: `your-store.myshopify.com`
   - Storefront Access Token: `your-access-token`

### **Step 2: Install Shopify SDK**

```bash
# Install Shopify JavaScript Buy SDK
npm install shopify-buy
```

### **Step 3: Create Shopify Service**

```javascript
// client/src/services/shopify.js
import Client from 'shopify-buy';

const client = Client.buildClient({
  domain: 'your-store.myshopify.com',
  storefrontAccessToken: 'your-storefront-access-token'
});

export const shopifyService = {
  // Fetch all products
  async getProducts() {
    try {
      const products = await client.product.fetchAll();
      return products.map(product => ({
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.variants[0].price,
        images: product.images.map(img => img.src),
        variants: product.variants.map(variant => ({
          id: variant.id,
          title: variant.title,
          price: variant.price,
          available: variant.available
        })),
        tags: product.tags,
        category: product.productType
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  // Fetch single product
  async getProduct(productId) {
    try {
      const product = await client.product.fetch(productId);
      return {
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.variants[0].price,
        images: product.images.map(img => img.src),
        variants: product.variants.map(variant => ({
          id: variant.id,
          title: variant.title,
          price: variant.price,
          available: variant.available
        })),
        tags: product.tags,
        category: product.productType
      };
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  },

  // Create checkout
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
  }
};
```

### **Step 4: Update Products Page**

```javascript
// client/src/pages/Products.jsx
import { useEffect, useState } from 'react';
import { shopifyService } from '../services/shopify';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const shopifyProducts = await shopifyService.getProducts();
      setProducts(shopifyProducts);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  // Rest of your component code...
};
```

### **Step 5: Update Cart Context**

```javascript
// client/src/context/CartContext.jsx
import { shopifyService } from '../services/shopify';

// Update cart operations to use Shopify
const addToCart = async (product, variant, quantity) => {
  try {
    const checkout = await shopifyService.addToCart(
      currentCheckout.id, 
      variant.id, 
      quantity
    );
    setCurrentCheckout(checkout);
  } catch (error) {
    console.error('Error adding to cart:', error);
  }
};
```

---

## 🔧 Option 2: Headless Shopify Setup

### **Step 1: Configure Shopify for Headless**

1. **Enable Storefront API**
   - Go to Settings > Apps and sales channels
   - Create a private app with Storefront API access

2. **Set up Custom Domain**
   - Point your domain to Shopify
   - Configure DNS settings

3. **Configure Webhooks**
   - Product updates
   - Order creation
   - Inventory changes

### **Step 2: Environment Variables**

```bash
# .env
SHOPIFY_STORE_URL=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-access-token
SHOPIFY_ADMIN_ACCESS_TOKEN=your-admin-token
SHOPIFY_WEBHOOK_SECRET=your-webhook-secret
```

---

## 📱 Option 3: Shopify App Development

### **Create a Shopify App**

```bash
# Install Shopify CLI
npm install -g @shopify/cli @shopify/theme

# Create a new app
shopify app create

# Generate API credentials
shopify app config link
```

### **App Structure**
```
shopify-app/
├── web/
│   ├── frontend/
│   └── backend/
├── extensions/
└── shopify.app.toml
```

---

## 🎯 **Recommended Approach for sastabazar**

### **For Your Current Setup:**
1. **Start with Option 1** (Storefront API)
2. **Keep your current design** and UI
3. **Use Shopify for:**
   - Product management
   - Order processing
   - Payment processing
   - Inventory management

### **Benefits:**
✅ **Keep your custom design**  
✅ **Use Shopify's reliable backend**  
✅ **Easy product management**  
✅ **Built-in payment processing**  
✅ **Inventory and order management**  

---

## 🚀 **Quick Start Steps**

1. **Create Shopify Store**
   - Sign up at [shopify.com](https://shopify.com)
   - Choose a plan (Basic: $29/month)

2. **Set up Storefront API**
   - Create private app
   - Get access token

3. **Update Environment Variables**
   ```bash
   SHOPIFY_STORE_URL=your-store.myshopify.com
   SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-token
   ```

4. **Install Shopify SDK**
   ```bash
   npm install shopify-buy
   ```

5. **Replace API calls**
   - Update products service
   - Update cart operations
   - Test integration

---

## 💰 **Pricing Considerations**

- **Shopify Basic**: $29/month
- **Shopify Standard**: $79/month  
- **Shopify Advanced**: $299/month
- **Transaction fees**: 2.9% + 30¢ per transaction

---

## 🔗 **Next Steps**

1. **Choose your integration approach**
2. **Set up Shopify store**
3. **Configure API credentials**
4. **Update your code**
5. **Test the integration**
6. **Deploy to production**

**Would you like me to help you implement any of these approaches?** 