# Sastabazar E2E Payment Testing Runbook

This runbook provides step-by-step instructions for testing payment flows end-to-end, including live transactions, signature verification, order state changes, and refunds.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Test Environment Setup](#test-environment-setup)
3. [Razorpay E2E Testing](#razorpay-e2e-testing)
4. [Stripe E2E Testing](#stripe-e2e-testing)
5. [Manual Testing Procedures](#manual-testing-procedures)
6. [Automated Test Execution](#automated-test-execution)
7. [Troubleshooting](#troubleshooting)
8. [Production Testing](#production-testing)

## Prerequisites

### Required Accounts
- **Razorpay Test Account**: [https://razorpay.com](https://razorpay.com)
- **Stripe Test Account**: [https://stripe.com](https://stripe.com)
- **MongoDB Atlas Account**: [https://cloud.mongodb.com](https://cloud.mongodb.com)

### Required Tools
- Node.js 18+ installed
- MongoDB Atlas cluster running
- Test credit cards (provided by payment gateways)
- Postman or similar API testing tool
- Browser with developer tools

### Test Data
- Test user accounts
- Test products with known prices
- Test credit cards (Razorpay: 4111 1111 1111 1111, Stripe: 4242 4242 4242 4242)

## Test Environment Setup

### 1. Environment Configuration

```bash
# Copy environment template
cp env.example .env

# Configure test environment variables
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sastabazar-test
NODE_ENV=test
PORT=5000

# Razorpay Test Keys
RAZORPAY_KEY_ID=rzp_test_your_test_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret

# Stripe Test Keys
STRIPE_SECRET_KEY=sk_test_your_test_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook_secret
```

### 2. Database Setup

```bash
# Start the application
npm run dev

# Verify database connection
curl http://localhost:5000/api/health/db

# Seed test data
npm run seed
```

### 3. Test User Creation

```bash
# Create test user via API
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

## Razorpay E2E Testing

### Automated Test Execution

```bash
# Run complete Razorpay E2E test suite
npm run test:e2e

# Run specific test components
node tests/razorpay-e2e.test.js
```

### Manual Testing Steps

#### Step 1: Create Test Order

```bash
# Login and get token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpassword123"}' \
  | jq -r '.token')

# Add product to cart
curl -X POST http://localhost:5000/api/cart/add \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PRODUCT_ID",
    "quantity": 1
  }'

# Create Razorpay order
curl -X POST http://localhost:5000/api/payments/razorpay/order \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": {
      "street": "123 Test Street",
      "city": "Test City",
      "state": "Test State",
      "zipCode": "12345",
      "country": "India"
    },
    "shippingMethod": "standard"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "order": {
    "id": "order_xyz123",
    "amount": 10000,
    "currency": "INR",
    "receipt": "ORD-1234567890-abc123"
  },
  "internalOrderId": "507f1f77bcf86cd799439011",
  "orderNumber": "ORD-1234567890-abc123"
}
```

#### Step 2: Process Live Payment

1. **Open Razorpay Checkout:**
   ```javascript
   // In browser console or test script
   const options = {
     key: 'rzp_test_your_test_key_id',
     amount: 10000, // Amount from order response
     currency: 'INR',
     name: 'Sastabazar',
     description: 'Test Order',
     order_id: 'order_xyz123', // From order response
     handler: function (response) {
       console.log('Payment successful:', response);
       // Verify payment on server
       verifyPayment(response);
     }
   };
   
   const rzp = new Razorpay(options);
   rzp.open();
   ```

2. **Use Test Card Details:**
   - **Card Number:** 4111 1111 1111 1111
   - **Expiry:** Any future date (e.g., 12/25)
   - **CVV:** Any 3 digits (e.g., 123)
   - **Name:** Any name

#### Step 3: Verify Payment on Server

```bash
# Verify payment with signature
curl -X POST http://localhost:5000/api/payments/razorpay/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_xyz123",
    "razorpay_payment_id": "pay_xyz123",
    "razorpay_signature": "generated_signature",
    "internal_order_id": "507f1f77bcf86cd799439011"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "order": {
    "status": "confirmed",
    "paymentStatus": "paid",
    "paidAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### Step 4: Verify Order State Changes

```bash
# Check order status
curl -X GET http://localhost:5000/api/orders/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer $TOKEN"
```

**Verification Checklist:**
- [ ] Order status changed to "confirmed"
- [ ] Payment status changed to "paid"
- [ ] Cart is cleared
- [ ] Product stock is reduced
- [ ] Payment details are stored
- [ ] Order has paidAt timestamp

#### Step 5: Test Refund Flow

```bash
# Process refund (if refund endpoint exists)
curl -X POST http://localhost:5000/api/payments/razorpay/refund \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "pay_xyz123",
    "amount": 10000,
    "reason": "Test refund"
  }'
```

### Idempotency Testing

```bash
# Test duplicate payment verification
curl -X POST http://localhost:5000/api/payments/razorpay/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_xyz123",
    "razorpay_payment_id": "pay_xyz123",
    "razorpay_signature": "generated_signature",
    "internal_order_id": "507f1f77bcf86cd799439011"
  }'
```

**Expected:** Should return success message indicating payment already verified.

## Stripe E2E Testing

### Manual Testing Steps

#### Step 1: Create Stripe Checkout Session

```bash
# Create Stripe checkout session
curl -X POST http://localhost:5000/api/payments/stripe/create-checkout-session \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": {
      "street": "123 Test Street",
      "city": "Test City",
      "state": "Test State",
      "zipCode": "12345",
      "country": "India"
    },
    "shippingMethod": "standard"
  }'
```

#### Step 2: Complete Payment

1. **Redirect to Stripe Checkout:**
   ```javascript
   // Use session URL from response
   window.location.href = 'https://checkout.stripe.com/pay/cs_test_xyz123';
   ```

2. **Use Test Card:**
   - **Card Number:** 4242 4242 4242 4242
   - **Expiry:** Any future date
   - **CVC:** Any 3 digits
   - **ZIP:** Any 5 digits

#### Step 3: Verify Webhook Processing

```bash
# Check webhook logs
tail -f logs/combined.log | grep "stripe"

# Verify order status
curl -X GET http://localhost:5000/api/orders/ORDER_ID \
  -H "Authorization: Bearer $TOKEN"
```

## Automated Test Execution

### Running Test Suites

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suites
npm run test:razorpay-e2e
npm run test:stripe-e2e

# Run with verbose output
npm run test:e2e -- --verbose

# Run tests in CI mode
npm run test:e2e -- --ci
```

### Test Configuration

```javascript
// tests/config/test-config.js
module.exports = {
  baseURL: 'http://localhost:5000',
  testUser: {
    email: 'test@example.com',
    password: 'testpassword123'
  },
  testAmount: 100, // ₹1.00 in paise
  timeout: 30000,
  retries: 3
};
```

## Manual Testing Procedures

### Pre-Test Checklist

- [ ] Test environment is running
- [ ] Database is connected and seeded
- [ ] Payment gateway test keys are configured
- [ ] Test user account exists
- [ ] Test products are available
- [ ] Logs are being captured

### Test Scenarios

#### Scenario 1: Successful Payment Flow
1. User adds product to cart
2. User proceeds to checkout
3. User completes payment
4. Payment is verified
5. Order is confirmed
6. User receives confirmation

#### Scenario 2: Payment Failure
1. User attempts payment with invalid card
2. Payment fails
3. Order remains in pending state
4. User can retry payment

#### Scenario 3: Network Interruption
1. User initiates payment
2. Network connection is lost
3. Payment status is unclear
4. User can check order status
5. Payment can be retried if needed

#### Scenario 4: Duplicate Payment
1. User completes payment
2. User accidentally submits payment again
3. System handles duplicate gracefully
4. No double charging occurs

### Verification Steps

#### Database Verification
```javascript
// Check order in database
db.orders.findOne({ orderNumber: "ORD-1234567890-abc123" });

// Verify payment details
db.orders.findOne({ 
  orderNumber: "ORD-1234567890-abc123" 
}, { paymentDetails: 1 });

// Check cart is cleared
db.carts.findOne({ userId: ObjectId("USER_ID") });
```

#### Log Verification
```bash
# Check payment logs
grep "payment_verified" logs/combined.log

# Check error logs
grep "ERROR" logs/combined.log

# Check webhook logs
grep "webhook" logs/combined.log
```

## Troubleshooting

### Common Issues

#### 1. Payment Verification Fails
**Symptoms:** Signature verification error
**Solutions:**
- Check Razorpay key secret is correct
- Verify signature generation algorithm
- Ensure order ID and payment ID match

#### 2. Order Not Found
**Symptoms:** 404 error when verifying payment
**Solutions:**
- Check internal_order_id is correct
- Verify order exists in database
- Check order was created before payment

#### 3. Cart Not Cleared
**Symptoms:** Items remain in cart after payment
**Solutions:**
- Check user ID matches between order and cart
- Verify cart update query
- Check for database transaction issues

#### 4. Stock Not Updated
**Symptoms:** Product stock unchanged after order
**Solutions:**
- Verify product ID in order items
- Check stock update query
- Ensure product exists in database

### Debug Commands

```bash
# Check application logs
pm2 logs sastabazar-server

# Check database connection
curl http://localhost:5000/api/health/db

# Test payment gateway connectivity
curl -X GET http://localhost:5000/api/payments/razorpay/config

# Check order status
curl -X GET http://localhost:5000/api/orders/ORDER_ID \
  -H "Authorization: Bearer TOKEN"
```

## Production Testing

### Pre-Production Checklist

- [ ] Production environment is configured
- [ ] Live payment gateway keys are set
- [ ] SSL certificates are valid
- [ ] Database backups are configured
- [ ] Monitoring is in place
- [ ] Error tracking is enabled

### Production Test Procedure

1. **Use Small Amounts:** Test with minimum possible amounts
2. **Test During Low Traffic:** Avoid peak hours
3. **Monitor Closely:** Watch logs and metrics
4. **Have Rollback Plan:** Be ready to revert if needed
5. **Test Refunds:** Verify refund process works

### Production Test Script

```bash
#!/bin/bash
# Production payment test script

echo "🚨 PRODUCTION PAYMENT TEST"
echo "⚠️  This will process REAL payments!"
echo "Press Ctrl+C to cancel, or Enter to continue"
read

# Test with minimum amount (₹1)
AMOUNT=100

echo "Testing payment with ₹1.00..."
# Run test with production environment
NODE_ENV=production npm run test:e2e -- --amount=$AMOUNT

echo "✅ Production test completed"
echo "🔍 Check logs and database for results"
```

### Post-Production Verification

1. **Check Payment Gateway Dashboard**
2. **Verify Database Records**
3. **Review Application Logs**
4. **Test Refund Process**
5. **Monitor Error Rates**

## Test Data Management

### Test User Accounts
```json
{
  "testUsers": [
    {
      "email": "test@example.com",
      "password": "testpassword123",
      "role": "customer"
    },
    {
      "email": "admin@example.com",
      "password": "adminpassword123",
      "role": "admin"
    }
  ]
}
```

### Test Products
```json
{
  "testProducts": [
    {
      "name": "Test Product 1",
      "price": 100,
      "stock": 100,
      "category": "test"
    },
    {
      "name": "Test Product 2",
      "price": 500,
      "stock": 50,
      "category": "test"
    }
  ]
}
```

### Test Credit Cards

#### Razorpay Test Cards
- **Success:** 4111 1111 1111 1111
- **Failure:** 4000 0000 0000 0002
- **3D Secure:** 4000 0000 0000 3220

#### Stripe Test Cards
- **Success:** 4242 4242 4242 4242
- **Failure:** 4000 0000 0000 0002
- **3D Secure:** 4000 0000 0000 3220

## Conclusion

This runbook provides comprehensive guidance for testing payment flows in the Sastabazar e-commerce platform. Always test thoroughly in development and staging environments before deploying to production. Keep test amounts small and monitor all transactions closely.

For questions or issues, refer to the troubleshooting section or contact the development team.



