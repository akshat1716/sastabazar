# 🛍️ sastabazar - Quick Start Guide

## 🚀 How to Add Products and Customize Your Website

### 1. **Add Sample Products** (Easiest Method)
```bash
# Run this command to add 8 sample products across all categories
node scripts/populate-products.js
```

### 2. **Start Your Website**
```bash
# Start both frontend and backend servers
npm run dev
```

### 3. **Access Your Website**
- **Frontend**: http://localhost:5173 (or 5174/5175 if busy)
- **Backend API**: http://localhost:5000
- **Products Page**: http://localhost:5173/products

---

## 📦 What You Get with Sample Products

### **Apparel Category** 👕
- Premium Cotton T-Shirt (₹1,299)
- Designer Denim Jacket (₹3,499)

### **Home Goods Category** 🏠
- Minimalist Ceramic Vase (₹899)
- Premium Bedding Set (₹2,499)

### **Tech Accessories Category** 💻
- Wireless Bluetooth Headphones (₹3,999)
- Minimalist Phone Stand (₹599)

### **Art & Prints Category** 🎨
- Abstract Art Print (₹1,299)
- Minimalist Photography Print (₹899)

---

## 🎨 Customization Options

### **1. Change Product Images**
- Replace image URLs in `sample-products.js`
- Use your own product photos
- Recommended size: 500x500px minimum

### **2. Modify Product Details**
- Edit product names, descriptions, prices
- Update categories and tags
- Change variants (sizes, colors)

### **3. Add New Categories**
- Update categories array in `client/src/pages/Products.jsx`
- Add category cards in `client/src/pages/Home.jsx`
- Create products for new categories

### **4. Customize Styling**
- Colors: Edit `client/tailwind.config.js`
- Fonts: Modify `client/src/index.css`
- Layout: Update component files

---

## 🔧 Quick Commands

```bash
# Add products to database
node scripts/populate-products.js

# Start development servers
npm run dev

# Build for production
npm run build

# Fix port issues
lsof -ti:5000 | xargs kill -9
```

---

## 📱 Website Features

✅ **Responsive Design** - Works on all devices  
✅ **Category Filtering** - Filter by product type  
✅ **Search Function** - Find products quickly  
✅ **Shopping Cart** - Add/remove items  
✅ **Product Details** - View full product info  
✅ **AI Chatbot** - Shopping assistant  
✅ **Modern UI** - Clean, minimalist design  

---

## 🎯 Next Steps

1. **Add your own products** by editing `sample-products.js`
2. **Customize the homepage** in `client/src/pages/Home.jsx`
3. **Modify the styling** in `client/tailwind.config.js`
4. **Add more pages** as needed
5. **Deploy to production** when ready

---

**Your sastabazar store is ready! 🎉** 