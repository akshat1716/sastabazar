const autocannon = require("autocannon");
const { config } = require("../server/config");
const { logger } = require("../server/config/logger");

// Load test configuration
const LOAD_TEST_CONFIG = {
  baseURL: config.urls.server,
  duration: 30, // seconds
  connections: 10,
  pipelining: 1,
  requests: [
    {
      method: "GET",
      path: "/api/health",
    },
    {
      method: "GET",
      path: "/api/products",
    },
    {
      method: "GET",
      path: "/api/products?category=electronics",
    },
    {
      method: "GET",
      path: "/api/products?search=laptop",
    },
  ],
};

// Critical endpoints for load testing
const CRITICAL_ENDPOINTS = [
  {
    name: "Health Check",
    path: "/api/health",
    method: "GET",
    expectedStatus: 200,
    maxLatency: 100, // ms
  },
  {
    name: "Products List",
    path: "/api/products",
    method: "GET",
    expectedStatus: 200,
    maxLatency: 500, // ms
  },
  {
    name: "Product Search",
    path: "/api/products?search=test",
    method: "GET",
    expectedStatus: 200,
    maxLatency: 800, // ms
  },
  {
    name: "Product Category",
    path: "/api/products?category=electronics",
    method: "GET",
    expectedStatus: 200,
    maxLatency: 600, // ms
  },
];

class LoadTester {
  constructor() {
    this.results = [];
    this.baselines = {
      latency: {},
      errorRate: {},
      throughput: {},
    };
  }

  // Run load test for a specific endpoint
  async testEndpoint(endpoint, options = {}) {
    const testConfig = {
      url: `${LOAD_TEST_CONFIG.baseURL}${endpoint.path}`,
      method: endpoint.method,
      duration: options.duration || LOAD_TEST_CONFIG.duration,
      connections: options.connections || LOAD_TEST_CONFIG.connections,
      pipelining: options.pipelining || LOAD_TEST_CONFIG.pipelining,
      headers: options.headers || {},
    };

    logger.info(`Starting load test for ${endpoint.name}...`);

    try {
      const result = await autocannon(testConfig);

      const testResult = {
        endpoint: endpoint.name,
        path: endpoint.path,
        method: endpoint.method,
        duration: result.duration,
        requests: {
          total: result.requests.total,
          average: result.requests.average,
          min: result.requests.min,
          max: result.requests.max,
        },
        latency: {
          average: result.latency.average,
          min: result.latency.min,
          max: result.latency.max,
          p50: result.latency.p50,
          p90: result.latency.p90,
          p95: result.latency.p95,
          p99: result.latency.p99,
        },
        throughput: {
          average: result.throughput.average,
          min: result.throughput.min,
          max: result.throughput.max,
        },
        errors: result.errors,
        timeouts: result.timeouts,
        non2xx: result.non2xx,
        successRate:
          ((result.requests.total -
            result.errors -
            result.timeouts -
            result.non2xx) /
            result.requests.total) *
          100,
      };

      // Check if results meet expectations
      const meetsExpectations = this.validateResults(testResult, endpoint);
      testResult.meetsExpectations = meetsExpectations;

      this.results.push(testResult);

      logger.info(
        {
          loadTestResult: testResult,
        },
        `Load test completed for ${endpoint.name}`,
      );

      return testResult;
    } catch (error) {
      logger.error(
        { error, endpoint },
        `Load test failed for ${endpoint.name}`,
      );
      throw error;
    }
  }

  // Validate test results against expectations
  validateResults(result, endpoint) {
    const issues = [];

    // Check latency
    if (result.latency.average > endpoint.maxLatency) {
      issues.push(
        `Average latency ${result.latency.average}ms exceeds limit ${endpoint.maxLatency}ms`,
      );
    }

    // Check success rate
    if (result.successRate < 95) {
      issues.push(
        `Success rate ${result.successRate.toFixed(2)}% below 95% threshold`,
      );
    }

    // Check error rate
    if (result.errors > 0) {
      issues.push(`${result.errors} errors occurred`);
    }

    // Check timeouts
    if (result.timeouts > 0) {
      issues.push(`${result.timeouts} timeouts occurred`);
    }

    if (issues.length > 0) {
      logger.warn(
        {
          endpoint: endpoint.name,
          issues,
        },
        "Load test issues detected",
      );
      return false;
    }

    return true;
  }

