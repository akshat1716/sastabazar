const axios = require("axios");
const { config } = require("../server/config");
const { logger } = require("../server/config/logger");

// Smoke Test Configuration
const SMOKE_TEST_CONFIG = {
  baseURL: process.env.SMOKE_TEST_URL || config.urls.server,
  timeout: 30000,
  testUser: {
    email: "smoketest@example.com",
    password: "smoketest123",
    firstName: "Smoke",
    lastName: "Test",
  },
  testProduct: {
    name: "Smoke Test Product",
    price: 100,
    description: "Product for smoke testing",
    category: "test",
    stock: 10,
  },
};

class SmokeTestSuite {
  constructor() {
    this.results = [];
    this.authToken = null;
    this.userId = null;
    this.productId = null;
    this.orderId = null;
    this.cartId = null;
  }

  // Helper method to log test results
  logTestResult(testName, passed, details = {}) {
    const result = {
      test: testName,
      passed,
      timestamp: new Date().toISOString(),
      details,
      environment: config.nodeEnv,
    };

    this.results.push(result);

    if (passed) {
      logger.info({ smokeTestResult: result }, `✅ ${testName} - PASSED`);
    } else {
      logger.error({ smokeTestResult: result }, `❌ ${testName} - FAILED`);
    }

    return result;
  }

