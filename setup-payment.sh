#!/bin/bash

# Payment Gateway Setup Script for sastabazar
# This script helps you set up Stripe payment integration

echo "🎯 sastabazar Payment Gateway Setup"
echo "=================================="
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please run the main setup first."
    exit 1
fi

echo "📋 Payment Gateway Setup Steps:"
echo ""

echo "1️⃣  Create a Stripe Account:"
echo "   - Go to https://stripe.com"
echo "   - Sign up for a free account"
echo "   - Complete your business profile"
echo ""

echo "2️⃣  Get Your API Keys:"
echo "   - Go to Stripe Dashboard → Developers → API Keys"
echo "   - Copy your Publishable Key and Secret Key"
echo ""

echo "3️⃣  Update Environment Variables:"
echo "   Backend (.env):"
echo "   - Replace 'sk_test_your_stripe_secret_key_here' with your actual secret key"
echo "   - Replace 'whsec_your_webhook_secret_here' with your webhook secret"
echo ""
echo "   Frontend (client/.env):"
echo "   - Create client/.env file with:"
echo "     VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here"
echo ""

echo "4️⃣  Set Up Webhooks:"
echo "   - Go to Stripe Dashboard → Developers → Webhooks"
echo "   - Add endpoint: https://your-domain.com/api/payments/webhook"
echo "   - Select events: payment_intent.succeeded, payment_intent.payment_failed, checkout.session.completed"
echo "   - Copy webhook secret to .env file"
echo ""

echo "5️⃣  Test the Integration:"
echo "   - Use test card: 4242 4242 4242 4242"
echo "   - Add items to cart and try checkout"
echo "   - Verify payment success/failure handling"
echo ""

echo "✅ Payment Gateway Features Available:"
echo "   - Embedded checkout with Stripe Elements"
echo "   - Stripe Checkout redirect option"
echo "   - Payment success/failure pages"
echo "   - Order tracking and management"
echo "   - Refund processing"
echo "   - Multiple payment methods support"
echo ""

echo "🌐 Your website is now running at:"
echo "   Frontend: http://localhost:5173"
echo "   Backend: http://localhost:5001"
echo ""

echo "📚 Documentation:"
echo "   - Payment Setup Guide: PAYMENT_SETUP.md"
echo "   - Stripe Docs: https://stripe.com/docs"
echo ""

echo "🎉 Payment gateway setup complete!"
echo "   Get your Stripe keys and update the environment variables to start accepting payments." 