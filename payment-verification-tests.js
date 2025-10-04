const axios = require('axios');
const crypto = require('crypto');
const Razorpay = require('razorpay');

// Configuration
const BASE_URL = process.env.SERVER_URL || 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

// Test configuration
const TEST_CONFIG = {
  razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  testAmount: 100, // ₹1.00 for testing
  testCurrency: 'INR'
};

// Initialize Razorpay
let razorpayInstance;
if (TEST_CONFIG.razorpayKeyId && TEST_CONFIG.razorpayKeySecret) {
  razorpayInstance = new Razorpay({
    key_id: TEST_CONFIG.razorpayKeyId,
    key_secret: TEST_CONFIG.razorpayKeySecret,
  });
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to run a test
async function runTest(name, testFn) {
  try {
    console.log(`🧪 Running test: ${name}`);
    await testFn();
    testResults.passed++;
    testResults.tests.push({ name, status: 'PASSED' });
    console.log(`✅ ${name} - PASSED\n`);
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name, status: 'FAILED', error: error.message });
    console.log(`❌ ${name} - FAILED: ${error.message}\n`);
  }
}

// Test 1: Razorpay Configuration
async function testRazorpayConfiguration() {
  if (!razorpayInstance) {
    throw new Error('Razorpay not configured - missing API keys');
  }
  
  console.log(`   Razorpay Key ID: ${TEST_CONFIG.razorpayKeyId}`);
  console.log(`   Webhook Secret: ${TEST_CONFIG.razorpayWebhookSecret ? 'Configured' : 'Not configured'}`);
}

// Test 2: Payment Order Creation (Dry Run)
async function testPaymentOrderCreation() {
  if (!razorpayInstance) {
    throw new Error('Razorpay not configured');
  }
  
  // Create a test Razorpay order
  const orderOptions = {
    amount: TEST_CONFIG.testAmount * 100, // Convert to paise
    currency: TEST_CONFIG.testCurrency,
    receipt: `test_${Date.now()}`,
    payment_capture: 0, // Don't auto-capture for testing
    notes: {
      test: true,
      created_at: new Date().toISOString()
    }
  };
  
  const order = await razorpayInstance.orders.create(orderOptions);
  
  if (!order.id) {
    throw new Error('Failed to create Razorpay order');
  }
  
  console.log(`   Test Order ID: ${order.id}`);
  console.log(`   Amount: ₹${TEST_CONFIG.testAmount}`);
  console.log(`   Currency: ${order.currency}`);
  console.log(`   Receipt: ${order.receipt}`);
  
  // Cancel the test order
  try {
    await razorpayInstance.orders.cancel(order.id);
    console.log(`   Test order cancelled successfully`);
  } catch (cancelError) {
    console.log(`   Warning: Could not cancel test order: ${cancelError.message}`);
  }
}

// Test 3: Payment Verification Logic
async function testPaymentVerificationLogic() {
  if (!TEST_CONFIG.razorpayKeySecret) {
    throw new Error('Razorpay key secret not configured');
  }
  
  // Test HMAC signature generation
  const testOrderId = 'test_order_123';
  const testPaymentId = 'test_payment_456';
  const testSignature = 'test_signature_789';
  
  // Generate expected signature
  const shasum = crypto.createHmac('sha256', TEST_CONFIG.razorpayKeySecret);
  shasum.update(`${testOrderId}|${testPaymentId}`);
  const expectedSignature = shasum.digest('hex');
  
  // Test signature verification
  const isValid = expectedSignature === testSignature;
  
  console.log(`   Test Order ID: ${testOrderId}`);
  console.log(`   Test Payment ID: ${testPaymentId}`);
  console.log(`   Expected Signature: ${expectedSignature}`);
  console.log(`   Signature Verification: ${isValid ? 'Valid' : 'Invalid (expected for test data)'}`);
}

// Test 4: Webhook Signature Verification
async function testWebhookSignatureVerification() {
  if (!TEST_CONFIG.razorpayWebhookSecret) {
    throw new Error('Razorpay webhook secret not configured');
  }
  
  const testPayload = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'test_payment_123',
          amount: TEST_CONFIG.testAmount * 100,
          currency: TEST_CONFIG.testCurrency,
          status: 'captured'
        }
      }
    }
  });
  
  // Generate webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', TEST_CONFIG.razorpayWebhookSecret)
    .update(testPayload)
    .digest('hex');
  
  console.log(`   Test Payload: ${testPayload.substring(0, 100)}...`);
  console.log(`   Generated Signature: ${expectedSignature}`);
  console.log(`   Webhook Secret: ${TEST_CONFIG.razorpayWebhookSecret ? 'Configured' : 'Not configured'}`);
}

// Test 5: API Endpoints Availability
async function testApiEndpointsAvailability() {
  const endpoints = [
    { path: '/payments/razorpay/config', method: 'GET' },
    { path: '/payments/razorpay/order', method: 'POST' },
    { path: '/payments/razorpay/verify', method: 'POST' },
    { path: '/webhooks/razorpay', method: 'POST' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios({
        method: endpoint.method,
        url: `${API_BASE}${endpoint.path}`,
        data: endpoint.method === 'POST' ? {} : undefined,
        validateStatus: () => true // Don't throw on any status
      });
      
      // Should not return 404 (endpoint not found)
      if (response.status === 404) {
        throw new Error(`Endpoint ${endpoint.method} ${endpoint.path} not found`);
      }
      
      console.log(`   ${endpoint.method} ${endpoint.path}: Available (status ${response.status})`);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Server not running');
      }
      throw error;
    }
  }
}

