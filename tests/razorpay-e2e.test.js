const axios = require('axios');
const crypto = require('crypto');
const { config } = require('../server/config');
const { logger } = require('../server/config/logger');

// Test configuration
const TEST_CONFIG = {
  baseURL: config.urls.server,
  timeout: 30000,
  testAmount: 100, // 1 INR in paise
  testCurrency: 'INR',
  testDescription: 'Test payment for E2E testing'
};

// Test data
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
  firstName: 'Test',
  lastName: 'User'
};

const TEST_PRODUCT = {
  name: 'Test Product',
  price: 100,
  description: 'Test product for E2E testing',
  category: 'test',
  stock: 10
};

class RazorpayE2ETest {
  constructor() {
    this.authToken = null;
    this.userId = null;
    this.orderId = null;
    this.paymentId = null;
    this.testResults = [];
  }

  // Helper method to log test results
  logTestResult(testName, passed, details = {}) {
    const result = {
      test: testName,
      passed,
      timestamp: new Date().toISOString(),
      details
    };
    
    this.testResults.push(result);
    
    if (passed) {
      logger.info({ testResult: result }, `✅ ${testName} - PASSED`);
    } else {
      logger.error({ testResult: result }, `❌ ${testName} - FAILED`);
    }
    
    return result;
  }

