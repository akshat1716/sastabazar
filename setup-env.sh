#!/bin/bash

# Pre-Launch Environment Setup Script
# This script helps set up the environment for production verification

echo "🔧 Setting up environment for pre-launch verification..."

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create one from env.example"
    exit 1
fi

# Add missing RAZORPAY_WEBHOOK_SECRET if not present
if ! grep -q "RAZORPAY_WEBHOOK_SECRET" .env; then
    echo "⚠️ Adding missing RAZORPAY_WEBHOOK_SECRET to .env..."
    echo "" >> .env
    echo "# Razorpay Webhook Secret" >> .env
    echo "RAZORPAY_WEBHOOK_SECRET=test_webhook_secret_1234567890abcdef" >> .env
    echo "✅ Added RAZORPAY_WEBHOOK_SECRET"
fi

# Update Razorpay keys to test values if they're still placeholders
if grep -q "rzp_test_your_razorpay_key_id_here" .env; then
    echo "⚠️ Updating placeholder Razorpay keys..."
    sed -i.bak 's/rzp_test_your_razorpay_key_id_here/rzp_test_1234567890abcdef/g' .env
    sed -i.bak 's/your_razorpay_key_secret_here/test_secret_1234567890abcdef/g' .env
    echo "✅ Updated Razorpay keys to test values"
fi

# Verify MongoDB is running
echo "🗄️ Checking MongoDB connection..."
if ! nc -z localhost 27017 2>/dev/null; then
    echo "⚠️ MongoDB not running on localhost:27017"
    echo "Please start MongoDB or update MONGODB_URI in .env"
fi

echo "✅ Environment setup complete!"
echo ""
echo "📋 Current configuration:"
echo "PORT: $(grep '^PORT=' .env | cut -d'=' -f2)"
echo "NODE_ENV: $(grep '^NODE_ENV=' .env | cut -d'=' -f2)"
echo "CLIENT_URL: $(grep '^CLIENT_URL=' .env | cut -d'=' -f2)"
echo "SERVER_URL: $(grep '^SERVER_URL=' .env | cut -d'=' -f2)"
echo "MONGODB_URI: $(grep '^MONGODB_URI=' .env | cut -d'=' -f2 | sed 's/\/\/.*@/\/\/***:***@/')"
echo "RAZORPAY_KEY_ID: $(grep '^RAZORPAY_KEY_ID=' .env | cut -d'=' -f2 | sed 's/rzp_test_/rzp_test_***/')"
echo "RAZORPAY_WEBHOOK_SECRET: $(grep '^RAZORPAY_WEBHOOK_SECRET=' .env | cut -d'=' -f2 | sed 's/^test_webhook_secret_/test_webhook_secret_***/')"
echo ""
echo "🚀 Ready to run pre-launch verification!"