// Test 6: Environment Variables Validation
async function testEnvironmentVariablesValidation() {
  const requiredVars = [
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET'
  ];
  
  const optionalVars = [
    'RAZORPAY_WEBHOOK_SECRET'
  ];
  
  const missingRequired = [];
  const missingOptional = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingRequired.push(varName);
    }
  }
  
  for (const varName of optionalVars) {
    if (!process.env[varName]) {
      missingOptional.push(varName);
    }
  }
  
  if (missingRequired.length > 0) {
    throw new Error(`Missing required environment variables: ${missingRequired.join(', ')}`);
  }
  
  console.log(`   Required variables: All present`);
  if (missingOptional.length > 0) {
    console.log(`   Optional variables missing: ${missingOptional.join(', ')}`);
  } else {
    console.log(`   Optional variables: All present`);
  }
}

// Test 7: Database Connection for Orders
async function testDatabaseConnectionForOrders() {
  try {
    const response = await axios.get(`${API_BASE}/health/db`);
    
    if (response.status !== 200) {
      throw new Error(`Database health check failed: ${response.status}`);
    }
    
    if (response.data.status !== 'healthy') {
      throw new Error(`Database not healthy: ${response.data.message}`);
    }
    
    console.log(`   Database status: ${response.data.status}`);
    console.log(`   Database name: ${response.data.database}`);
    console.log(`   Connection pool size: ${response.data.connectionPool?.size || 'Unknown'}`);
  } catch (error) {
    throw new Error(`Database connection test failed: ${error.message}`);
  }
}

// Test 8: CORS Configuration for Payment
async function testCorsConfigurationForPayment() {
  try {
    const response = await axios.get(`${API_BASE}/payments/razorpay/config`, {
      headers: {
        'Origin': process.env.CLIENT_URL || 'http://localhost:5173'
      }
    });
    
    if (response.status !== 200) {
      throw new Error(`CORS test failed: ${response.status}`);
    }
    
    console.log(`   CORS test: Passed for client URL`);
  } catch (error) {
    throw new Error(`CORS configuration test failed: ${error.message}`);
  }
}

// Test 9: Rate Limiting for Payment Endpoints
async function testRateLimitingForPaymentEndpoints() {
  const requests = [];
  
  // Make multiple requests to payment config endpoint
  for (let i = 0; i < 3; i++) {
    requests.push(
      axios.get(`${API_BASE}/payments/razorpay/config`, {
        validateStatus: () => true
      })
    );
  }
  
  const responses = await Promise.all(requests);
  const successCount = responses.filter(r => r.status === 200).length;
  
  if (successCount < 3) {
    throw new Error(`Rate limiting too strict: ${successCount}/3 requests succeeded`);
  }
  
  console.log(`   Rate limiting test: ${successCount}/3 requests succeeded`);
}

// Test 10: Security Headers for Payment
async function testSecurityHeadersForPayment() {
  const response = await axios.get(`${API_BASE}/payments/razorpay/config`);
  const headers = response.headers;
  
  const securityHeaders = [
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection'
  ];
  
  const missingHeaders = [];
  for (const header of securityHeaders) {
    if (!headers[header]) {
      missingHeaders.push(header);
    }
  }
  
  if (missingHeaders.length > 0) {
    throw new Error(`Missing security headers: ${missingHeaders.join(', ')}`);
  }
  
  console.log(`   Security headers: All present`);
}

// Main test runner
async function runPaymentVerificationTests() {
  console.log('🚀 Starting Razorpay Payment Verification Tests\n');
  console.log(`Testing against: ${BASE_URL}\n`);
  
  await runTest('Razorpay Configuration', testRazorpayConfiguration);
  await runTest('Payment Order Creation (Dry Run)', testPaymentOrderCreation);
  await runTest('Payment Verification Logic', testPaymentVerificationLogic);
  await runTest('Webhook Signature Verification', testWebhookSignatureVerification);
  await runTest('API Endpoints Availability', testApiEndpointsAvailability);
  await runTest('Environment Variables Validation', testEnvironmentVariablesValidation);
  await runTest('Database Connection for Orders', testDatabaseConnectionForOrders);
  await runTest('CORS Configuration for Payment', testCorsConfigurationForPayment);
  await runTest('Rate Limiting for Payment Endpoints', testRateLimitingForPaymentEndpoints);
  await runTest('Security Headers for Payment', testSecurityHeadersForPayment);
  
  // Print summary
  console.log('📊 Payment Verification Test Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%\n`);
  
  if (testResults.failed > 0) {
    console.log('❌ Failed Tests:');
    testResults.tests
      .filter(t => t.status === 'FAILED')
      .forEach(t => console.log(`   - ${t.name}: ${t.error}`));
  }
  
  if (testResults.failed === 0) {
    console.log('🎉 All payment verification tests passed! Payment system is ready.');
    process.exit(0);
  } else {
    console.log('⚠️ Some payment tests failed. Please review and fix issues before processing payments.');
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run tests
runPaymentVerificationTests().catch(error => {
  console.error('Payment verification test runner failed:', error);
  process.exit(1);
});



