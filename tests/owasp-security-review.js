const axios = require('axios');
const { config } = require('../config');
const { logger } = require('../config/logger');

// OWASP Top 10 Security Review
class OWASPSecurityReview {
  constructor() {
    this.baseURL = config.urls.server;
    this.results = [];
    this.vulnerabilities = [];
    this.recommendations = [];
  }

  // Helper method to log security findings
  logFinding(type, severity, title, description, recommendation = '') {
    const finding = {
      type,
      severity,
      title,
      description,
      recommendation,
      timestamp: new Date().toISOString()
    };

    this.results.push(finding);

    if (severity === 'critical' || severity === 'high') {
      this.vulnerabilities.push(finding);
      logger.error({ securityFinding: finding }, `🚨 ${severity.toUpperCase()}: ${title}`);
    } else {
      logger.warn({ securityFinding: finding }, `⚠️ ${severity.toUpperCase()}: ${title}`);
    }

    return finding;
  }

  // Helper method to make HTTP requests
  async makeRequest(method, path, data = null, headers = {}) {
    try {
      const response = await axios({
        method,
        url: `${this.baseURL}${path}`,
        data,
        headers,
        timeout: 10000,
        validateStatus: () => true // Don't throw on any status code
      });

      return {
        status: response.status,
        headers: response.headers,
        data: response.data,
        success: true
      };
    } catch (error) {
      return {
        error: error.message,
        success: false
      };
    }
  }

  // A01: Broken Access Control
  async testAccessControl() {
    logger.info('🔒 Testing Access Control (A01)...');

    const tests = [
      {
        name: 'Admin endpoint without auth',
        path: '/api/admin/users',
        method: 'GET',
        expectedStatus: 401
      },
      {
        name: 'User profile without auth',
        path: '/api/auth/profile',
        method: 'GET',
        expectedStatus: 401
      },
      {
        name: 'Order creation without auth',
        path: '/api/orders',
        method: 'POST',
        data: { items: [] },
        expectedStatus: 401
      },
      {
        name: 'Payment without auth',
        path: '/api/payments/razorpay/order',
        method: 'POST',
        data: { amount: 100 },
        expectedStatus: 401
      }
    ];

    for (const test of tests) {
      const result = await this.makeRequest(test.method, test.path, test.data);
      
      if (result.success && result.status !== test.expectedStatus) {
        this.logFinding(
          'access_control',
          'high',
          `Unauthorized access to ${test.name}`,
          `Expected status ${test.expectedStatus}, got ${result.status}`,
          'Ensure all protected endpoints require authentication'
        );
      } else if (result.success && result.status === test.expectedStatus) {
        logger.info(`✅ ${test.name} - Properly protected`);
      }
    }
  }

  // A02: Cryptographic Failures
  async testCryptographicFailures() {
    logger.info('🔐 Testing Cryptographic Failures (A02)...');

    // Test for weak JWT secrets
    if (config.jwt.secret.length < 32) {
      this.logFinding(
        'cryptographic',
        'critical',
        'Weak JWT Secret',
        `JWT secret is only ${config.jwt.secret.length} characters long`,
        'Use a JWT secret of at least 32 characters with high entropy'
      );
    }

    // Test for default JWT secret
    if (config.jwt.secret.includes('your-super-secret') || config.jwt.secret.includes('change-this')) {
      this.logFinding(
        'cryptographic',
        'critical',
        'Default JWT Secret',
        'JWT secret appears to be a default value',
        'Change JWT secret to a unique, strong value'
      );
    }

    // Test HTTPS enforcement
    if (config.isProduction && !config.urls.server.startsWith('https')) {
      this.logFinding(
        'cryptographic',
        'high',
        'HTTP in Production',
        'Server is not using HTTPS in production',
        'Enable HTTPS and redirect all HTTP traffic to HTTPS'
      );
    }

    // Test for sensitive data in responses
    const healthResponse = await this.makeRequest('GET', '/api/health');
    if (healthResponse.success && healthResponse.data) {
      const responseStr = JSON.stringify(healthResponse.data);
      if (responseStr.includes('password') || responseStr.includes('secret') || responseStr.includes('key')) {
        this.logFinding(
          'cryptographic',
          'medium',
          'Sensitive Data in Response',
          'Response may contain sensitive information',
          'Sanitize responses to remove sensitive data'
        );
      }
    }
  }

