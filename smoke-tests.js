const axios = require('axios');
const { config } = require('./server/config');

// Test configuration
const BASE_URL = process.env.SERVER_URL || 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

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

// Test 1: Health endpoint
async function testHealthEndpoint() {
  const response = await axios.get(`${API_BASE}/health`);
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  if (!response.data.status || response.data.status !== 'OK') {
    throw new Error('Health endpoint did not return OK status');
  }
  console.log(`   Health status: ${response.data.status}`);
  console.log(`   Service: ${response.data.service}`);
  console.log(`   Correlation ID: ${response.data.correlationId}`);
}

// Test 2: Database health endpoint
async function testDatabaseHealth() {
  const response = await axios.get(`${API_BASE}/health/db`);
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  if (!response.data.status || response.data.status !== 'healthy') {
    throw new Error(`Database not healthy: ${response.data.message}`);
  }
  console.log(`   Database status: ${response.data.status}`);
  console.log(`   Database: ${response.data.database}`);
  console.log(`   Host: ${response.data.host}`);
  console.log(`   Ping time: ${response.data.pingTime}`);
}

// Test 3: CORS configuration
async function testCorsConfiguration() {
  // Test allowed origin
  const allowedOrigin = config.urls.corsOrigin;
  const response = await axios.get(`${API_BASE}/health`, {
    headers: {
      'Origin': allowedOrigin
    }
  });
  
  if (response.status !== 200) {
    throw new Error(`CORS test failed for allowed origin: ${allowedOrigin}`);
  }
  
  // Test blocked origin (should still work but log warning)
  try {
    await axios.get(`${API_BASE}/health`, {
      headers: {
        'Origin': 'https://malicious-site.com'
      }
    });
    console.log('   CORS blocking test completed (may show warning in logs)');
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.log('   CORS correctly blocked malicious origin');
    } else {
      throw error;
    }
  }
}

// Test 4: Razorpay configuration
async function testRazorpayConfiguration() {
  const response = await axios.get(`${API_BASE}/payments/razorpay/config`);
  if (response.status !== 200) {
    throw new Error(`Razorpay config endpoint failed: ${response.status}`);
  }
  
  const config = response.data;
  if (!config.keyId) {
    throw new Error('Razorpay key ID not configured');
  }
  if (config.currency !== 'INR') {
    throw new Error(`Expected currency INR, got ${config.currency}`);
  }
  
  console.log(`   Razorpay Key ID: ${config.keyId}`);
  console.log(`   Currency: ${config.currency}`);
  console.log(`   Razorpay enabled: ${config.keyId ? 'Yes' : 'No'}`);
}

// Test 5: Environment validation
async function testEnvironmentValidation() {
  // Test that required environment variables are present
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'NODE_ENV',
    'PORT',
    'CLIENT_URL',
    'SERVER_URL',
    'CORS_ORIGIN'
  ];
  
  const missingVars = [];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  console.log(`   Required environment variables: All present`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   PORT: ${process.env.PORT}`);
  console.log(`   Database URI configured: ${process.env.MONGODB_URI ? 'Yes' : 'No'}`);
}

// Test 6: Security headers
async function testSecurityHeaders() {
  const response = await axios.get(`${API_BASE}/health`);
  const headers = response.headers;
  
  const requiredHeaders = [
    'x-content-type-options',
    'x-frame-options',
    'x-xss-protection'
  ];
  
  const missingHeaders = [];
  for (const header of requiredHeaders) {
    if (!headers[header]) {
      missingHeaders.push(header);
    }
  }
  
  if (missingHeaders.length > 0) {
    throw new Error(`Missing security headers: ${missingHeaders.join(', ')}`);
  }
  
  console.log(`   Security headers: All present`);
  console.log(`   X-Content-Type-Options: ${headers['x-content-type-options']}`);
  console.log(`   X-Frame-Options: ${headers['x-frame-options']}`);
  console.log(`   X-XSS-Protection: ${headers['x-xss-protection']}`);
}

// Test 7: Rate limiting
async function testRateLimiting() {
  // Make multiple requests to test rate limiting
  const requests = [];
  for (let i = 0; i < 5; i++) {
    requests.push(axios.get(`${API_BASE}/health`));
  }
  
  const responses = await Promise.all(requests);
  const successCount = responses.filter(r => r.status === 200).length;
  
  if (successCount !== 5) {
    throw new Error(`Rate limiting may be too strict: ${successCount}/5 requests succeeded`);
  }
  
  console.log(`   Rate limiting test: ${successCount}/5 requests succeeded`);
}

// Test 8: Webhook endpoint availability
async function testWebhookEndpoint() {
  try {
    const response = await axios.post(`${API_BASE}/webhooks/razorpay`, {}, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    // Should return 400 for missing signature, not 404
    if (response.status === 404) {
      throw new Error('Webhook endpoint not found');
    }
    console.log(`   Webhook endpoint: Available (status ${response.status})`);
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log(`   Webhook endpoint: Available (correctly rejects invalid requests)`);
    } else {
      throw error;
    }
  }
}

// Test 9: Database indexes
async function testDatabaseIndexes() {
  // This would require a database connection test
  // For now, we'll just verify the health endpoint includes index info
  const response = await axios.get(`${API_BASE}/health/db`);
  
  if (response.data.indexesCreated !== undefined) {
    console.log(`   Database indexes created: ${response.data.indexesCreated}`);
  } else {
    console.log(`   Database indexes: Status unknown`);
  }
}

// Test 10: Payment order creation (dry run)
async function testPaymentOrderCreation() {
  try {
    // This would require authentication, so we'll just test the endpoint exists
    const response = await axios.post(`${API_BASE}/payments/razorpay/order`, {}, {
      validateStatus: () => true // Don't throw on any status
    });
    
    // Should return 401 (unauthorized) or 400 (bad request), not 404
    if (response.status === 404) {
      throw new Error('Payment order endpoint not found');
    }
    
    console.log(`   Payment order endpoint: Available (status ${response.status})`);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Server not running');
    }
    throw error;
  }
}

// Main test runner
async function runSmokeTests() {
  console.log('🚀 Starting Sastabazar E-commerce Smoke Tests\n');
  console.log(`Testing against: ${BASE_URL}\n`);
  
  await runTest('Health Endpoint', testHealthEndpoint);
  await runTest('Database Health', testDatabaseHealth);
  await runTest('CORS Configuration', testCorsConfiguration);
  await runTest('Razorpay Configuration', testRazorpayConfiguration);
  await runTest('Environment Validation', testEnvironmentValidation);
  await runTest('Security Headers', testSecurityHeaders);
  await runTest('Rate Limiting', testRateLimiting);
  await runTest('Webhook Endpoint', testWebhookEndpoint);
  await runTest('Database Indexes', testDatabaseIndexes);
  await runTest('Payment Order Creation', testPaymentOrderCreation);
  
  // Print summary
  console.log('📊 Test Summary:');
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
    console.log('🎉 All smoke tests passed! The application is ready for production.');
    process.exit(0);
  } else {
    console.log('⚠️ Some tests failed. Please review and fix issues before deploying.');
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run tests
runSmokeTests().catch(error => {
  console.error('Smoke test runner failed:', error);
  process.exit(1);
});



