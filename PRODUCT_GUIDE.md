# 🛍️ sastabazar Product Management Guide

## How to Add Products to Your Store

### Method 1: Interactive Script (Recommended)

```bash
node add-my-product.js
```

This will ask you questions and create a product step by step.

### Method 2: Database Viewer

1. Open: http://localhost:5001/api/db
2. Click "View Products" to see current products
3. Use MongoDB commands to add products directly

### Method 3: Direct MongoDB Commands

```bash
mongosh sastabazar
```

## Valid Categories

- `apparel` - Clothing, shoes, accessories
- `home-goods` - Furniture, decor, kitchen items
- `tech-accessories` - Electronics, gadgets, tech items
- `art-prints` - Artwork, prints, decorative items

## Product Structure

Each product needs:

- **name**: Product title
- **description**: Detailed description
- **shortDescription**: Brief description for cards
- **category**: One of the valid categories above
- **brand**: Brand name (default: sastabazar)
- **basePrice**: Regular price in ₹
- **salePrice**: Sale price (optional)
- **stock**: Available quantity
- **images**: Array of image URLs
- **tags**: Array of search tags

## Example Product

```javascript
{
  name: "Premium Cotton T-Shirt",
  description: "Ultra-soft premium cotton t-shirt...",
  shortDescription: "Premium cotton t-shirt",
  category: "apparel",
  brand: "sastabazar",
  basePrice: 1299,
  salePrice: 999,
  stock: 50,
  images: [{
    url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
    alt: "Premium Cotton T-Shirt",
    isPrimary: true
  }],
  tags: ["cotton", "premium", "minimalist"]
}
```

## Quick Commands

- **List products**: `node add-product.js`
- **Add product**: `node add-my-product.js`
- **View database**: http://localhost:5001/api/db
- **View website**: http://localhost:5173

## Tips

1. Use high-quality images from Unsplash or your own photos
2. Write compelling descriptions that highlight benefits
3. Use relevant tags for better searchability
4. Set competitive prices
5. Keep stock levels updated
