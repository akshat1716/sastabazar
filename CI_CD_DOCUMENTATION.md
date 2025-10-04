# 🚀 CI/CD Pipeline Documentation

## 🎉 **CI/CD Pipeline Complete!**

Your sastabazar e-commerce website now has a comprehensive CI/CD pipeline with GitHub Actions, automated testing, staging deployment, and production deployment!

## ✅ **What's Been Implemented**

### **1. GitHub Actions CI/CD Pipeline** 🔄
- ✅ **Main CI/CD Workflow**: `.github/workflows/ci-cd.yml`
- ✅ **Pull Request Checks**: `.github/workflows/pr-checks.yml`
- ✅ **Environment Protection**: Staging and Production environments
- ✅ **Automated Testing**: Unit tests, integration tests, smoke tests
- ✅ **Security Scanning**: npm audit, CodeQL analysis
- ✅ **Performance Testing**: Artillery performance tests

### **2. Deployment Automation** 🚀
- ✅ **Staging Deployment**: Automatic deployment on `develop` branch
- ✅ **Production Deployment**: Automatic deployment on `main` branch
- ✅ **Manual Deployment**: Workflow dispatch for manual triggers
- ✅ **Rollback Support**: Backup creation before deployment
- ✅ **Health Checks**: Automated smoke tests after deployment

### **3. Environment Management** 🔐
- ✅ **Environment Secrets**: Protected secrets for each environment
- ✅ **Database Migration**: Automated migration on deployment
- ✅ **Configuration Management**: Environment-specific configurations
- ✅ **Security**: Least privilege access and secret protection

## 🔧 **Pipeline Jobs**

### **Main CI/CD Pipeline** (`ci-cd.yml`)

#### **1. Install & Test Job**
- **Triggers**: Push to `main`/`develop`, Pull Requests
- **Services**: MongoDB 6.0
- **Steps**:
  - Checkout code
  - Setup Node.js 18
  - Install dependencies (server + client)
  - Run linting
  - Run tests
  - Build application
  - Upload build artifacts

#### **2. Deploy to Staging**
- **Triggers**: Push to `develop` branch
- **Environment**: `staging` (protected)
- **Steps**:
  - Download build artifacts
  - Run database migration
  - Deploy to staging server
  - Run smoke tests
  - Notify deployment status

#### **3. Deploy to Production**
- **Triggers**: Push to `main` branch
- **Environment**: `production` (protected)
- **Steps**:
  - Download build artifacts
  - Run database migration
  - Deploy to production server
  - Run smoke tests
  - Notify deployment status

#### **4. Security Scan**
- **Triggers**: Pull Requests
- **Steps**:
  - npm audit
  - CodeQL analysis
  - Secret detection

#### **5. Performance Test**
- **Triggers**: Push to `main` branch
- **Steps**:
  - Start application
  - Run Artillery performance tests
  - Cleanup

### **Pull Request Checks** (`pr-checks.yml`)

#### **1. Code Quality**
- ESLint checks
- Code formatting checks
- TypeScript type checking

#### **2. Build & Test**
- Unit tests
- Integration tests
- Build verification

#### **3. Security Checks**
- npm audit
- Secret detection
- Security scanning

#### **4. Database Migration Test**
- Migration testing
- Database seeding

#### **5. API Contract Tests**
- API endpoint testing
- Contract validation

#### **6. Performance Regression**
- Performance testing
- Regression detection

## 🔐 **Environment Secrets**

### **Required Secrets for Staging**
```bash
# Database
STAGING_MONGODB_URI=mongodb+srv://...

# Authentication
STAGING_JWT_SECRET=your-staging-jwt-secret

# Payment Gateways
STAGING_RAZORPAY_KEY_ID=rzp_test_...
STAGING_RAZORPAY_KEY_SECRET=your-staging-razorpay-secret
STAGING_STRIPE_SECRET_KEY=sk_test_...
STAGING_STRIPE_PUBLISHABLE_KEY=pk_test_...
STAGING_STRIPE_WEBHOOK_SECRET=whsec_...

# Deployment
STAGING_HOST=staging.your-domain.com
STAGING_USER=deploy
STAGING_SSH_KEY=your-private-ssh-key
STAGING_PATH=/var/www/sastabazar-staging
STAGING_CORS_ORIGIN=https://staging.sastabazar.com
STAGING_URL=https://staging.sastabazar.com
```