  // A03: Injection
  async testInjection() {
    logger.info('💉 Testing Injection Attacks (A03)...');

    const injectionTests = [
      {
        name: 'SQL Injection in search',
        path: '/api/products?search=1\' OR \'1\'=\'1',
        method: 'GET'
      },
      {
        name: 'NoSQL Injection in category',
        path: '/api/products?category={"$ne":null}',
        method: 'GET'
      },
      {
        name: 'Command Injection in user input',
        path: '/api/products?search=test; ls -la',
        method: 'GET'
      }
    ];

    for (const test of injectionTests) {
      const result = await this.makeRequest(test.method, test.path);
      
      if (result.success) {
        // Check if response indicates successful injection
        if (result.data && typeof result.data === 'object') {
          const responseStr = JSON.stringify(result.data).toLowerCase();
          if (responseStr.includes('error') || responseStr.includes('exception')) {
            logger.info(`✅ ${test.name} - Properly handled`);
          } else {
            this.logFinding(
              'injection',
              'high',
              `Potential ${test.name}`,
              'Injection attempt may have succeeded',
              'Implement proper input validation and parameterized queries'
            );
          }
        }
      }
    }
  }

  // A04: Insecure Design
  async testInsecureDesign() {
    logger.info('🏗️ Testing Insecure Design (A04)...');

    // Test for business logic flaws
    const businessLogicTests = [
      {
        name: 'Negative amount payment',
        path: '/api/payments/razorpay/order',
        method: 'POST',
        data: { amount: -100, currency: 'INR' }
      },
      {
        name: 'Zero amount payment',
        path: '/api/payments/razorpay/order',
        method: 'POST',
        data: { amount: 0, currency: 'INR' }
      },
      {
        name: 'Excessive amount payment',
        path: '/api/payments/razorpay/order',
        method: 'POST',
        data: { amount: 999999999, currency: 'INR' }
      }
    ];

    for (const test of businessLogicTests) {
      const result = await this.makeRequest(test.method, test.path, test.data);
      
      if (result.success && result.status === 200) {
        this.logFinding(
          'business_logic',
          'medium',
          `Business Logic Flaw: ${test.name}`,
          'Request was accepted without proper validation',
          'Implement business logic validation for payment amounts'
        );
      } else {
        logger.info(`✅ ${test.name} - Properly rejected`);
      }
    }
  }

  // A05: Security Misconfiguration
  async testSecurityMisconfiguration() {
    logger.info('⚙️ Testing Security Misconfiguration (A05)...');

    // Test security headers
    const response = await this.makeRequest('GET', '/api/health');
    
    if (response.success && response.headers) {
      const headers = response.headers;
      
      // Check for missing security headers
      const requiredHeaders = [
        { name: 'X-Content-Type-Options', value: 'nosniff' },
        { name: 'X-Frame-Options', value: 'DENY' },
        { name: 'X-XSS-Protection', value: '1; mode=block' },
        { name: 'Strict-Transport-Security', value: 'max-age=31536000' }
      ];

      for (const header of requiredHeaders) {
        if (!headers[header.name.toLowerCase()]) {
          this.logFinding(
            'security_headers',
            'medium',
            `Missing Security Header: ${header.name}`,
            `Required header ${header.name} is not present`,
            `Add ${header.name}: ${header.value} header`
          );
        } else if (headers[header.name.toLowerCase()] !== header.value) {
          this.logFinding(
            'security_headers',
            'low',
            `Incorrect Security Header: ${header.name}`,
            `Header value is ${headers[header.name.toLowerCase()]}, expected ${header.value}`,
            `Update ${header.name} header to ${header.value}`
          );
        }
      }

      // Check for information disclosure
      if (headers['x-powered-by']) {
        this.logFinding(
          'information_disclosure',
          'low',
          'Server Information Disclosure',
          'X-Powered-By header reveals server technology',
          'Remove or hide X-Powered-By header'
        );
      }
    }

    // Test for debug information in production
    if (config.isProduction) {
      const debugResponse = await this.makeRequest('GET', '/api/health');
      if (debugResponse.success && debugResponse.data) {
        const responseStr = JSON.stringify(debugResponse.data);
        if (responseStr.includes('debug') || responseStr.includes('development') || responseStr.includes('stack')) {
          this.logFinding(
            'information_disclosure',
            'medium',
            'Debug Information in Production',
            'Response contains debug or development information',
            'Remove debug information from production responses'
          );
        }
      }
    }
  }

