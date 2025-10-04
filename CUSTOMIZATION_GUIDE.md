# 🛍️ sastabazar - Website Customization Guide

## 📋 Table of Contents
1. [Adding Products](#adding-products)
2. [Customizing Pages](#customizing-pages)
3. [Managing Categories](#managing-categories)
4. [Styling & Branding](#styling--branding)
5. [Content Management](#content-management)

---

## 🎯 Adding Products

### Method 1: Using the Sample Data Script (Recommended)
```bash
# 1. Make sure MongoDB is running
# 2. Run the population script
node scripts/populate-products.js
```

### Method 2: Manual Product Addition
You can add products directly to your MongoDB database or create an admin interface.

### Product Structure
```javascript
{
  name: "Product Name",
  brand: "sastabazar",
  category: "apparel|home-goods|tech-accessories|art-prints",
  description: "Detailed product description",
  price: 1299, // Current price in INR
  originalPrice: 1599, // Original price for sale display
  images: ["image-url-1", "image-url-2"],
  variants: [
    { name: "Size", options: ["S", "M", "L", "XL"] },
    { name: "Color", options: ["Black", "White"] }
  ],
  stock: 50,
  rating: 4.5,
  reviews: 128,
  tags: ["tag1", "tag2"],
  featured: true, // Shows on homepage
  newArrival: false, // Shows in new arrivals
  onSale: true // Shows sale badge
}
```

---

## 🎨 Customizing Pages

### 1. Homepage (`client/src/pages/Home.jsx`)
- **Hero Section**: Change background image, text, and call-to-action
- **Categories**: Modify category cards and links
- **Featured Products**: Control which products appear
- **Newsletter**: Customize subscription form

### 2. Products Page (`client/src/pages/Products.jsx`)
- **Filtering**: Add more filter options (price range, brand, etc.)
- **Sorting**: Add sort by price, popularity, newest
- **Layout**: Modify grid/list view options
- **Pagination**: Add pagination for large product catalogs

### 3. Product Detail Page (`client/src/pages/ProductDetail.jsx`)
- **Image Gallery**: Add zoom, carousel, or video features
- **Variants**: Customize size/color selection
- **Reviews**: Add review system
- **Related Products**: Show similar items

### 4. Cart Page (`client/src/pages/Cart.jsx`)
- **Cart Items**: Modify item display
- **Checkout Process**: Add shipping options, payment methods
- **Order Summary**: Customize pricing breakdown

---

## 📂 Managing Categories

### Current Categories:
1. **Apparel** (`apparel`)
   - Clothing, accessories, footwear
   
2. **Home Goods** (`home-goods`)
   - Furniture, decor, kitchen items
   
3. **Tech Accessories** (`tech-accessories`)
   - Electronics, gadgets, accessories
   
4. **Art & Prints** (`art-prints`)
   - Artwork, prints, posters

### Adding New Categories:
1. Update `client/src/pages/Products.jsx` - add to categories array
2. Update `client/src/pages/Home.jsx` - add category cards
3. Add sample products for the new category

---

## 🎨 Styling & Branding

### Color Scheme (Tailwind CSS)
```css
/* Primary Colors */
aura-900: #171717 (Dark Gray/Black)
aura-800: #262626
aura-600: #525252
aura-400: #a3a3a3
aura-200: #e5e5e5
aura-100: #f5f5f5
```

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700
- **Headings**: Bold, large sizes
- **Body**: Regular weight, readable sizes

### Customization Files:
- `client/tailwind.config.js` - Color palette, fonts, animations
- `client/src/index.css` - Custom components, utilities
- `client/src/components/` - Reusable UI components

---

## 📝 Content Management

### 1. Product Images
- **Recommended Size**: 500x500px minimum
- **Format**: JPG, PNG, WebP
- **Hosting**: Use CDN or cloud storage (AWS S3, Cloudinary)
- **Optimization**: Compress images for faster loading

### 2. Product Descriptions
- **Length**: 100-200 words
- **Tone**: Premium, minimalist, lifestyle-focused
- **Keywords**: Include relevant search terms
- **Features**: Highlight key benefits and specifications

### 3. SEO Optimization
- **Meta Tags**: Title, description, keywords
- **URL Structure**: Clean, descriptive URLs
- **Image Alt Text**: Descriptive alt attributes
- **Schema Markup**: Product schema for search engines

---

## 🚀 Quick Start Commands

```bash
# Start the development servers
npm run dev

# Add sample products to database
node scripts/populate-products.js

# Build for production
npm run build

# Start production server
npm start
```

---

## 📱 Responsive Design

The website is fully responsive with breakpoints:
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Key Responsive Features:
- Mobile-first design approach
- Flexible grid layouts
- Touch-friendly navigation
- Optimized images for all screen sizes

---

## 🔧 Advanced Customization

### 1. Adding New Pages
1. Create new component in `client/src/pages/`
2. Add route in `client/src/App.jsx`
3. Update navigation in `client/src/components/Layout.jsx`

### 2. Custom Components
1. Create in `client/src/components/`
2. Follow existing naming conventions
3. Use Tailwind CSS for styling
4. Add TypeScript types if needed

### 3. API Endpoints
- **Products**: `/api/products`
- **Categories**: `/api/products/categories`
- **Search**: `/api/products?search=query`
- **Filter**: `/api/products?category=apparel`

---

## 🛠️ Troubleshooting

### Common Issues:
1. **Port 5000 in use**: `lsof -ti:5000 | xargs kill -9`
2. **MongoDB connection**: Check connection string in `.env`
3. **Image loading**: Verify image URLs and CORS settings
4. **Build errors**: Clear node_modules and reinstall

### Development Tips:
- Use browser dev tools for debugging
- Check console for errors
- Use React DevTools for component inspection
- Monitor network requests in browser

---

## 📞 Support

For additional help:
1. Check the README.md file
2. Review the code comments
3. Check browser console for errors
4. Verify all environment variables are set

---

**Happy customizing! 🎉** 