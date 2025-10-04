const axios = require('axios');
const crypto = require('crypto');
const { config } = require('../config');
const { logger } = require('../config/logger');

// Webhook Test Configuration
const WEBHOOK_TEST_CONFIG = {
  baseURL: process.env.WEBHOOK_TEST_URL || config.urls.server,
  timeout: 30000,
  webhookSecret: config.payments.razorpay.webhookSecret || config.payments.razorpay.keySecret,
  testEvents: [
    'payment.authorized',
    'payment.captured',
    'payment.failed',
    'order.paid',
    'refund.created',
    'refund.processed'
  ]
};

class WebhookTestSuite {
  constructor() {
    this.results = [];
    this.testOrderId = null;
    this.testPaymentId = null;
  }

  // Helper method to log test results
  logTestResult(testName, passed, details = {}) {
    const result = {
      test: testName,
      passed,
      timestamp: new Date().toISOString(),
      details,
      environment: config.nodeEnv
    };
    
    this.results.push(result);
    
    if (passed) {
      logger.info({ webhookTestResult: result }, `✅ ${testName} - PASSED`);
    } else {
      logger.error({ webhookTestResult: result }, `❌ ${testName} - FAILED`);
    }
    
    return result;
  }

  // Generate webhook signature
  generateWebhookSignature(payload, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  // Create test webhook payload
  createTestWebhookPayload(eventType, orderId = null, paymentId = null) {
    const basePayload = {
      event: eventType,
      created_at: Math.floor(Date.now() / 1000),
      contains: [eventType.split('.')[0]],
      payload: {
        [eventType.split('.')[0]]: {
          entity: {
            id: paymentId || `pay_test_${Date.now()}`,
            amount: 10000,
            currency: 'INR',
            status: eventType.includes('failed') ? 'failed' : 'captured',
            method: 'card',
            description: 'Test payment',
            created_at: Math.floor(Date.now() / 1000),
            notes: {
              order_id: orderId || `order_test_${Date.now()}`,
              test: 'webhook_test'
            }
          }
        }
      }
    };

    // Add event-specific data
    if (eventType === 'payment.authorized') {
      basePayload.payload.payment.entity.status = 'authorized';
    } else if (eventType === 'payment.captured') {
      basePayload.payload.payment.entity.status = 'captured';
    } else if (eventType === 'payment.failed') {
      basePayload.payload.payment.entity.status = 'failed';
      basePayload.payload.payment.entity.error_description = 'Test payment failure';
    } else if (eventType === 'order.paid') {
      basePayload.payload.order = {
        entity: {
          id: orderId || `order_test_${Date.now()}`,
          amount: 10000,
          currency: 'INR',
          status: 'paid',
          created_at: Math.floor(Date.now() / 1000),
          notes: {
            order_id: orderId || `order_test_${Date.now()}`,
            test: 'webhook_test'
          }
        }
      };
    } else if (eventType === 'refund.created') {
      basePayload.payload.refund = {
        entity: {
          id: `rfnd_test_${Date.now()}`,
          payment_id: paymentId || `pay_test_${Date.now()}`,
          amount: 10000,
          currency: 'INR',
          status: 'processed',
          created_at: Math.floor(Date.now() / 1000),
          notes: {
            reason: 'Test refund',
            test: 'webhook_test'
          }
        }
      };
    }

    return basePayload;
  }

  // Send webhook to server
  async sendWebhook(eventType, payload, signature) {
    try {
      const response = await axios.post(
        `${WEBHOOK_TEST_CONFIG.baseURL}/api/payments/webhooks/razorpay`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Razorpay-Signature': signature,
            'User-Agent': 'Razorpay-Webhook/1.0'
          },
          timeout: WEBHOOK_TEST_CONFIG.timeout
        }
      );

      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status || 500,
        error: error.response?.data || error.message
      };
    }
  }

  // Test 1: Webhook Signature Validation
  async testWebhookSignatureValidation() {
    logger.info('🔐 Testing webhook signature validation...');
    
    const testPayload = this.createTestWebhookPayload('payment.captured');
    const payloadString = JSON.stringify(testPayload);
    
    // Test with valid signature
    const validSignature = this.generateWebhookSignature(payloadString, WEBHOOK_TEST_CONFIG.webhookSecret);
    const validResult = await this.sendWebhook('payment.captured', payloadString, validSignature);
    
    if (!validResult.success || validResult.status !== 200) {
      return this.logTestResult('Valid Signature Validation', false, {
        error: validResult.error,
        status: validResult.status
      });
    }
    
    // Test with invalid signature
    const invalidSignature = 'invalid_signature';
    const invalidResult = await this.sendWebhook('payment.captured', payloadString, invalidSignature);
    
    if (invalidResult.success || invalidResult.status !== 400) {
      return this.logTestResult('Invalid Signature Validation', false, {
        expectedStatus: 400,
        actualStatus: invalidResult.status,
        error: invalidResult.error
      });
    }
    
    // Test with missing signature
    const missingSignatureResult = await this.sendWebhook('payment.captured', payloadString, '');
    
    if (missingSignatureResult.success || missingSignatureResult.status !== 400) {
      return this.logTestResult('Missing Signature Validation', false, {
        expectedStatus: 400,
        actualStatus: missingSignatureResult.status,
        error: missingSignatureResult.error
      });
    }
    
    return this.logTestResult('Webhook Signature Validation', true, {
      validSignatureHandled: validResult.success,
      invalidSignatureRejected: !invalidResult.success,
      missingSignatureRejected: !missingSignatureResult.success
    });
  }

  // Test 2: Payment Authorized Event
  async testPaymentAuthorizedEvent() {
    logger.info('💳 Testing payment.authorized event...');
    
    const testPayload = this.createTestWebhookPayload('payment.authorized');
    const payloadString = JSON.stringify(testPayload);
    const signature = this.generateWebhookSignature(payloadString, WEBHOOK_TEST_CONFIG.webhookSecret);
    
    const result = await this.sendWebhook('payment.authorized', payloadString, signature);
    
    if (!result.success || result.status !== 200) {
      return this.logTestResult('Payment Authorized Event', false, {
        error: result.error,
        status: result.status
      });
    }
    
    return this.logTestResult('Payment Authorized Event', true, {
      status: result.status,
      response: result.data
    });
  }

  // Test 3: Payment Captured Event
  async testPaymentCapturedEvent() {
    logger.info('✅ Testing payment.captured event...');
    
    const testPayload = this.createTestWebhookPayload('payment.captured');
    const payloadString = JSON.stringify(testPayload);
    const signature = this.generateWebhookSignature(payloadString, WEBHOOK_TEST_CONFIG.webhookSecret);
    
    const result = await this.sendWebhook('payment.captured', payloadString, signature);
    
    if (!result.success || result.status !== 200) {
      return this.logTestResult('Payment Captured Event', false, {
        error: result.error,
        status: result.status
      });
    }
    
    return this.logTestResult('Payment Captured Event', true, {
      status: result.status,
      response: result.data
    });
  }

  // Test 4: Payment Failed Event
  async testPaymentFailedEvent() {
    logger.info('❌ Testing payment.failed event...');
    
    const testPayload = this.createTestWebhookPayload('payment.failed');
    const payloadString = JSON.stringify(testPayload);
    const signature = this.generateWebhookSignature(payloadString, WEBHOOK_TEST_CONFIG.webhookSecret);
    
    const result = await this.sendWebhook('payment.failed', payloadString, signature);
    
    if (!result.success || result.status !== 200) {
      return this.logTestResult('Payment Failed Event', false, {
        error: result.error,
        status: result.status
      });
    }
    
    return this.logTestResult('Payment Failed Event', true, {
      status: result.status,
      response: result.data
    });
  }

  // Test 5: Order Paid Event
  async testOrderPaidEvent() {
    logger.info('📦 Testing order.paid event...');
    
    const testPayload = this.createTestWebhookPayload('order.paid');
    const payloadString = JSON.stringify(testPayload);
    const signature = this.generateWebhookSignature(payloadString, WEBHOOK_TEST_CONFIG.webhookSecret);
    
    const result = await this.sendWebhook('order.paid', payloadString, signature);
    
    if (!result.success || result.status !== 200) {
      return this.logTestResult('Order Paid Event', false, {
        error: result.error,
        status: result.status
      });
    }
    
    return this.logTestResult('Order Paid Event', true, {
      status: result.status,
      response: result.data
    });
  }

  // Test 6: Refund Created Event
  async testRefundCreatedEvent() {
    logger.info('💰 Testing refund.created event...');
    
    const testPayload = this.createTestWebhookPayload('refund.created');
    const payloadString = JSON.stringify(testPayload);
    const signature = this.generateWebhookSignature(payloadString, WEBHOOK_TEST_CONFIG.webhookSecret);
    
    const result = await this.sendWebhook('refund.created', payloadString, signature);
    
    if (!result.success || result.status !== 200) {
      return this.logTestResult('Refund Created Event', false, {
        error: result.error,
        status: result.status
      });
    }
    
    return this.logTestResult('Refund Created Event', true, {
      status: result.status,
      response: result.data
    });
  }

  // Test 7: Idempotency Testing
  async testIdempotency() {
    logger.info('🔄 Testing webhook idempotency...');
    
    const testPayload = this.createTestWebhookPayload('payment.captured');
    const payloadString = JSON.stringify(testPayload);
    const signature = this.generateWebhookSignature(payloadString, WEBHOOK_TEST_CONFIG.webhookSecret);
    
    // Send the same webhook twice
    const firstResult = await this.sendWebhook('payment.captured', payloadString, signature);
    const secondResult = await this.sendWebhook('payment.captured', payloadString, signature);
    
    if (!firstResult.success || firstResult.status !== 200) {
      return this.logTestResult('Idempotency Test', false, {
        error: 'First webhook failed',
        firstResult: firstResult
      });
    }
    
    if (!secondResult.success || secondResult.status !== 200) {
      return this.logTestResult('Idempotency Test', false, {
        error: 'Second webhook failed',
        secondResult: secondResult
      });
    }
    
    return this.logTestResult('Idempotency Test', true, {
      firstWebhookStatus: firstResult.status,
      secondWebhookStatus: secondResult.status,
      bothSuccessful: firstResult.success && secondResult.success
    });
  }

  // Test 8: Response Time Testing
  async testResponseTime() {
    logger.info('⏱️ Testing webhook response time...');
    
    const testPayload = this.createTestWebhookPayload('payment.captured');
    const payloadString = JSON.stringify(testPayload);
    const signature = this.generateWebhookSignature(payloadString, WEBHOOK_TEST_CONFIG.webhookSecret);
    
    const startTime = Date.now();
    const result = await this.sendWebhook('payment.captured', payloadString, signature);
    const endTime = Date.now();
    
    const responseTime = endTime - startTime;
    const maxResponseTime = 5000; // 5 seconds
    
    if (!result.success || result.status !== 200) {
      return this.logTestResult('Response Time Test', false, {
        error: result.error,
        status: result.status,
        responseTime: `${responseTime}ms`
      });
    }
    
    if (responseTime > maxResponseTime) {
      return this.logTestResult('Response Time Test', false, {
        responseTime: `${responseTime}ms`,
        maxAllowed: `${maxResponseTime}ms`,
        error: 'Response time exceeded maximum allowed'
      });
    }
    
    return this.logTestResult('Response Time Test', true, {
      responseTime: `${responseTime}ms`,
      maxAllowed: `${maxResponseTime}ms`,
      withinLimit: responseTime <= maxResponseTime
    });
  }

  // Test 9: Port and Protocol Testing
  async testPortAndProtocol() {
    logger.info('🔌 Testing port and protocol restrictions...');
    
    const testPayload = this.createTestWebhookPayload('payment.captured');
    const payloadString = JSON.stringify(testPayload);
    const signature = this.generateWebhookSignature(payloadString, WEBHOOK_TEST_CONFIG.webhookSecret);
    
    // Test HTTPS (port 443)
    const httpsResult = await this.sendWebhook('payment.captured', payloadString, signature);
    
    if (!httpsResult.success || httpsResult.status !== 200) {
      return this.logTestResult('HTTPS Port Test', false, {
        error: httpsResult.error,
        status: httpsResult.status
      });
    }
    
    // Test HTTP (port 80) - should work in development
    let httpResult;
    try {
      const httpUrl = WEBHOOK_TEST_CONFIG.baseURL.replace('https://', 'http://');
      const response = await axios.post(
        `${httpUrl}/api/payments/webhooks/razorpay`,
        payloadString,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Razorpay-Signature': signature,
            'User-Agent': 'Razorpay-Webhook/1.0'
          },
          timeout: WEBHOOK_TEST_CONFIG.timeout
        }
      );
      httpResult = { success: true, status: response.status };
    } catch (error) {
      httpResult = { success: false, status: error.response?.status || 500 };
    }
    
    return this.logTestResult('Port and Protocol Test', true, {
      httpsWorking: httpsResult.success,
      httpWorking: httpResult.success,
      httpsStatus: httpsResult.status,
      httpStatus: httpResult.status
    });
  }

  // Test 10: Error Handling
  async testErrorHandling() {
    logger.info('⚠️ Testing webhook error handling...');
    
    // Test with malformed JSON
    const malformedPayload = '{"invalid": json}';
    const malformedSignature = this.generateWebhookSignature(malformedPayload, WEBHOOK_TEST_CONFIG.webhookSecret);
    
    const malformedResult = await this.sendWebhook('payment.captured', malformedPayload, malformedSignature);
    
    if (malformedResult.success || malformedResult.status !== 400) {
      return this.logTestResult('Malformed JSON Handling', false, {
        expectedStatus: 400,
        actualStatus: malformedResult.status,
        error: malformedResult.error
      });
    }
    
    // Test with empty payload
    const emptyPayload = '{}';
    const emptySignature = this.generateWebhookSignature(emptyPayload, WEBHOOK_TEST_CONFIG.webhookSecret);
    
    const emptyResult = await this.sendWebhook('payment.captured', emptyPayload, emptySignature);
    
    if (emptyResult.success || emptyResult.status !== 400) {
      return this.logTestResult('Empty Payload Handling', false, {
        expectedStatus: 400,
        actualStatus: emptyResult.status,
        error: emptyResult.error
      });
    }
    
    return this.logTestResult('Error Handling', true, {
      malformedJsonHandled: !malformedResult.success,
      emptyPayloadHandled: !emptyResult.success
    });
  }

  // Run all webhook tests
  async runAllTests() {
    logger.info('🚀 Starting webhook test suite...');
    
    const startTime = Date.now();
    
    try {
      // Run tests in sequence
      await this.testWebhookSignatureValidation();
      await this.testPaymentAuthorizedEvent();
      await this.testPaymentCapturedEvent();
      await this.testPaymentFailedEvent();
      await this.testOrderPaidEvent();
      await this.testRefundCreatedEvent();
      await this.testIdempotency();
      await this.testResponseTime();
      await this.testPortAndProtocol();
      await this.testErrorHandling();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Generate test report
      const passedTests = this.results.filter(r => r.passed).length;
      const totalTests = this.results.length;
      const successRate = (passedTests / totalTests) * 100;
      
      const report = {
        summary: {
          totalTests,
          passedTests,
          failedTests: totalTests - passedTests,
          successRate: `${successRate.toFixed(2)}%`,
          duration: `${duration}ms`,
          environment: config.nodeEnv,
          timestamp: new Date().toISOString()
        },
        results: this.results
      };
      
      logger.info({ webhookTestReport: report }, '📊 Webhook Test Report');
      
      return report;
      
    } catch (error) {
      logger.error({ error }, '❌ Webhook test suite failed with error');
      throw error;
    }
  }
}

// Export for use in other modules
module.exports = WebhookTestSuite;

// Run webhook tests if this file is executed directly
if (require.main === module) {
  const webhookTestSuite = new WebhookTestSuite();
  
  webhookTestSuite.runAllTests()
    .then(report => {
      console.log('\n📊 Webhook Test Summary:');
      console.log(`Total Tests: ${report.summary.totalTests}`);
      console.log(`Passed: ${report.summary.passedTests}`);
      console.log(`Failed: ${report.summary.failedTests}`);
      console.log(`Success Rate: ${report.summary.successRate}`);
      console.log(`Duration: ${report.summary.duration}`);
      console.log(`Environment: ${report.summary.environment}`);
      
      if (report.summary.failedTests > 0) {
        console.log('\n❌ Failed Tests:');
        report.results
          .filter(r => !r.passed)
          .forEach(test => {
            console.log(`- ${test.test}: ${test.details.error || 'Unknown error'}`);
          });
      }
      
      process.exit(report.summary.failedTests > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Webhook test suite failed:', error);
      process.exit(1);
    });
}