  // Helper method to make API requests
  async makeRequest(method, endpoint, data = null, headers = {}) {
    try {
      const requestConfig = {
        method,
        url: `${SMOKE_TEST_CONFIG.baseURL}${endpoint}`,
        timeout: SMOKE_TEST_CONFIG.timeout,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      };

      if (data) {
        requestConfig.data = data;
      }

      const response = await axios(requestConfig);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500,
      };
    }
  }

  // Test 1: Environment Configuration
  async testEnvironmentConfiguration() {
    logger.info("🔧 Testing environment configuration...");

    const checks = [];

    // Check for hardcoded URLs
    const hardcodedUrls = [
      "localhost:5001",
      "localhost:3000",
      "127.0.0.1",
      "your-domain.com",
      "your-server.com",
    ];

    const configString = JSON.stringify(config);
    hardcodedUrls.forEach((url) => {
      if (configString.includes(url)) {
        checks.push(`Hardcoded URL found: ${url}`);
      }
    });

    // Check required environment variables
    const requiredEnvVars = ["MONGODB_URI", "JWT_SECRET", "NODE_ENV", "PORT"];

    requiredEnvVars.forEach((envVar) => {
      if (!process.env[envVar]) {
        checks.push(`Missing environment variable: ${envVar}`);
      }
    });

    // Check for default values
    if (
      config.jwt.secret.includes("your-super-secret") ||
      config.jwt.secret.includes("change-this")
    ) {
      checks.push("Default JWT secret detected");
    }

    if (checks.length === 0) {
      return this.logTestResult("Environment Configuration", true, {
        nodeEnv: config.nodeEnv,
        port: config.port,
        hasMongoUri: !!config.database.uri,
        hasJwtSecret: !!config.jwt.secret,
      });
    } else {
      return this.logTestResult("Environment Configuration", false, {
        issues: checks,
      });
    }
  }

  // Test 2: API Health Checks
  async testApiHealthChecks() {
    logger.info("🏥 Testing API health checks...");

    // Test main health endpoint
    const healthResult = await this.makeRequest("GET", "/api/health");

    if (!healthResult.success || healthResult.status !== 200) {
      return this.logTestResult("API Health Check", false, {
        error: healthResult.error,
        status: healthResult.status,
      });
    }

    // Test database health endpoint
    const dbHealthResult = await this.makeRequest("GET", "/api/health/db");

    if (!dbHealthResult.success || dbHealthResult.status !== 200) {
      return this.logTestResult("Database Health Check", false, {
        error: dbHealthResult.error,
        status: dbHealthResult.status,
      });
    }

    return this.logTestResult("API Health Checks", true, {
      apiHealth: healthResult.data,
      dbHealth: dbHealthResult.data,
    });
  }

  // Test 3: Authentication Flow
  async testAuthenticationFlow() {
    logger.info("🔐 Testing authentication flow...");

    // Test user registration
    const registerResult = await this.makeRequest(
      "POST",
      "/api/auth/register",
      {
        email: SMOKE_TEST_CONFIG.testUser.email,
        password: SMOKE_TEST_CONFIG.testUser.password,
        firstName: SMOKE_TEST_CONFIG.testUser.firstName,
        lastName: SMOKE_TEST_CONFIG.testUser.lastName,
      },
    );

    if (!registerResult.success && registerResult.status !== 409) {
      return this.logTestResult("User Registration", false, {
        error: registerResult.error,
        status: registerResult.status,
      });
    }

    // Test user login
    const loginResult = await this.makeRequest("POST", "/api/auth/login", {
      email: SMOKE_TEST_CONFIG.testUser.email,
      password: SMOKE_TEST_CONFIG.testUser.password,
    });

    if (!loginResult.success || !loginResult.data.token) {
      return this.logTestResult("User Login", false, {
        error: loginResult.error,
        status: loginResult.status,
      });
    }

    this.authToken = loginResult.data.token;
    this.userId = loginResult.data.user?.id;

    // Test protected route access
    const profileResult = await this.makeRequest(
      "GET",
      "/api/auth/profile",
      null,
      {
        Authorization: `Bearer ${this.authToken}`,
      },
    );

    if (!profileResult.success || profileResult.status !== 200) {
      return this.logTestResult("Protected Route Access", false, {
        error: profileResult.error,
        status: profileResult.status,
      });
    }

    return this.logTestResult("Authentication Flow", true, {
      userId: this.userId,
      hasToken: !!this.authToken,
      profileData: profileResult.data,
    });
  }

  // Test 4: Product Catalog
  async testProductCatalog() {
    logger.info("📦 Testing product catalog...");

    // Test product listing
    const productsResult = await this.makeRequest("GET", "/api/products");

    if (!productsResult.success || productsResult.status !== 200) {
      return this.logTestResult("Product Listing", false, {
        error: productsResult.error,
        status: productsResult.status,
      });
    }

    // Test product search
    const searchResult = await this.makeRequest(
      "GET",
      "/api/products?search=test",
    );

    if (!searchResult.success || searchResult.status !== 200) {
      return this.logTestResult("Product Search", false, {
        error: searchResult.error,
        status: searchResult.status,
      });
    }

    // Test product filtering
    const filterResult = await this.makeRequest(
      "GET",
      "/api/products?category=test",
    );

    if (!filterResult.success || filterResult.status !== 200) {
      return this.logTestResult("Product Filtering", false, {
        error: filterResult.error,
        status: filterResult.status,
      });
    }

    // Test individual product access
    if (
      productsResult.data.products &&
      productsResult.data.products.length > 0
    ) {
      const productId = productsResult.data.products[0]._id;
      const productDetailResult = await this.makeRequest(
        "GET",
        `/api/products/${productId}`,
      );

      if (!productDetailResult.success || productDetailResult.status !== 200) {
        return this.logTestResult("Product Detail", false, {
          error: productDetailResult.error,
          status: productDetailResult.status,
          productId,
        });
      }

      this.productId = productId;
    }

    return this.logTestResult("Product Catalog", true, {
      productCount: productsResult.data.products?.length || 0,
      hasProducts: (productsResult.data.products?.length || 0) > 0,
      selectedProductId: this.productId,
    });
  }

  // Test 5: Shopping Cart
  async testShoppingCart() {
    logger.info("🛒 Testing shopping cart...");

    if (!this.productId) {
      return this.logTestResult("Shopping Cart", false, {
        error: "No product available for cart testing",
      });
    }

    // Test add to cart
    const addToCartResult = await this.makeRequest(
      "POST",
      "/api/cart/add",
      {
        productId: this.productId,
        quantity: 1,
      },
      {
        Authorization: `Bearer ${this.authToken}`,
      },
    );

    if (!addToCartResult.success || addToCartResult.status !== 200) {
      return this.logTestResult("Add to Cart", false, {
        error: addToCartResult.error,
        status: addToCartResult.status,
      });
    }

    // Test get cart
    const getCartResult = await this.makeRequest("GET", "/api/cart", null, {
      Authorization: `Bearer ${this.authToken}`,
    });

    if (!getCartResult.success || getCartResult.status !== 200) {
      return this.logTestResult("Get Cart", false, {
        error: getCartResult.error,
        status: getCartResult.status,
      });
    }

    // Test update cart item
    if (getCartResult.data.items && getCartResult.data.items.length > 0) {
      const itemId = getCartResult.data.items[0]._id;
      const updateCartResult = await this.makeRequest(
        "PUT",
        `/api/cart/update/${itemId}`,
        {
          quantity: 2,
        },
        {
          Authorization: `Bearer ${this.authToken}`,
        },
      );

      if (!updateCartResult.success || updateCartResult.status !== 200) {
        return this.logTestResult("Update Cart Item", false, {
          error: updateCartResult.error,
          status: updateCartResult.status,
        });
      }
    }

    return this.logTestResult("Shopping Cart", true, {
      cartItems: getCartResult.data.items?.length || 0,
      cartTotal: getCartResult.data.total || 0,
    });
  }

  // Test 6: Checkout Flow (without payment)
  async testCheckoutFlow() {
    logger.info("💳 Testing checkout flow...");

    // Test create order (without payment)
    const createOrderResult = await this.makeRequest(
      "POST",
      "/api/orders",
      {
        items: [
          {
            productId: this.productId,
            quantity: 1,
            price: 100,
          },
        ],
        shippingAddress: {
          street: "123 Test Street",
          city: "Test City",
          state: "Test State",
          zipCode: "12345",
          country: "India",
        },
        paymentMethod: "test",
      },
      {
        Authorization: `Bearer ${this.authToken}`,
      },
    );

    if (!createOrderResult.success || createOrderResult.status !== 201) {
      return this.logTestResult("Create Order", false, {
        error: createOrderResult.error,
        status: createOrderResult.status,
      });
    }

    this.orderId = createOrderResult.data.order?._id;

    // Test get order
    const getOrderResult = await this.makeRequest(
      "GET",
      `/api/orders/${this.orderId}`,
      null,
      {
        Authorization: `Bearer ${this.authToken}`,
      },
    );

    if (!getOrderResult.success || getOrderResult.status !== 200) {
      return this.logTestResult("Get Order", false, {
        error: getOrderResult.error,
        status: getOrderResult.status,
      });
    }

    return this.logTestResult("Checkout Flow", true, {
      orderId: this.orderId,
      orderStatus: getOrderResult.data.order?.status,
      orderTotal: getOrderResult.data.order?.total,
    });
  }

  // Test 7: Order History
  async testOrderHistory() {
    logger.info("📋 Testing order history...");

    // Test get user orders
    const ordersResult = await this.makeRequest("GET", "/api/orders", null, {
      Authorization: `Bearer ${this.authToken}`,
    });

    if (!ordersResult.success || ordersResult.status !== 200) {
      return this.logTestResult("Order History", false, {
        error: ordersResult.error,
        status: ordersResult.status,
      });
    }

    // Test order filtering
    const filteredOrdersResult = await this.makeRequest(
      "GET",
      "/api/orders?status=pending",
      null,
      {
        Authorization: `Bearer ${this.authToken}`,
      },
    );

    if (!filteredOrdersResult.success || filteredOrdersResult.status !== 200) {
      return this.logTestResult("Order Filtering", false, {
        error: filteredOrdersResult.error,
        status: filteredOrdersResult.status,
      });
    }

    return this.logTestResult("Order History", true, {
      totalOrders: ordersResult.data.orders?.length || 0,
      filteredOrders: filteredOrdersResult.data.orders?.length || 0,
    });
  }

  // Test 8: Payment Gateway Configuration
  async testPaymentGatewayConfiguration() {
    logger.info("💳 Testing payment gateway configuration...");

    // Test Razorpay configuration
    const razorpayConfigResult = await this.makeRequest(
      "GET",
      "/api/payments/razorpay/config",
    );

    if (!razorpayConfigResult.success || razorpayConfigResult.status !== 200) {
      return this.logTestResult("Razorpay Configuration", false, {
        error: razorpayConfigResult.error,
        status: razorpayConfigResult.status,
      });
    }

    // Test Stripe configuration
    const stripeConfigResult = await this.makeRequest(
      "GET",
      "/api/payments/stripe/config",
    );

    if (!stripeConfigResult.success || stripeConfigResult.status !== 200) {
      return this.logTestResult("Stripe Configuration", false, {
        error: stripeConfigResult.error,
        status: stripeConfigResult.status,
      });
    }

    return this.logTestResult("Payment Gateway Configuration", true, {
      razorpayConfigured: !!razorpayConfigResult.data.keyId,
      stripeConfigured: !!stripeConfigResult.data.publishableKey,
    });
  }

  // Test 9: Security Headers
  async testSecurityHeaders() {
    logger.info("🔒 Testing security headers...");

    const response = await axios.get(
      `${SMOKE_TEST_CONFIG.baseURL}/api/health`,
      {
        timeout: 10000,
      },
    );

    const headers = response.headers;
    const securityChecks = [];

    // Check for required security headers
    const requiredHeaders = [
      "x-content-type-options",
      "x-frame-options",
      "x-xss-protection",
      "strict-transport-security",
    ];

    requiredHeaders.forEach((header) => {
      if (!headers[header]) {
        securityChecks.push(`Missing security header: ${header}`);
      }
    });

    // Check for information disclosure
    if (headers["x-powered-by"]) {
      securityChecks.push("X-Powered-By header reveals server technology");
    }

    // Check CORS headers
    if (headers["access-control-allow-origin"] === "*") {
      securityChecks.push("CORS allows all origins (*)");
    }

    if (securityChecks.length === 0) {
      return this.logTestResult("Security Headers", true, {
        headersPresent: requiredHeaders.filter((h) => headers[h]).length,
        totalRequired: requiredHeaders.length,
      });
    } else {
      return this.logTestResult("Security Headers", false, {
        issues: securityChecks,
      });
    }
  }

  // Test 10: Error Handling
  async testErrorHandling() {
    logger.info("⚠️ Testing error handling...");

    // Test 404 handling
    const notFoundResult = await this.makeRequest("GET", "/api/nonexistent");

    if (notFoundResult.status !== 404) {
      return this.logTestResult("404 Error Handling", false, {
        expectedStatus: 404,
        actualStatus: notFoundResult.status,
      });
    }

    // Test unauthorized access
    const unauthorizedResult = await this.makeRequest(
      "GET",
      "/api/auth/profile",
    );

    if (unauthorizedResult.status !== 401) {
      return this.logTestResult("401 Error Handling", false, {
        expectedStatus: 401,
        actualStatus: unauthorizedResult.status,
      });
    }

    // Test invalid data handling
    const invalidDataResult = await this.makeRequest(
      "POST",
      "/api/auth/login",
      {
        email: "invalid-email",
        password: "",
      },
    );

    if (invalidDataResult.status !== 400) {
      return this.logTestResult("400 Error Handling", false, {
        expectedStatus: 400,
        actualStatus: invalidDataResult.status,
      });
    }

    return this.logTestResult("Error Handling", true, {
      notFoundHandled: notFoundResult.status === 404,
      unauthorizedHandled: unauthorizedResult.status === 401,
      badRequestHandled: invalidDataResult.status === 400,
    });
  }

  // Run all smoke tests
  async runAllTests() {
    logger.info("🚀 Starting comprehensive smoke test suite...");

    const startTime = Date.now();

    try {
      // Run tests in sequence
      await this.testEnvironmentConfiguration();
      await this.testApiHealthChecks();
      await this.testAuthenticationFlow();
      await this.testProductCatalog();
      await this.testShoppingCart();
      await this.testCheckoutFlow();
      await this.testOrderHistory();
      await this.testPaymentGatewayConfiguration();
      await this.testSecurityHeaders();
      await this.testErrorHandling();

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Generate test report
      const passedTests = this.results.filter((r) => r.passed).length;
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
          timestamp: new Date().toISOString(),
        },
        results: this.results,
      };

      logger.info({ smokeTestReport: report }, "📊 Smoke Test Report");

      return report;
    } catch (error) {
      logger.error({ error }, "❌ Smoke test suite failed with error");
      throw error;
    }
  }
}

// Export for use in other modules
module.exports = SmokeTestSuite;

// Run smoke tests if this file is executed directly
if (require.main === module) {
  const smokeTestSuite = new SmokeTestSuite();

  smokeTestSuite
    .runAllTests()
    .then((report) => {
      console.log("\n📊 Smoke Test Summary:");
      console.log(`Total Tests: ${report.summary.totalTests}`);
      console.log(`Passed: ${report.summary.passedTests}`);
      console.log(`Failed: ${report.summary.failedTests}`);
      console.log(`Success Rate: ${report.summary.successRate}`);
      console.log(`Duration: ${report.summary.duration}`);
      console.log(`Environment: ${report.summary.environment}`);

      if (report.summary.failedTests > 0) {
        console.log("\n❌ Failed Tests:");
        report.results
          .filter((r) => !r.passed)
          .forEach((test) => {
            console.log(
              `- ${test.test}: ${test.details.error || "Unknown error"}`,
            );
          });
      }

      process.exit(report.summary.failedTests > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error("Smoke test suite failed:", error);
      process.exit(1);
    });
}