### **Required Secrets for Production**
```bash
# Database
PRODUCTION_MONGODB_URI=mongodb+srv://...

# Authentication
PRODUCTION_JWT_SECRET=your-production-jwt-secret

# Payment Gateways
PRODUCTION_RAZORPAY_KEY_ID=rzp_live_...
PRODUCTION_RAZORPAY_KEY_SECRET=your-production-razorpay-secret
PRODUCTION_STRIPE_SECRET_KEY=sk_live_...
PRODUCTION_STRIPE_PUBLISHABLE_KEY=pk_live_...
PRODUCTION_STRIPE_WEBHOOK_SECRET=whsec_...

# Deployment
PRODUCTION_HOST=your-domain.com
PRODUCTION_USER=deploy
PRODUCTION_SSH_KEY=your-private-ssh-key
PRODUCTION_PATH=/var/www/sastabazar
PRODUCTION_CORS_ORIGIN=https://sastabazar.com
PRODUCTION_URL=https://sastabazar.com
```

## 🚀 **Deployment Process**

### **Automatic Deployment**

#### **Staging Deployment**
1. **Trigger**: Push to `develop` branch
2. **Process**:
   - Run tests and build
   - Deploy to staging server
   - Run database migration
   - Run smoke tests
   - Notify success/failure

#### **Production Deployment**
1. **Trigger**: Push to `main` branch
2. **Prerequisites**: Staging deployment must succeed
3. **Process**:
   - Run tests and build
   - Deploy to production server
   - Run database migration
   - Run smoke tests
   - Notify success/failure

### **Manual Deployment**

#### **Using GitHub Actions**
1. Go to Actions tab in GitHub
2. Select "CI/CD Pipeline"
3. Click "Run workflow"
4. Choose branch and environment
5. Click "Run workflow"

#### **Using Deployment Script**
```bash
# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production
./scripts/deploy.sh production
```

## 🧪 **Testing Strategy**

### **Automated Tests**

#### **Unit Tests**
- Server-side unit tests
- Client-side unit tests
- Component tests

#### **Integration Tests**
- API endpoint tests
- Database integration tests
- Payment gateway tests

#### **Smoke Tests**
- Health endpoint checks
- Database connectivity
- Critical API endpoints
- Payment configuration

#### **Performance Tests**
- Load testing with Artillery
- Response time monitoring
- Throughput testing

### **Test Environments**

#### **Pull Request Testing**
- Code quality checks
- Unit tests
- Build verification
- Security scanning

#### **Staging Testing**
- Full integration tests
- Database migration tests
- Smoke tests
- Performance tests

#### **Production Testing**
- Smoke tests only
- Health checks
- Critical path testing

## 🔒 **Security Features**

### **Secret Management**
- ✅ **Environment Protection**: Secrets protected by GitHub environments
- ✅ **Least Privilege**: Minimal required permissions
- ✅ **Secret Rotation**: Support for secret rotation
- ✅ **Audit Trail**: All secret access logged

### **Security Scanning**
- ✅ **npm audit**: Dependency vulnerability scanning
- ✅ **CodeQL**: Static code analysis
- ✅ **Secret Detection**: Prevents secret commits
- ✅ **Security Headers**: Helmet.js security headers

### **Access Control**
- ✅ **Branch Protection**: Required reviews and checks
- ✅ **Environment Gates**: Manual approval for production
- ✅ **Deployment Permissions**: Restricted deployment access

## 📊 **Monitoring & Observability**

### **Health Checks**
```bash
# API Health
GET /api/health

# Database Health
GET /api/health/db

# Payment Config
GET /api/payments/razorpay/config
GET /api/payments/stripe/config
```

### **Logging**
- ✅ **PM2 Logs**: Application logs
- ✅ **GitHub Actions Logs**: CI/CD logs
- ✅ **Deployment Logs**: Deployment history
- ✅ **Error Tracking**: Error monitoring

### **Metrics**
- ✅ **Performance Metrics**: Response times, throughput
- ✅ **Deployment Metrics**: Success/failure rates
- ✅ **Test Metrics**: Test coverage, pass rates
- ✅ **Security Metrics**: Vulnerability counts