  // A06: Vulnerable Components
  async testVulnerableComponents() {
    logger.info('📦 Testing Vulnerable Components (A06)...');

    // Check for known vulnerable packages
    const packageJson = require('../package.json');
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    // Known vulnerable packages (this is a simplified check)
    const vulnerablePackages = [
      'express',
      'mongoose',
      'jsonwebtoken',
      'bcryptjs',
      'cors',
      'helmet'
    ];

    for (const pkg of vulnerablePackages) {
      if (dependencies[pkg]) {
        // In a real implementation, you would check against a vulnerability database
        logger.info(`📦 Checking ${pkg} version ${dependencies[pkg]}`);
        
        // This is a placeholder - in reality, you'd use tools like npm audit
        if (pkg === 'express' && dependencies[pkg].includes('4.16')) {
          this.logFinding(
            'vulnerable_components',
            'medium',
            `Potentially Vulnerable Package: ${pkg}`,
            `Package ${pkg} version ${dependencies[pkg]} may have known vulnerabilities`,
            'Update package to latest version and run npm audit'
          );
        }
      }
    }

    // Check for outdated packages
    this.logFinding(
      'vulnerable_components',
      'low',
      'Package Audit Required',
      'Regular security audits of dependencies are needed',
      'Run npm audit regularly and update vulnerable packages'
    );
  }

  // A07: Authentication Failures
  async testAuthenticationFailures() {
    logger.info('🔑 Testing Authentication Failures (A07)...');

    // Test for weak password policies
    const weakPasswords = ['123456', 'password', 'admin', 'test'];
    
    for (const weakPassword of weakPasswords) {
      const result = await this.makeRequest('POST', '/api/auth/register', {
        email: 'test@example.com',
        password: weakPassword,
        firstName: 'Test',
        lastName: 'User'
      });

      if (result.success && result.status === 201) {
        this.logFinding(
          'authentication',
          'high',
          'Weak Password Policy',
          `Weak password "${weakPassword}" was accepted`,
          'Implement strong password policy with minimum requirements'
        );
        break;
      }
    }

    // Test for account enumeration
    const existingUser = await this.makeRequest('POST', '/api/auth/login', {
      email: 'nonexistent@example.com',
      password: 'anypassword'
    });

    const nonExistentUser = await this.makeRequest('POST', '/api/auth/login', {
      email: 'anothernonexistent@example.com',
      password: 'anypassword'
    });

    if (existingUser.success && nonExistentUser.success) {
      if (existingUser.status === nonExistentUser.status) {
        logger.info('✅ Account enumeration - Properly handled');
      } else {
        this.logFinding(
          'authentication',
          'medium',
          'Account Enumeration Vulnerability',
          'Different responses for existing vs non-existing users',
          'Use consistent error messages for authentication failures'
        );
      }
    }

    // Test for session management
    const loginResponse = await this.makeRequest('POST', '/api/auth/login', {
      email: 'test@example.com',
      password: 'testpassword'
    });

    if (loginResponse.success && loginResponse.data.token) {
      // Check if token has proper expiration
      const token = loginResponse.data.token;
      if (token.length < 100) {
        this.logFinding(
          'authentication',
          'medium',
          'Weak JWT Token',
          'JWT token appears to be too short or weak',
          'Ensure JWT tokens are properly signed and have appropriate expiration'
        );
      }
    }
  }

