#!/bin/bash

# 🛍️ sastabazar Shopify Integration Setup Script

echo "🚀 Setting up Shopify integration for sastabazar..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Shopify Configuration
REACT_APP_SHOPIFY_STORE_URL=your-store.myshopify.com
REACT_APP_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-access-token

# Optional: Fallback to local API
REACT_APP_API_URL=http://localhost:5000/api
EOF
    echo "✅ .env file created!"
    echo "⚠️  Please update the Shopify credentials in .env file"
else
    echo "✅ .env file already exists"
fi

# Check if shopify-buy is installed
if npm list shopify-buy > /dev/null 2>&1; then
    echo "✅ Shopify Buy SDK is installed"
else
    echo "📦 Installing Shopify Buy SDK..."
    npm install shopify-buy
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Create a Shopify store at shopify.com"
echo "2. Set up Storefront API in your Shopify admin"
echo "3. Update .env file with your Shopify credentials"
echo "4. Add products to your Shopify store"
echo "5. Test the integration by running: npm run dev"
echo ""
echo "📚 Check SHOPIFY_INTEGRATION.md for detailed instructions"
echo "📚 Check SHOPIFY_IMPLEMENTATION.md for step-by-step guide"
echo ""
echo "🛍️ Your sastabazar website is ready for Shopify integration!" 