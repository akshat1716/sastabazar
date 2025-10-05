# 🚀 Production Deployment Guide

## 📋 **Database Configuration Complete**

Your sastabazar e-commerce website now has a robust, production-ready database configuration with MongoDB Atlas support!

## ✅ **What's Been Implemented**

### **1. MongoDB Atlas Integration** 🗄️

- ✅ **Robust Connection Module**: `server/config/database.js` with retry logic
- ✅ **Connection Retry**: Automatic reconnection with exponential backoff
- ✅ **Health Monitoring**: Database health check endpoint `/api/health/db`
- ✅ **Graceful Shutdown**: Proper connection cleanup on app termination
- ✅ **Connection Pooling**: Optimized connection management

### **2. Database Standardization** 📊

- ✅ **Standardized Name**: All references now use `sastabazar` database
- ✅ **Environment Configuration**: MongoDB URI from `.env` file
- ✅ **Production Ready**: Supports MongoDB Atlas connection strings
- ✅ **Index Optimization**: Performance indexes for all collections

### **3. Production Deployment** 🚀

- ✅ **Static File Serving**: Express serves React build in production
- ✅ **PM2 Configuration**: Process management with ecosystem.config.js
- ✅ **Health Endpoints**: `/api/health` and `/api/health/db`
- ✅ **Build Scripts**: Complete build and deployment pipeline

## 🔧 **Database Configuration**

### **Environment Variables**

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sastabazar?retryWrites=true&w=majority

# Alternative: Local MongoDB (for development)
MONGODB_URI=mongodb://localhost:27017/sastabazar
```

### **MongoDB Atlas Setup**

1. **Create Cluster**: Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. **Create Database User**:
   - Username: `sastabazar-user`
   - Password: `strong-password`
   - Database User Privileges: `Read and write to any database`
3. **Whitelist IP**: Add `0.0.0.0/0` for all IPs (or specific IPs)
4. **Get Connection String**: Copy the connection string
5. **Update .env**: Replace `MONGODB_URI` with your Atlas connection string

## 🚀 **Production Deployment Options**

### **Option 1: Monorepo Deployment (Recommended)**

#### **Single Server Deployment**

```bash
# Build the application
npm run build:all

# Start with PM2
npm run start:pm2

# Check status
npm run logs:pm2
```

#### **Deployment Steps**

1. **Server Setup**:

   ```bash
   # Install Node.js and PM2
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

2. **Deploy Application**:

   ```bash
   # Clone repository
   git clone https://github.com/your-username/sastabazar.git
   cd sastabazar

   # Install dependencies
   npm run install-all

   # Run database migration
   npm run migrate

   # Add sample products
   npm run seed

   # Build for production
   npm run build:all

   # Start with PM2
   npm run start:pm2
   ```

3. **Configure Nginx** (Optional):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:5001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### **Option 2: Split Deployment**

#### **Frontend on Vercel/Netlify**

```bash
# Frontend deployment
cd client
npm run build

# Deploy to Vercel
vercel --prod

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

#### **Backend on Render/Railway/AWS**

```bash
# Backend deployment
npm run build:server
npm start
```

#### **Environment Variables for Split Deployment**

```env
# Frontend (.env.production)
VITE_SERVER_URL=https://your-api-domain.com
VITE_RAZORPAY_KEY_ID=rzp_live_your_key_id
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key

# Backend (.env.production)
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://...
CORS_ORIGIN=https://your-frontend-domain.com
```

## 🛠️ **PM2 Process Management**

### **PM2 Commands**

```bash
# Start application
npm run start:pm2

# Stop application
npm run stop:pm2

# Restart application
npm run restart:pm2

# View logs
npm run logs:pm2

# Monitor processes
pm2 monit

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

### **PM2 Ecosystem Features**

- ✅ **Auto-restart**: Restarts on crashes
- ✅ **Memory monitoring**: Restarts if memory exceeds 1GB
- ✅ **Log management**: Separate error and output logs
- ✅ **Health checks**: Built-in health monitoring
- ✅ **Zero-downtime**: Graceful restarts

## 🧪 **Health Monitoring**

### **Health Endpoints**

```bash
# API Health Check
curl http://localhost:5001/api/health

# Database Health Check
curl http://localhost:5001/api/health/db
```

### **Expected Responses**

```json
// API Health
{
  "status": "OK",
  "message": "API is running",
  "service": "sastabazar",
  "timestamp": "2025-09-08T15:30:00.000Z"
}

// Database Health
{
  "status": "healthy",
  "message": "Database connection is healthy",
  "database": "sastabazar",
  "host": "cluster-shard-00-00.xxxxx.mongodb.net",
  "timestamp": "2025-09-08T15:30:00.000Z"
}
```

## 📊 **Database Migration**

### **Run Migration**

```bash
# Run database migration
npm run migrate
```

### **Migration Features**

- ✅ **Index Creation**: Performance indexes for all collections
- ✅ **Collection Verification**: Ensures all required collections exist
- ✅ **Data Validation**: Checks for existing data
- ✅ **Error Handling**: Graceful error handling and reporting

### **Created Indexes**

- **Users**: `email` (unique), `createdAt`
- **Products**: `category`, `isActive`, `isFeatured`, `isOnSale`, `basePrice`, `createdAt`, text search
- **Orders**: `userId`, `orderNumber` (unique), `status`, `paymentStatus`, `createdAt`
- **Carts**: `userId` (unique), `updatedAt`
- **Reviews**: `productId`, `userId`, `rating`, `createdAt`
- **Wishlists**: `userId` (unique), `updatedAt`

## 🔒 **Security Considerations**

### **Database Security**

- ✅ **Least Privilege**: Use dedicated database user (not admin)
- ✅ **IP Whitelisting**: Restrict database access to specific IPs
- ✅ **SSL/TLS**: MongoDB Atlas uses encrypted connections
- ✅ **Environment Variables**: Sensitive data in environment variables

### **Application Security**

- ✅ **CORS Configuration**: Restrict to production domains
- ✅ **Rate Limiting**: Prevent abuse
- ✅ **Helmet.js**: Security headers
- ✅ **Input Validation**: Server-side validation

## 🚀 **Deployment Checklist**

### **Pre-Deployment**

- [ ] Set up MongoDB Atlas cluster
- [ ] Create database user with least privileges
- [ ] Update environment variables
- [ ] Test database connection locally
- [ ] Run database migration
- [ ] Add sample products

### **Deployment**

- [ ] Install Node.js and PM2 on server
- [ ] Clone repository
- [ ] Install dependencies
- [ ] Build application
- [ ] Start with PM2
- [ ] Configure domain and SSL
- [ ] Test all endpoints

### **Post-Deployment**

- [ ] Verify health endpoints
- [ ] Test payment flows
- [ ] Monitor logs
- [ ] Set up monitoring/alerting
- [ ] Configure backups

## 📈 **Monitoring & Maintenance**

### **Log Management**

```bash
# View PM2 logs
pm2 logs

# View specific app logs
pm2 logs sastabazar-server

# Clear logs
pm2 flush
```

### **Performance Monitoring**

```bash
# Monitor PM2 processes
pm2 monit

# View process info
pm2 show sastabazar-server

# Restart if needed
pm2 restart sastabazar-server
```

## 🎉 **Production Ready!**

Your sastabazar e-commerce website is now fully configured for production deployment with:

- ✅ **MongoDB Atlas Integration**
- ✅ **Robust Database Connection**
- ✅ **PM2 Process Management**
- ✅ **Health Monitoring**
- ✅ **Production Build Pipeline**
- ✅ **Security Best Practices**

The application is ready for production deployment! 🚀
