# GitHub Actions Environment Configuration

## 🔐 **Environment Secrets Setup**

This document outlines how to configure GitHub Actions environments and secrets for your sastabazar e-commerce website.

## 📋 **Required Environments**

### **1. Staging Environment**
- **Purpose**: Pre-production testing and validation
- **Branch**: `develop`
- **URL**: `https://staging.sastabazar.com`
- **Database**: Staging MongoDB Atlas cluster

### **2. Production Environment**
- **Purpose**: Live production deployment
- **Branch**: `main`
- **URL**: `https://sastabazar.com`
- **Database**: Production MongoDB Atlas cluster

## 🔑 **Required Secrets**

### **Staging Environment Secrets**

#### **Database Configuration**
```bash
STAGING_MONGODB_URI=mongodb+srv://staging-user:password@cluster.mongodb.net/sastabazar-staging?retryWrites=true&w=majority
```

#### **Authentication**
```bash
STAGING_JWT_SECRET=your-staging-jwt-secret-key-make-it-long-and-random
```

#### **Payment Gateways**
```bash
# Razorpay (Test Mode)
STAGING_RAZORPAY_KEY_ID=rzp_test_your_staging_key_id
STAGING_RAZORPAY_KEY_SECRET=your_staging_razorpay_secret_key

# Stripe (Test Mode)
STAGING_STRIPE_SECRET_KEY=sk_test_your_staging_stripe_secret_key
STAGING_STRIPE_PUBLISHABLE_KEY=pk_test_your_staging_stripe_publishable_key
STAGING_STRIPE_WEBHOOK_SECRET=whsec_your_staging_stripe_webhook_secret
```

#### **Deployment Configuration**
```bash
# Server Details
STAGING_HOST=staging.your-domain.com
STAGING_USER=deploy
STAGING_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
your-private-ssh-key-content
-----END OPENSSH PRIVATE KEY-----
STAGING_PATH=/var/www/sastabazar-staging

# Application Configuration
STAGING_CORS_ORIGIN=https://staging.sastabazar.com
STAGING_URL=https://staging.sastabazar.com
```

### **Production Environment Secrets**

#### **Database Configuration**
```bash
PRODUCTION_MONGODB_URI=mongodb+srv://prod-user:password@cluster.mongodb.net/sastabazar?retryWrites=true&w=majority
```

#### **Authentication**
```bash
PRODUCTION_JWT_SECRET=your-production-jwt-secret-key-make-it-long-and-random-and-different-from-staging
```

#### **Payment Gateways**
```bash
# Razorpay (Live Mode)
PRODUCTION_RAZORPAY_KEY_ID=rzp_live_your_production_key_id
PRODUCTION_RAZORPAY_KEY_SECRET=your_production_razorpay_secret_key

# Stripe (Live Mode)
PRODUCTION_STRIPE_SECRET_KEY=sk_live_your_production_stripe_secret_key
PRODUCTION_STRIPE_PUBLISHABLE_KEY=pk_live_your_production_stripe_publishable_key
PRODUCTION_STRIPE_WEBHOOK_SECRET=whsec_your_production_stripe_webhook_secret
```

#### **Deployment Configuration**
```bash
# Server Details
PRODUCTION_HOST=your-domain.com
PRODUCTION_USER=deploy
PRODUCTION_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
your-production-private-ssh-key-content
-----END OPENSSH PRIVATE KEY-----
PRODUCTION_PATH=/var/www/sastabazar

# Application Configuration
PRODUCTION_CORS_ORIGIN=https://sastabazar.com
PRODUCTION_URL=https://sastabazar.com
```

## 🛠️ **Setup Instructions**

### **1. Create GitHub Environments**

1. **Go to Repository Settings**
   - Navigate to your GitHub repository
   - Click on "Settings" tab

2. **Create Staging Environment**
   - Go to "Environments" in the left sidebar
   - Click "New environment"
   - Name: `staging`
   - Add protection rules:
     - Required reviewers: Add team members
     - Wait timer: 0 minutes
     - Deployment branches: `develop` branch only

3. **Create Production Environment**
   - Click "New environment"
   - Name: `production`
   - Add protection rules:
     - Required reviewers: Add senior team members
     - Wait timer: 5 minutes
     - Deployment branches: `main` branch only