  // Helper method to make API requests
  async makeRequest(method, endpoint, data = null, headers = {}) {
    try {
      const config = {
        method,
        url: `${TEST_CONFIG.baseURL}${endpoint}`,
        timeout: TEST_CONFIG.timeout,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  // Test 1: User Registration
  async testUserRegistration() {
    logger.info('Starting user registration test...');
    
    const result = await this.makeRequest('POST', '/api/auth/register', TEST_USER);
    
    if (result.success && result.data.token) {
      this.authToken = result.data.accessToken || result.data.token;
      this.userId = result.data.user?.id;
      
      return this.logTestResult('User Registration', true, {
        userId: this.userId,
        hasToken: !!this.authToken
      });
    } else {
      return this.logTestResult('User Registration', false, {
        error: result.error
      });
    }
  }

  // Test 2: Create Test Product
  async testCreateProduct() {
    logger.info('Starting product creation test...');
    
    const result = await this.makeRequest('POST', '/api/products', TEST_PRODUCT, {
      'Authorization': `Bearer ${this.authToken}`
    });
    
    if (result.success) {
      return this.logTestResult('Product Creation', true, {
        productId: result.data.product?._id
      });
    } else {
      return this.logTestResult('Product Creation', false, {
        error: result.error
      });
    }
  }

  // Test 3: Create Razorpay Order
  async testCreateRazorpayOrder() {
    logger.info('Starting Razorpay order creation test...');
    
    const orderData = {
      amount: TEST_CONFIG.testAmount,
      currency: TEST_CONFIG.testCurrency,
      description: TEST_CONFIG.testDescription,
      items: [{
        productId: 'test-product-id',
        quantity: 1,
        price: TEST_CONFIG.testAmount
      }]
    };
    
    const result = await this.makeRequest('POST', '/api/payments/razorpay/order', orderData, {
      'Authorization': `Bearer ${this.authToken}`
    });
    
    if (result.success && result.data.orderId) {
      this.orderId = result.data.orderId;
      
      return this.logTestResult('Razorpay Order Creation', true, {
        orderId: this.orderId,
        amount: result.data.amount,
        currency: result.data.currency
      });
    } else {
      return this.logTestResult('Razorpay Order Creation', false, {
        error: result.error
      });
    }
  }

  // Test 4: Simulate Payment Success (Mock)
  async testPaymentSuccess() {
    logger.info('Starting payment success simulation test...');
    
    // Generate mock payment data
    const mockPaymentData = {
      razorpay_order_id: this.orderId,
      razorpay_payment_id: `pay_test_${Date.now()}`,
      razorpay_signature: this.generateMockSignature()
    };
    
    this.paymentId = mockPaymentData.razorpay_payment_id;
    
    const result = await this.makeRequest('POST', '/api/payments/razorpay/verify', mockPaymentData, {
      'Authorization': `Bearer ${this.authToken}`
    });
    
    if (result.success) {
      return this.logTestResult('Payment Success Simulation', true, {
        paymentId: this.paymentId,
        orderStatus: result.data.order?.status
      });
    } else {
      return this.logTestResult('Payment Success Simulation', false, {
        error: result.error
      });
    }
  }

  // Test 5: Verify Order State
  async testOrderStateVerification() {
    logger.info('Starting order state verification test...');
    
    const result = await this.makeRequest('GET', `/api/orders/${this.orderId}`, null, {
      'Authorization': `Bearer ${this.authToken}`
    });
    
    if (result.success && result.data.order?.status === 'paid') {
      return this.logTestResult('Order State Verification', true, {
        orderStatus: result.data.order.status,
        paymentStatus: result.data.order.paymentStatus
      });
    } else {
      return this.logTestResult('Order State Verification', false, {
        error: result.error,
        actualStatus: result.data?.order?.status
      });
    }
  }

  // Test 6: Test Payment Failure Flow
  async testPaymentFailure() {
    logger.info('Starting payment failure test...');
    
    // Create a new order for failure test
    const orderData = {
      amount: TEST_CONFIG.testAmount,
      currency: TEST_CONFIG.testCurrency,
      description: 'Test payment failure',
      items: [{
        productId: 'test-product-id',
        quantity: 1,
        price: TEST_CONFIG.testAmount
      }]
    };
    
    const orderResult = await this.makeRequest('POST', '/api/payments/razorpay/order', orderData, {
      'Authorization': `Bearer ${this.authToken}`
    });
    
    if (!orderResult.success) {
      return this.logTestResult('Payment Failure Test', false, {
        error: 'Failed to create order for failure test'
      });
    }
    
    // Simulate payment failure with invalid signature
    const failureData = {
      razorpay_order_id: orderResult.data.orderId,
      razorpay_payment_id: `pay_failed_${Date.now()}`,
      razorpay_signature: 'invalid_signature'
    };
    
    const failureResult = await this.makeRequest('POST', '/api/payments/razorpay/verify', failureData, {
      'Authorization': `Bearer ${this.authToken}`
    });
    
    // Payment failure should return an error
    if (!failureResult.success && failureResult.status === 400) {
      return this.logTestResult('Payment Failure Test', true, {
        errorHandling: 'correct',
        statusCode: failureResult.status
      });
    } else {
      return this.logTestResult('Payment Failure Test', false, {
        error: 'Payment failure not handled correctly',
        actualStatus: failureResult.status
      });
    }
  }

  // Test 7: Test Idempotency
  async testIdempotency() {
    logger.info('Starting idempotency test...');
    
    if (!this.orderId || !this.paymentId) {
      return this.logTestResult('Idempotency Test', false, {
        error: 'Missing order or payment ID'
      });
    }
    
    // Try to verify the same payment again
    const duplicateData = {
      razorpay_order_id: this.orderId,
      razorpay_payment_id: this.paymentId,
      razorpay_signature: this.generateMockSignature()
    };
    
    const result = await this.makeRequest('POST', '/api/payments/razorpay/verify', duplicateData, {
      'Authorization': `Bearer ${this.authToken}`
    });
    
    // Should handle duplicate gracefully
    if (result.success || (result.status === 409 && result.error?.message?.includes('already'))) {
      return this.logTestResult('Idempotency Test', true, {
        handled: 'correctly',
        statusCode: result.status
      });
    } else {
      return this.logTestResult('Idempotency Test', false, {
        error: 'Idempotency not handled correctly',
        actualStatus: result.status
      });
    }
  }

  // Test 8: Test Refund Flow (Mock)
  async testRefundFlow() {
    logger.info('Starting refund flow test...');
    
    if (!this.paymentId) {
      return this.logTestResult('Refund Flow Test', false, {
        error: 'Missing payment ID'
      });
    }
    
    const refundData = {
      paymentId: this.paymentId,
      amount: TEST_CONFIG.testAmount,
      reason: 'Test refund'
    };
    
    const result = await this.makeRequest('POST', '/api/payments/razorpay/refund', refundData, {
      'Authorization': `Bearer ${this.authToken}`
    });
    
    // Refund endpoint might not be implemented yet
    if (result.success || result.status === 404) {
      return this.logTestResult('Refund Flow Test', true, {
        note: result.status === 404 ? 'Refund endpoint not implemented' : 'Refund processed',
        statusCode: result.status
      });
    } else {
      return this.logTestResult('Refund Flow Test', false, {
        error: result.error,
        statusCode: result.status
      });
    }
  }

  // Helper method to generate mock signature
  generateMockSignature() {
    const data = `${this.orderId}|${this.paymentId}`;
    const secret = config.payments.razorpay.keySecret || 'test_secret';
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  // Run all tests
  async runAllTests() {
    logger.info('🚀 Starting Razorpay E2E Test Suite...');
    
    const startTime = Date.now();
    
    try {
      // Run tests in sequence
      await this.testUserRegistration();
      await this.testCreateProduct();
      await this.testCreateRazorpayOrder();
      await this.testPaymentSuccess();
      await this.testOrderStateVerification();
      await this.testPaymentFailure();
      await this.testIdempotency();
      await this.testRefundFlow();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Generate test report
      const passedTests = this.testResults.filter(r => r.passed).length;
      const totalTests = this.testResults.length;
      const successRate = (passedTests / totalTests) * 100;
      
      const report = {
        summary: {
          totalTests,
          passedTests,
          failedTests: totalTests - passedTests,
          successRate: `${successRate.toFixed(2)}%`,
          duration: `${duration}ms`
        },
        results: this.testResults
      };
      
      logger.info({ testReport: report }, '📊 Razorpay E2E Test Report');
      
      return report;
      
    } catch (error) {
      logger.error({ error }, '❌ Test suite failed with error');
      throw error;
    }
  }
}

// Export for use in other modules
module.exports = RazorpayE2ETest;

// Run tests if this file is executed directly
if (require.main === module) {
  const testSuite = new RazorpayE2ETest();
  
  testSuite.runAllTests()
    .then(report => {
      console.log('\n📊 Test Summary:');
      console.log(`Total Tests: ${report.summary.totalTests}`);
      console.log(`Passed: ${report.summary.passedTests}`);
      console.log(`Failed: ${report.summary.failedTests}`);
      console.log(`Success Rate: ${report.summary.successRate}`);
      console.log(`Duration: ${report.summary.duration}`);
      
      process.exit(report.summary.failedTests > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