## 🛠️ **Setup Instructions**

### **1. GitHub Repository Setup**

#### **Enable GitHub Actions**
1. Go to repository Settings
2. Navigate to Actions → General
3. Enable "Allow all actions and reusable workflows"

#### **Create Environments**
1. Go to Settings → Environments
2. Create `staging` environment
3. Create `production` environment
4. Add protection rules (required reviewers)

#### **Add Secrets**
1. Go to Settings → Secrets and variables → Actions
2. Add repository secrets for common values
3. Add environment secrets for each environment

### **2. Server Setup**

#### **Install Dependencies**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install MongoDB (if not using Atlas)
sudo apt-get install -y mongodb
```

#### **Setup SSH Access**
```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 4096 -C "deploy@sastabazar"

# Add public key to server
ssh-copy-id -i ~/.ssh/id_rsa.pub deploy@your-server.com

# Add private key to GitHub secrets
cat ~/.ssh/id_rsa
```

#### **Configure PM2**
```bash
# Setup PM2 startup
pm2 startup

# Save PM2 configuration
pm2 save
```

### **3. Database Setup**

#### **MongoDB Atlas**
1. Create MongoDB Atlas cluster
2. Create database user with least privileges
3. Whitelist server IP addresses
4. Get connection string
5. Add to GitHub secrets

#### **Local MongoDB (Development)**
```bash
# Start MongoDB
sudo systemctl start mongod

# Create database
mongosh
use sastabazar
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Deployment Failures**
```bash
# Check server logs
ssh user@server "pm2 logs sastabazar-server"

# Check server status
ssh user@server "pm2 status"

# Restart application
ssh user@server "pm2 restart sastabazar-server"
```

#### **Database Connection Issues**
```bash
# Test database connection
curl -f https://your-domain.com/api/health/db

# Check MongoDB logs
ssh user@server "sudo journalctl -u mongod"
```

#### **Payment Gateway Issues**
```bash
# Test payment config
curl -f https://your-domain.com/api/payments/razorpay/config
curl -f https://your-domain.com/api/payments/stripe/config
```

### **Debug Commands**

#### **Local Testing**
```bash
# Test locally
npm run dev

# Test build
npm run build:all

# Test migration
npm run migrate

# Test health endpoints
npm run health
npm run health:db
```

#### **Server Debugging**
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs sastabazar-server

# Monitor resources
pm2 monit

# Restart application
pm2 restart sastabazar-server
```

## 📈 **Best Practices**

### **Development Workflow**
1. **Create Feature Branch**: `git checkout -b feature/new-feature`
2. **Make Changes**: Implement your changes
3. **Run Tests Locally**: `npm test`
4. **Create Pull Request**: Submit PR for review
5. **Address Feedback**: Make requested changes
6. **Merge to Develop**: After approval, merge to develop
7. **Deploy to Staging**: Automatic staging deployment
8. **Test on Staging**: Verify functionality
9. **Merge to Main**: Merge develop to main
10. **Deploy to Production**: Automatic production deployment

### **Code Quality**
- ✅ **Write Tests**: Unit tests for new features
- ✅ **Follow Linting**: Use ESLint and Prettier
- ✅ **Document Changes**: Update documentation
- ✅ **Security Review**: Security-focused code review
- ✅ **Performance Testing**: Test performance impact

### **Deployment Safety**
- ✅ **Staging First**: Always test on staging first
- ✅ **Rollback Plan**: Have rollback strategy ready
- ✅ **Health Checks**: Monitor after deployment
- ✅ **Gradual Rollout**: Consider feature flags
- ✅ **Monitoring**: Set up alerts and monitoring

## 🎉 **CI/CD Pipeline Ready!**

Your sastabazar e-commerce website now has a complete CI/CD pipeline with:

- ✅ **Automated Testing** and quality checks
- ✅ **Staging Deployment** with smoke tests
- ✅ **Production Deployment** with safety checks
- ✅ **Security Scanning** and vulnerability detection
- ✅ **Performance Testing** and monitoring
- ✅ **Environment Management** with protected secrets
- ✅ **Rollback Support** and error handling

The pipeline is production-ready and follows industry best practices! 🚀

