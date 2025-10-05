# 🚀 Shopify Integration Implementation Guide

## 📋 **Step-by-Step Implementation**

### **Step 1: Set up Shopify Store**

1. **Create Shopify Account**

   ```bash
   # Go to shopify.com and sign up
   # Choose Basic plan ($29/month)
   # Set up your store URL: your-store.myshopify.com
   ```

2. **Add Products to Shopify**
   - Go to Products > Add product
   - Upload product images
   - Set prices and variants
   - Add tags like "featured", "new", "apparel", etc.

### **Step 2: Configure Storefront API**

1. **Create Private App**

   ```bash
   # In Shopify Admin:
   # Settings > Apps and sales channels > Develop apps > Create an app
   # Name: "sastabazar-storefront"
   # Configure Storefront API permissions:
   # - Read products
   # - Read product variants
   # - Read collections
   # - Read checkout
   # - Write checkout
   ```

2. **Get API Credentials**
   ```bash
   # Copy these from your app:
   # Store URL: your-store.myshopify.com
   # Storefront Access Token: shpat_xxxxxxxxxxxxxxxxxxxx
   ```

### **Step 3: Install Shopify SDK**

```bash
# Install the Shopify Buy SDK
npm install shopify-buy
```

### **Step 4: Set Environment Variables**

```bash
# Create .env file in client directory
REACT_APP_SHOPIFY_STORE_URL=your-store.myshopify.com
REACT_APP_SHOPIFY_STOREFRONT_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxx
```

### **Step 5: Update Products Page**

```javascript
// client/src/pages/Products.jsx
import { useEffect, useState } from "react";
import { shopifyService } from "../services/shopify";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          shopifyService.getProducts(),
          shopifyService.getCategories(),
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Rest of your component remains the same
};
```

### **Step 6: Update Cart Context**

```javascript
// client/src/context/CartContext.jsx
import { shopifyService } from "../services/shopify";

const CartProvider = ({ children }) => {
  const [checkout, setCheckout] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initialize checkout
  useEffect(() => {
    const initCheckout = async () => {
      const existingCheckout = localStorage.getItem("shopify_checkout_id");
      if (existingCheckout) {
        const checkoutData = await shopifyService.getCheckout(existingCheckout);
        if (checkoutData) {
          setCheckout(checkoutData);
          return;
        }
      }
      const newCheckout = await shopifyService.createCheckout();
      if (newCheckout) {
        setCheckout(newCheckout);
        localStorage.setItem("shopify_checkout_id", newCheckout.id);
      }
    };
    initCheckout();
  }, []);

  // Add to cart
  const addToCart = async (product, variant, quantity = 1) => {
    if (!checkout) return;

    setLoading(true);
    try {
      const updatedCheckout = await shopifyService.addToCart(
        checkout.id,
        variant.id,
        quantity,
      );
      if (updatedCheckout) {
        setCheckout(updatedCheckout);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setLoading(false);
    }
  };

  // Rest of your cart operations...
};
```

### **Step 7: Update Home Page**

```javascript
// client/src/pages/Home.jsx
import { useEffect, useState } from "react";
import { shopifyService } from "../services/shopify";

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featured, newProducts] = await Promise.all([
          shopifyService.getFeaturedProducts(),
          shopifyService.getNewArrivals(),
        ]);
        setFeaturedProducts(featured);
        setNewArrivals(newProducts);
      } catch (error) {
        console.error("Error fetching home data:", error);
      }
    };
    fetchData();
  }, []);

  // Rest of your component...
};
```

---

## 🔧 **Testing the Integration**

### **1. Test Product Fetching**

```bash
# Start your development server
npm run dev

# Visit: http://localhost:5173/products
# You should see your Shopify products
```

### **2. Test Cart Operations**

```bash
# Try adding products to cart
# Check if checkout is created
# Verify cart updates work
```

### **3. Test Checkout Process**

```bash
# Add items to cart
# Go to checkout
# Test Shopify's checkout flow
```

---

## 🎯 **Benefits You'll Get**

✅ **Professional Product Management** - Use Shopify's admin  
✅ **Secure Payment Processing** - Shopify handles payments  
✅ **Inventory Management** - Automatic stock tracking  
✅ **Order Management** - Complete order lifecycle  
✅ **Analytics & Reports** - Built-in Shopify analytics  
✅ **Mobile App** - Shopify mobile app for management  
✅ **Customer Support** - Shopify's 24/7 support

---

## 💰 **Cost Breakdown**

- **Shopify Basic**: $29/month
- **Transaction Fees**: 2.9% + 30¢ per transaction
- **Domain**: $14/year (optional)
- **Total**: ~$30-50/month depending on sales

---

## 🚀 **Next Steps After Integration**

1. **Customize Product Tags**
   - Add "featured" tag to highlight products
   - Add "new" tag for new arrivals
   - Use category tags for filtering

2. **Set up Payment Methods**
   - Configure credit card payments
   - Set up PayPal (if needed)
   - Configure shipping rates

3. **Optimize for SEO**
   - Add meta descriptions
   - Optimize product titles
   - Add structured data

4. **Analytics Setup**
   - Connect Google Analytics
   - Set up Facebook Pixel
   - Configure conversion tracking

---

## 🔗 **Useful Resources**

- [Shopify Storefront API Docs](https://shopify.dev/docs/storefront-api)
- [Shopify Buy SDK](https://shopify.github.io/js-buy-sdk/)
- [Shopify Partners](https://partners.shopify.com)
- [Shopify Community](https://community.shopify.com)

---

**Your sastabazar website will now be powered by Shopify! 🎉**
