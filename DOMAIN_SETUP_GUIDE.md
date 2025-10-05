# 🌐 Domain Setup Guide for Sastabazar

## 🎯 **Quick Setup Options**

### **Option 1: Coming Soon Page (5 minutes)**

1. **Upload the coming-soon.html file** to your hosting provider
2. **Point your domain** to the hosting server
3. **Done!** Your domain will show a beautiful coming soon page

### **Option 2: Full Website Deployment (30 minutes)**

1. **Deploy your full website** to a hosting provider
2. **Configure domain DNS** to point to your server
3. **Set up SSL certificate** for HTTPS
4. **Launch!** Your full e-commerce site will be live

---

## 🚀 **Step-by-Step Domain Configuration**

### **Step 1: Choose Your Hosting Provider**

#### **Free Options:**

- **Netlify** (Recommended for static sites)
- **Vercel** (Great for React apps)
- **GitHub Pages** (Free hosting)

#### **Paid Options:**

- **DigitalOcean** ($5/month droplet)
- **AWS EC2** (Pay as you use)
- **Google Cloud** (Free tier available)
- **Vultr** ($2.50/month)

### **Step 2: Deploy Your Website**

#### **For Coming Soon Page (Netlify):**

1. Go to [netlify.com](https://netlify.com)
2. Sign up for free account
3. Drag and drop `coming-soon.html` file
4. Get your Netlify URL (e.g., `https://amazing-name-123456.netlify.app`)

#### **For Full Website (DigitalOcean):**

1. Create a DigitalOcean droplet ($5/month)
2. Follow the deployment guide in `PRODUCTION_DEPLOYMENT_GUIDE.md`
3. Run the deployment script: `./deploy.sh`
4. Get your server IP address

### **Step 3: Configure GoDaddy DNS**

1. **Login to GoDaddy**
   - Go to [godaddy.com](https://godaddy.com)
   - Login to your account
   - Go to "My Products" → "Domains"

2. **Access DNS Management**
   - Click on your domain name
   - Click "DNS" or "Manage DNS"

3. **Update DNS Records**

#### **For Coming Soon Page (Netlify):**

```
Type: CNAME
Name: www
Value: your-netlify-url.netlify.app
TTL: 600

Type: A
Name: @
Value: 75.2.60.5
TTL: 600
```

#### **For Full Website (VPS/Server):**

```
Type: A
Name: @
Value: YOUR_SERVER_IP_ADDRESS
TTL: 600

Type: A
Name: www
Value: YOUR_SERVER_IP_ADDRESS
TTL: 600
```

### **Step 4: Set Up SSL Certificate**

#### **For Netlify:**

- SSL is automatically enabled
- Your site will be available at `https://yourdomain.com`

#### **For VPS/Server:**

1. Install Certbot: `sudo apt install certbot`
2. Get SSL certificate: `sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com`
3. SSL will be automatically renewed

---

## 🛠️ **Detailed Deployment Instructions**

### **Option A: Netlify Deployment (Easiest)**

1. **Prepare Files:**

   ```bash
   # Copy the coming soon page
   cp coming-soon.html index.html
   ```

2. **Deploy to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Sign up/login
   - Drag and drop your `index.html` file
   - Get your Netlify URL

3. **Configure Domain:**
   - In Netlify dashboard, go to "Domain settings"
   - Add your custom domain
   - Follow Netlify's DNS instructions

### **Option B: VPS Deployment (Full Website)**

1. **Set Up VPS:**

   ```bash
   # Create a DigitalOcean droplet
   # Choose Ubuntu 20.04 LTS
   # Select $5/month plan
   ```

2. **Connect to Server:**

   ```bash
   ssh root@YOUR_SERVER_IP
   ```

3. **Install Dependencies:**

   ```bash
   # Update system
   apt update && apt upgrade -y

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   apt-get install -y nodejs

   # Install PM2
   npm install -g pm2

   # Install Nginx
   apt install nginx -y
   ```

4. **Deploy Application:**

   ```bash
   # Clone your repository
   git clone https://github.com/your-username/sastabazar.git
   cd sastabazar

   # Install dependencies
   npm install

   # Build the application
   npm run build:all

   # Start with PM2
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

5. **Configure Nginx:**

   ```bash
   # Create Nginx configuration
   nano /etc/nginx/sites-available/sastabazar
   ```

   Add this configuration:

   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

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

   ```bash
   # Enable the site
   ln -s /etc/nginx/sites-available/sastabazar /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

6. **Set Up SSL:**

   ```bash
   # Install Certbot
   apt install certbot python3-certbot-nginx -y

   # Get SSL certificate
   certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

---

## 🔧 **Environment Configuration**

### **Production Environment Variables**

Create a `.env` file on your server:

```env
# Server Configuration
NODE_ENV=production
PORT=5001
SERVER_URL=https://yourdomain.com
CLIENT_URL=https://yourdomain.com

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sastabazar

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Payment (Razorpay)
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# CORS
CORS_ORIGIN=https://yourdomain.com
```

---

## 📋 **DNS Configuration Checklist**

### **GoDaddy DNS Settings:**

1. **A Record (Root Domain):**

   ```
   Type: A
   Name: @
   Value: YOUR_SERVER_IP (or Netlify IP: 75.2.60.5)
   TTL: 600
   ```

2. **A Record (WWW):**

   ```
   Type: A
   Name: www
   Value: YOUR_SERVER_IP (or Netlify IP: 75.2.60.5)
   TTL: 600
   ```

3. **CNAME (If using Netlify):**
   ```
   Type: CNAME
   Name: www
   Value: your-site-name.netlify.app
   TTL: 600
   ```

### **DNS Propagation:**

- DNS changes can take **5 minutes to 48 hours** to propagate
- Use [whatsmydns.net](https://whatsmydns.net) to check propagation status
- Clear your browser cache and try incognito mode

---

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **Domain not loading:**
   - Check DNS propagation status
   - Verify DNS records are correct
   - Clear browser cache

2. **SSL certificate issues:**
   - Ensure domain is pointing to correct IP
   - Wait for DNS propagation
   - Check firewall settings

3. **Website not accessible:**
   - Check if server is running: `pm2 status`
   - Check server logs: `pm2 logs`
   - Verify Nginx configuration: `nginx -t`

### **Useful Commands:**

```bash
# Check server status
pm2 status
pm2 logs

# Check Nginx status
systemctl status nginx
nginx -t

# Check SSL certificate
certbot certificates

# Renew SSL certificate
certbot renew --dry-run
```

---

## 🎉 **Launch Checklist**

### **Pre-Launch:**

- [ ] Domain DNS configured
- [ ] Website deployed and accessible
- [ ] SSL certificate installed
- [ ] All pages loading correctly
- [ ] Payment integration tested
- [ ] Database connected
- [ ] Environment variables set

### **Post-Launch:**

- [ ] Monitor server performance
- [ ] Set up backup procedures
- [ ] Configure monitoring alerts
- [ ] Test all functionality
- [ ] Share your website URL!

---

## 📞 **Need Help?**

If you run into any issues:

1. **Check the logs:** `pm2 logs` or `tail -f /var/log/nginx/error.log`
2. **Verify DNS:** Use [whatsmydns.net](https://whatsmydns.net)
3. **Test locally:** Make sure your site works on `localhost:5001`
4. **Check firewall:** Ensure ports 80 and 443 are open

Your domain setup should be complete! 🚀