### **2. Add Environment Secrets**

#### **For Staging Environment**
1. Click on `staging` environment
2. Click "Add secret" for each required secret
3. Add all staging secrets listed above

#### **For Production Environment**
1. Click on `production` environment
2. Click "Add secret" for each required secret
3. Add all production secrets listed above

### **3. Configure Branch Protection**

1. **Go to Repository Settings**
   - Navigate to "Branches" in the left sidebar

2. **Protect Main Branch**
   - Click "Add rule" for `main` branch
   - Enable "Require a pull request before merging"
   - Enable "Require status checks to pass before merging"
   - Select required status checks:
     - `Install & Test`
     - `Deploy to Staging`
     - `Security Scan`
   - Enable "Require branches to be up to date before merging"
   - Enable "Restrict pushes that create files"

3. **Protect Develop Branch**
   - Click "Add rule" for `develop` branch
   - Enable "Require a pull request before merging"
   - Enable "Require status checks to pass before merging"
   - Select required status checks:
     - `Install & Test`
     - `Code Quality`
     - `Build & Test`

## 🔒 **Security Best Practices**

### **Secret Management**
- ✅ **Use Different Secrets**: Never reuse secrets between environments
- ✅ **Rotate Regularly**: Change secrets periodically
- ✅ **Least Privilege**: Use minimal required permissions
- ✅ **Monitor Access**: Review secret access logs regularly

### **Environment Protection**
- ✅ **Required Reviewers**: Require approval for production deployments
- ✅ **Wait Timers**: Add delays for production deployments
- ✅ **Branch Restrictions**: Limit deployment branches
- ✅ **Status Checks**: Require all checks to pass

### **Access Control**
- ✅ **Team Permissions**: Limit repository access
- ✅ **Deployment Permissions**: Restrict deployment access
- ✅ **Secret Access**: Monitor secret usage
- ✅ **Audit Logs**: Review all actions regularly

## 🧪 **Testing the Setup**

### **1. Test Staging Deployment**
```bash
# Push to develop branch
git checkout develop
git push origin develop

# Check GitHub Actions
# Go to Actions tab and verify staging deployment
```

### **2. Test Production Deployment**
```bash
# Merge develop to main
git checkout main
git merge develop
git push origin main

# Check GitHub Actions
# Go to Actions tab and verify production deployment
```

### **3. Test Manual Deployment**
```bash
# Go to Actions tab
# Select "CI/CD Pipeline"
# Click "Run workflow"
# Choose branch and environment
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Secret Not Found**
```bash
# Error: Secret not found
# Solution: Check secret name spelling and environment
```

#### **SSH Connection Failed**
```bash
# Error: SSH connection failed
# Solution: Verify SSH key format and server access
```

#### **Database Connection Failed**
```bash
# Error: Database connection failed
# Solution: Check MongoDB URI and network access
```

#### **Deployment Failed**
```bash
# Error: Deployment failed
# Solution: Check server logs and PM2 status
```

### **Debug Commands**

#### **Check GitHub Actions Logs**
1. Go to Actions tab
2. Click on failed workflow
3. Click on failed job
4. Review error logs

#### **Check Server Status**
```bash
# SSH into server
ssh user@server

# Check PM2 status
pm2 status

# Check logs
pm2 logs sastabazar-server

# Check server resources
pm2 monit
```

## 📊 **Monitoring Setup**

### **Health Check Endpoints**
```bash
# API Health
curl https://staging.sastabazar.com/api/health
curl https://sastabazar.com/api/health

# Database Health
curl https://staging.sastabazar.com/api/health/db
curl https://sastabazar.com/api/health/db
```

### **GitHub Actions Monitoring**
- ✅ **Workflow Status**: Monitor workflow success/failure
- ✅ **Deployment History**: Track deployment history
- ✅ **Performance Metrics**: Monitor build and test times
- ✅ **Security Alerts**: Monitor security scan results

## 🎉 **Environment Setup Complete!**

Your GitHub Actions environments are now configured with:

- ✅ **Staging Environment** with protected secrets
- ✅ **Production Environment** with approval gates
- ✅ **Branch Protection** with required checks
- ✅ **Security Best Practices** implemented
- ✅ **Monitoring and Alerting** configured

The CI/CD pipeline is ready for automated deployments! 🚀