  // A08: Software and Data Integrity Failures
  async testDataIntegrityFailures() {
    logger.info('🔒 Testing Data Integrity Failures (A08)...');

    // Test for file upload vulnerabilities
    const fileUploadTests = [
      {
        name: 'Executable file upload',
        filename: 'malicious.exe',
        content: 'MZ\x90\x00\x03\x00\x00\x00'
      },
      {
        name: 'Script file upload',
        filename: 'malicious.js',
        content: 'alert("XSS")'
      },
      {
        name: 'Large file upload',
        filename: 'large.txt',
        content: 'A'.repeat(100 * 1024 * 1024) // 100MB
      }
    ];

    for (const test of fileUploadTests) {
      // This is a simplified test - in reality, you'd test actual file upload endpoints
      this.logFinding(
        'data_integrity',
        'medium',
        `File Upload Security: ${test.name}`,
        'File upload security should be tested',
        'Implement file type validation, size limits, and virus scanning'
      );
    }

    // Test for data validation
    const validationTests = [
      {
        name: 'XSS in product name',
        path: '/api/products',
        method: 'POST',
        data: { name: '<script>alert("XSS")</script>', price: 100 }
      },
      {
        name: 'SQL injection in email',
        path: '/api/auth/register',
        method: 'POST',
        data: { email: "test'; DROP TABLE users; --", password: 'password' }
      }
    ];

    for (const test of validationTests) {
      const result = await this.makeRequest(test.method, test.path, test.data);
      
      if (result.success && result.status === 201) {
        this.logFinding(
          'data_integrity',
          'high',
          `Input Validation Failure: ${test.name}`,
          'Malicious input was accepted without proper validation',
          'Implement comprehensive input validation and sanitization'
        );
      } else {
        logger.info(`✅ ${test.name} - Properly rejected`);
      }
    }
  }

  // A09: Logging and Monitoring Failures
  async testLoggingFailures() {
    logger.info('📊 Testing Logging and Monitoring Failures (A09)...');

    // Test for security event logging
    const securityTests = [
      {
        name: 'Failed login attempt',
        path: '/api/auth/login',
        method: 'POST',
        data: { email: 'test@example.com', password: 'wrongpassword' }
      },
      {
        name: 'Unauthorized access attempt',
        path: '/api/admin/users',
        method: 'GET'
      }
    ];

    for (const test of securityTests) {
      const result = await this.makeRequest(test.method, test.path, test.data);
      
      // Check if security events are properly logged
      // In a real implementation, you'd check logs or monitoring systems
      this.logFinding(
        'logging',
        'medium',
        `Security Event Logging: ${test.name}`,
        'Security events should be logged and monitored',
        'Implement comprehensive security event logging and monitoring'
      );
    }

    // Test for rate limiting
    const rateLimitTest = await this.makeRequest('GET', '/api/health');
    if (rateLimitTest.success) {
      // Check if rate limiting headers are present
      if (!rateLimitTest.headers['x-ratelimit-limit']) {
        this.logFinding(
          'logging',
          'low',
          'Rate Limiting Headers Missing',
          'Rate limiting headers are not present in responses',
          'Add rate limiting headers to responses'
        );
      }
    }
  }

  // A10: Server-Side Request Forgery (SSRF)
  async testSSRF() {
    logger.info('🌐 Testing Server-Side Request Forgery (A10)...');

    // Test for SSRF vulnerabilities
    const ssrfTests = [
      {
        name: 'Internal network access',
        path: '/api/products?url=http://localhost:22',
        method: 'GET'
      },
      {
        name: 'Cloud metadata access',
        path: '/api/products?url=http://169.254.169.254/metadata',
        method: 'GET'
      },
      {
        name: 'File system access',
        path: '/api/products?url=file:///etc/passwd',
        method: 'GET'
      }
    ];

    for (const test of ssrfTests) {
      const result = await this.makeRequest(test.method, test.path);
      
      if (result.success && result.status === 200) {
        this.logFinding(
          'ssrf',
          'high',
          `Potential SSRF: ${test.name}`,
          'Request may have accessed internal resources',
          'Implement URL validation and whitelist allowed domains'
        );
      } else {
        logger.info(`✅ ${test.name} - Properly blocked`);
      }
    }
  }

