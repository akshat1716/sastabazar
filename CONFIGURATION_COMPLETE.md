# 🚀 sastabazar Production Configuration Guide

## ✅ **Configuration Complete!**

Your sastabazar e-commerce website is now properly configured for production deployment. Here's what has been implemented:

## 📁 **Files Created/Updated**

### **Environment Configuration**
- ✅ **`.env`** - Production-ready environment file with all required variables
- ✅ **`client/.env`** - Client-side environment configuration
- ✅ **`.gitignore`** - Ensures `.env` files are not committed to version control
- ✅ **`server/config/index.js`** - Centralized configuration management

### **Port Configuration Fixed**
- ✅ **`server/index.js`** - Updated to use PORT from environment
- ✅ **`client/vite.config.js`** - Proxy target updated to port 5001
- ✅ **`client/src/utils/api.js`** - API base URL updated with environment switching
- ✅ **`server/routes/payments.js`** - Updated to use centralized config
- ✅ **`server/middleware/auth.js`** - Updated to use centralized config
- ✅ **`server/routes/auth.js`** - Updated to use centralized config

## 🔧 **Environment Variables**

### **Required Variables (Must be set)**
```env
MONGODB_URI=mongodb://localhost:27017/sastabazar
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-long-and-random
```

### **Server Configuration**
```env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5001
```

### **CORS Configuration**
```env
CORS_ORIGIN=http://localhost:5173
```

### **Payment Configuration**
```env
# Razorpay
RAZORPAY_KEY_ID=rzp_test_your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here
```

### **Client Environment Variables**
```env
VITE_SERVER_URL=http://localhost:5001
VITE_RAZORPAY_KEY_ID=rzp_test_your_razorpay_key_id_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

## 🛡️ **Security Features Implemented**

### **Environment Validation**
- ✅ Server startup validates all required environment variables
- ✅ Missing variables cause immediate exit with clear error messages
- ✅ Production-specific validation for additional required variables

### **CORS Configuration**
- ✅ Development: Allows localhost:5173, localhost:5174, localhost:3000
- ✅ Production: Restricted to CORS_ORIGIN environment variable
- ✅ No wildcard CORS for security

### **Configuration Management**
- ✅ Centralized config object in `server/config/index.js`
- ✅ All hardcoded values replaced with environment variables
- ✅ Environment-specific settings (development vs production)

## 🚀 **How to Deploy**

### **1. Development Setup**
```bash
# Install dependencies
npm run install-all

# Start development servers
npm run dev
```

### **2. Production Setup**

#### **Step 1: Update Environment Variables**
```bash
# Edit .env file with production values
nano .env
```

**Required changes for production:**
- Set `NODE_ENV=production`
- Set `MONGODB_URI` to your production MongoDB Atlas connection string
- Set `JWT_SECRET` to a strong, random secret key
- Set `CORS_ORIGIN` to your production domain (e.g., `https://sastabazar.com`)
- Set `CLIENT_URL` and `SERVER_URL` to your production URLs
- Add real Razorpay/Stripe API keys

#### **Step 2: Build and Start**
```bash
# Build frontend
npm run build

# Start production server
npm start
```

### **3. Environment Variable Examples**

#### **Development (.env)**
```env
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/sastabazar
JWT_SECRET=dev-secret-key-change-in-production
CORS_ORIGIN=http://localhost:5173
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5001
```

#### **Production (.env)**
```env
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sastabazar
JWT_SECRET=super-long-random-production-secret-key-here
CORS_ORIGIN=https://sastabazar.com
CLIENT_URL=https://sastabazar.com
SERVER_URL=https://api.sastabazar.com
```

## 🔍 **Configuration Features**

### **Automatic Environment Detection**
- Development: Uses localhost URLs and relaxed CORS
- Production: Uses environment-provided URLs and strict CORS

### **API Base URL Switching**
- Development: `http://localhost:5001/api`
- Production: `${VITE_SERVER_URL}/api` or fallback to configured domain

### **Payment Gateway Integration**
- Razorpay: Configured with environment variables
- Stripe: Configured with environment variables
- Both gateways initialize only when keys are provided

### **Database Configuration**
- MongoDB connection string from environment
- Automatic connection with error handling
- Database name: `sastabazar`

## 🧪 **Testing Configuration**

### **Test Server Startup**
```bash
node server/index.js
```

**Expected output:**
```
✅ Environment variables validated successfully
DEBUG: Shopify Domain Loaded = your-shopify-store.myshopify.com
✅ Razorpay initialized with provided keys.
✅ Connected to MongoDB
🚀 sastabazar server running on port 5001
📱 Environment: development
```

### **Test API Health**
```bash
curl http://localhost:5001/api/health
```

**Expected response:**
```json
{
  "status": "OK",
  "message": "API is running",
  "service": "sastabazar",
  "timestamp": "2025-09-08T11:13:20.728Z"
}
```

## 🚨 **Common Issues & Solutions**

### **Port 5000 Already in Use**
- **Issue**: Port 5000 is used by Apple AirTunes on macOS
- **Solution**: Configuration now uses port 5001 by default

### **Missing Environment Variables**
- **Issue**: Server exits with validation error
- **Solution**: Check `.env` file exists and contains required variables

### **CORS Errors**
- **Issue**: Frontend can't connect to API
- **Solution**: Ensure `CORS_ORIGIN` matches your frontend URL

### **MongoDB Connection Failed**
- **Issue**: Database connection error
- **Solution**: Check `MONGODB_URI` is correct and MongoDB is running

## 📋 **Next Steps for Going Live**

1. **Set up MongoDB Atlas** (cloud database)
2. **Get Razorpay API keys** from Razorpay dashboard
3. **Get Stripe API keys** from Stripe dashboard (if using Stripe)
4. **Choose hosting platform** (Vercel, Netlify, AWS, etc.)
5. **Update production environment variables**
6. **Deploy and test**

## 🎉 **Configuration Complete!**

Your sastabazar e-commerce website is now properly configured with:
- ✅ Environment variable management
- ✅ Port configuration fixed
- ✅ CORS properly configured
- ✅ Security validation
- ✅ Production-ready setup
- ✅ Payment gateway integration ready

The website is ready for deployment once you add your production API keys and database connection!