  // Run load test for all critical endpoints
  async runCriticalEndpointsTest() {
    logger.info("🚀 Starting critical endpoints load test...");

    const startTime = Date.now();
    const results = [];

    for (const endpoint of CRITICAL_ENDPOINTS) {
      try {
        const result = await this.testEndpoint(endpoint);
        results.push(result);

        // Wait between tests to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error({ error, endpoint }, `Failed to test ${endpoint.name}`);
        results.push({
          endpoint: endpoint.name,
          error: error.message,
          meetsExpectations: false,
        });
      }
    }

    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    return {
      summary: {
        totalEndpoints: CRITICAL_ENDPOINTS.length,
        testedEndpoints: results.length,
        passedEndpoints: results.filter((r) => r.meetsExpectations !== false)
          .length,
        failedEndpoints: results.filter((r) => r.meetsExpectations === false)
          .length,
        totalDuration: `${totalDuration}ms`,
      },
      results,
    };
  }

  // Run stress test with increasing load
  async runStressTest(endpoint, maxConnections = 100) {
    logger.info(`🔥 Starting stress test for ${endpoint.name}...`);

    const stressResults = [];
    const connectionSteps = [10, 25, 50, 75, maxConnections];

    for (const connections of connectionSteps) {
      logger.info(`Testing with ${connections} connections...`);

      try {
        const result = await this.testEndpoint(endpoint, {
          connections,
          duration: 15, // Shorter duration for stress test
        });

        stressResults.push({
          connections,
          ...result,
        });

        // Check if we should stop due to poor performance
        if (
          result.successRate < 90 ||
          result.latency.average > endpoint.maxLatency * 2
        ) {
          logger.warn(
            {
              connections,
              successRate: result.successRate,
              latency: result.latency.average,
            },
            "Stopping stress test due to poor performance",
          );
          break;
        }

        // Wait between stress test steps
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (error) {
        logger.error(
          { error, connections },
          `Stress test failed at ${connections} connections`,
        );
        break;
      }
    }

    return {
      endpoint: endpoint.name,
      maxConnections,
      results: stressResults,
    };
  }

  // Run database performance test
  async runDatabasePerformanceTest() {
    logger.info("🗄️ Starting database performance test...");

    const dbEndpoints = [
      {
        name: "Database Health",
        path: "/api/health/db",
        method: "GET",
        expectedStatus: 200,
        maxLatency: 200,
      },
    ];

    const results = [];

    for (const endpoint of dbEndpoints) {
      try {
        const result = await this.testEndpoint(endpoint, {
          duration: 20,
          connections: 5,
        });
        results.push(result);
      } catch (error) {
        logger.error(
          { error, endpoint },
          `Database performance test failed for ${endpoint.name}`,
        );
      }
    }

    return results;
  }

  // Generate performance report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.length,
        passedTests: this.results.filter((r) => r.meetsExpectations !== false)
          .length,
        failedTests: this.results.filter((r) => r.meetsExpectations === false)
          .length,
        averageLatency: this.calculateAverageLatency(),
        averageThroughput: this.calculateAverageThroughput(),
        overallSuccessRate: this.calculateOverallSuccessRate(),
      },
      recommendations: this.generateRecommendations(),
      results: this.results,
    };

    logger.info({ performanceReport: report }, "📊 Performance Test Report");
    return report;
  }

  // Calculate average latency across all tests
  calculateAverageLatency() {
    const latencies = this.results
      .filter((r) => r.latency?.average)
      .map((r) => r.latency.average);

    return latencies.length > 0
      ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length
      : 0;
  }

  // Calculate average throughput across all tests
  calculateAverageThroughput() {
    const throughputs = this.results
      .filter((r) => r.throughput?.average)
      .map((r) => r.throughput.average);

    return throughputs.length > 0
      ? throughputs.reduce((sum, tp) => sum + tp, 0) / throughputs.length
      : 0;
  }

  // Calculate overall success rate
  calculateOverallSuccessRate() {
    const totalRequests = this.results.reduce(
      (sum, r) => sum + (r.requests?.total || 0),
      0,
    );
    const totalErrors = this.results.reduce(
      (sum, r) => sum + (r.errors || 0) + (r.timeouts || 0) + (r.non2xx || 0),
      0,
    );

    return totalRequests > 0
      ? ((totalRequests - totalErrors) / totalRequests) * 100
      : 0;
  }

  // Generate performance recommendations
  generateRecommendations() {
    const recommendations = [];

    // Check latency issues
    const highLatencyTests = this.results.filter(
      (r) => r.latency?.average > 1000,
    );
    if (highLatencyTests.length > 0) {
      recommendations.push({
        type: "latency",
        severity: "high",
        message: "High latency detected on critical endpoints",
        affectedEndpoints: highLatencyTests.map((t) => t.endpoint),
      });
    }

    // Check error rate issues
    const highErrorTests = this.results.filter((r) => r.successRate < 95);
    if (highErrorTests.length > 0) {
      recommendations.push({
        type: "reliability",
        severity: "high",
        message: "High error rate detected",
        affectedEndpoints: highErrorTests.map((t) => t.endpoint),
      });
    }

    // Check throughput issues
    const lowThroughputTests = this.results.filter(
      (r) => r.throughput?.average < 100,
    );
    if (lowThroughputTests.length > 0) {
      recommendations.push({
        type: "throughput",
        severity: "medium",
        message: "Low throughput detected",
        affectedEndpoints: lowThroughputTests.map((t) => t.endpoint),
      });
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push({
        type: "general",
        severity: "low",
        message: "Performance is within acceptable limits",
      });
    }

    return recommendations;
  }

  // Run comprehensive load test suite
  async runComprehensiveTest() {
    logger.info("🚀 Starting comprehensive load test suite...");

    const startTime = Date.now();

    try {
      // Run critical endpoints test
      const criticalResults = await this.runCriticalEndpointsTest();

      // Run database performance test
      const dbResults = await this.runDatabasePerformanceTest();

      // Run stress test on most critical endpoint
      const stressTestEndpoint = CRITICAL_ENDPOINTS[1]; // Products list
      const stressResults = await this.runStressTest(stressTestEndpoint);

      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      const report = {
        ...this.generateReport(),
        comprehensive: {
          totalDuration: `${totalDuration}ms`,
          criticalEndpoints: criticalResults,
          databasePerformance: dbResults,
          stressTest: stressResults,
        },
      };

      logger.info(
        { comprehensiveReport: report },
        "📊 Comprehensive Load Test Report",
      );

      return report;
    } catch (error) {
      logger.error({ error }, "Comprehensive load test failed");
      throw error;
    }
  }
}

// Export for use in other modules
module.exports = LoadTester;

// Run load test if this file is executed directly
if (require.main === module) {
  const loadTester = new LoadTester();

  loadTester
    .runComprehensiveTest()
    .then((report) => {
      console.log("\n📊 Load Test Summary:");
      console.log(`Total Tests: ${report.summary.totalTests}`);
      console.log(`Passed: ${report.summary.passedTests}`);
      console.log(`Failed: ${report.summary.failedTests}`);
      console.log(
        `Average Latency: ${report.summary.averageLatency.toFixed(2)}ms`,
      );
      console.log(
        `Average Throughput: ${report.summary.averageThroughput.toFixed(2)} req/sec`,
      );
      console.log(
        `Overall Success Rate: ${report.summary.overallSuccessRate.toFixed(2)}%`,
      );

      if (report.recommendations.length > 0) {
        console.log("\n🔧 Recommendations:");
        report.recommendations.forEach((rec) => {
          console.log(`- ${rec.message} (${rec.severity})`);
        });
      }

      process.exit(report.summary.failedTests > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error("Load test failed:", error);
      process.exit(1);
    });
}