  // Generate security report
  generateReport() {
    const criticalCount = this.vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = this.vulnerabilities.filter(v => v.severity === 'high').length;
    const mediumCount = this.vulnerabilities.filter(v => v.severity === 'medium').length;
    const lowCount = this.vulnerabilities.filter(v => v.severity === 'low').length;

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFindings: this.results.length,
        vulnerabilities: this.vulnerabilities.length,
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        low: lowCount,
        riskScore: this.calculateRiskScore()
      },
      findings: this.results,
      recommendations: this.generateSecurityRecommendations()
    };

    logger.info({ securityReport: report }, '🔒 OWASP Security Review Report');
    return report;
  }

  // Calculate overall risk score
  calculateRiskScore() {
    const weights = { critical: 10, high: 7, medium: 4, low: 1 };
    const totalWeight = this.results.reduce((sum, finding) => sum + weights[finding.severity], 0);
    const maxPossibleWeight = this.results.length * 10;
    
    return maxPossibleWeight > 0 ? (totalWeight / maxPossibleWeight) * 100 : 0;
  }

  // Generate security recommendations
  generateSecurityRecommendations() {
    const recommendations = [];

    // Group findings by type
    const findingsByType = this.results.reduce((acc, finding) => {
      if (!acc[finding.type]) acc[finding.type] = [];
      acc[finding.type].push(finding);
      return acc;
    }, {});

    // Generate recommendations for each type
    Object.keys(findingsByType).forEach(type => {
      const findings = findingsByType[type];
      const criticalCount = findings.filter(f => f.severity === 'critical').length;
      const highCount = findings.filter(f => f.severity === 'high').length;

      if (criticalCount > 0 || highCount > 0) {
        recommendations.push({
          priority: 'high',
          category: type,
          count: findings.length,
          description: `Address ${findings.length} ${type} security issues`,
          action: 'Immediate action required'
        });
      } else if (findings.length > 0) {
        recommendations.push({
          priority: 'medium',
          category: type,
          count: findings.length,
          description: `Review ${findings.length} ${type} security issues`,
          action: 'Schedule for next security review'
        });
      }
    });

    return recommendations;
  }

  // Run complete OWASP security review
  async runSecurityReview() {
    logger.info('🔒 Starting OWASP Top 10 Security Review...');

    const startTime = Date.now();

    try {
      // Run all security tests
      await this.testAccessControl();
      await this.testCryptographicFailures();
      await this.testInjection();
      await this.testInsecureDesign();
      await this.testSecurityMisconfiguration();
      await this.testVulnerableComponents();
      await this.testAuthenticationFailures();
      await this.testDataIntegrityFailures();
      await this.testLoggingFailures();
      await this.testSSRF();

      const endTime = Date.now();
      const duration = endTime - startTime;

      const report = {
        ...this.generateReport(),
        duration: `${duration}ms`
      };

      logger.info({ securityReview: report }, '🔒 OWASP Security Review Complete');
      
      return report;

    } catch (error) {
      logger.error({ error }, 'Security review failed');
      throw error;
    }
  }
}

// Export for use in other modules
module.exports = OWASPSecurityReview;

// Run security review if this file is executed directly
if (require.main === module) {
  const securityReview = new OWASPSecurityReview();
  
  securityReview.runSecurityReview()
    .then(report => {
      console.log('\n🔒 Security Review Summary:');
      console.log(`Total Findings: ${report.summary.totalFindings}`);
      console.log(`Vulnerabilities: ${report.summary.vulnerabilities}`);
      console.log(`Critical: ${report.summary.critical}`);
      console.log(`High: ${report.summary.high}`);
      console.log(`Medium: ${report.summary.medium}`);
      console.log(`Low: ${report.summary.low}`);
      console.log(`Risk Score: ${report.summary.riskScore.toFixed(2)}%`);
      
      if (report.recommendations.length > 0) {
        console.log('\n🔧 Security Recommendations:');
        report.recommendations.forEach(rec => {
          console.log(`- ${rec.description} (${rec.priority})`);
        });
      }
      
      process.exit(report.summary.critical > 0 || report.summary.high > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Security review failed:', error);
      process.exit(1);
    });
}

