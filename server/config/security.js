const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { config } = require('./index');

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000),
        timestamp: new Date().toISOString()
      });
    }
  });
};

// Rate limiting configurations for different endpoints
const rateLimits = {
  // General API rate limit
  general: createRateLimit(
    config.rateLimit.windowMs,
    config.rateLimit.maxRequests,
    'Too many requests from this IP, please try again later.'
  ),

  // Strict rate limit for authentication endpoints
  auth: createRateLimit(
    config.rateLimit.auth.windowMs,
    config.rateLimit.auth.maxRequests,
    'Too many authentication attempts, please try again later.'
  ),

  // Payment endpoints rate limit
  payment: createRateLimit(
    config.rateLimit.payment.windowMs,
    config.rateLimit.payment.maxRequests,
    'Too many payment attempts, please try again later.'
  ),

  // Password reset rate limit
  passwordReset: createRateLimit(
    config.rateLimit.passwordReset.windowMs,
    config.rateLimit.passwordReset.maxRequests,
    'Too many password reset attempts, please try again later.'
  ),

  // Registration rate limit
  registration: createRateLimit(
    config.rateLimit.registration.windowMs,
    config.rateLimit.registration.maxRequests,
    'Too many registration attempts, please try again later.'
  ),

  // Admin endpoints rate limit
  admin: createRateLimit(
    config.rateLimit.admin.windowMs,
    config.rateLimit.admin.maxRequests,
    'Too many admin requests, please try again later.'
  ),

  // File upload rate limit
  upload: createRateLimit(
    60 * 60 * 1000, // 1 hour
    50, // 50 uploads per hour
    'Too many file uploads, please try again later.'
  )
};

// Helmet security configuration
const helmetConfig = {
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net"
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://checkout.razorpay.com",
        "https://js.stripe.com",
        "https://cdn.jsdelivr.net"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:"
      ],
      connectSrc: [
        "'self'",
        "https://api.razorpay.com",
        "https://api.stripe.com",
        "https://checkout.razorpay.com"
      ],
      frameSrc: [
        "'self'",
        "https://checkout.razorpay.com",
        "https://js.stripe.com"
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },

  // Prevent MIME type sniffing
  noSniff: true,

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // X-Frame-Options
  frameguard: {
    action: 'deny'
  },

  // X-Content-Type-Options
  xssFilter: true,

  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },

  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: false,

  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: {
    policy: 'same-origin'
  },

  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: {
    policy: 'cross-origin'
  }
};

// Production-specific security headers
if (config.nodeEnv === 'production') {
  helmetConfig.hsts = {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  };
  
  // Stricter CSP for production
  helmetConfig.contentSecurityPolicy.directives.upgradeInsecureRequests = [];
  
  // Remove unsafe-inline in production
  helmetConfig.contentSecurityPolicy.directives.scriptSrc = helmetConfig.contentSecurityPolicy.directives.scriptSrc.filter(src => src !== "'unsafe-inline'");
  helmetConfig.contentSecurityPolicy.directives.styleSrc = helmetConfig.contentSecurityPolicy.directives.styleSrc.filter(src => src !== "'unsafe-inline'");
  
  // Add nonce-based CSP for production
  helmetConfig.contentSecurityPolicy.directives.scriptSrc.push("'nonce-{nonce}'");
  helmetConfig.contentSecurityPolicy.directives.styleSrc.push("'nonce-{nonce}'");
}

// Development-specific configuration
if (config.nodeEnv === 'development') {
  // Relaxed CSP for development
  helmetConfig.contentSecurityPolicy.directives.scriptSrc.push("'unsafe-eval'");
  helmetConfig.contentSecurityPolicy.directives.connectSrc.push("ws:", "wss:");
}

// Security middleware factory
const createSecurityMiddleware = () => {
  return [
    helmet(helmetConfig),
    // Add custom security headers
    (req, res, next) => {
      // Add custom security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      
      // Add server identification
      res.setHeader('Server', 'sastabazar-api');
      
      next();
    }
  ];
};

// Request logging middleware with sensitive data scrubbing
const createLoggingMiddleware = () => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Scrub sensitive fields from request body
    const sanitizedBody = { ...req.body };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    
    sensitiveFields.forEach(field => {
      if (sanitizedBody[field]) {
        sanitizedBody[field] = '[REDACTED]';
      }
    });
    
    // Log request (only in development)
    if (config.nodeEnv === 'development') {
      console.log(`📥 ${req.method} ${req.path}`, {
        body: sanitizedBody,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    
    // Override res.json to scrub sensitive data from responses
    const originalJson = res.json;
    res.json = function(data) {
      const sanitizedData = { ...data };
      
      // Scrub sensitive fields from response
      if (sanitizedData.user && sanitizedData.user.password) {
        delete sanitizedData.user.password;
      }
      if (sanitizedData.token) {
        sanitizedData.token = '[REDACTED]';
      }
      if (sanitizedData.accessToken) {
        sanitizedData.accessToken = '[REDACTED]';
      }
      if (sanitizedData.refreshToken) {
        sanitizedData.refreshToken = '[REDACTED]';
      }
      
      return originalJson.call(this, sanitizedData);
    };
    
    // Log response time
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      if (config.nodeEnv === 'development') {
        console.log(`📤 ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
      }
    });
    
    next();
  };
};

module.exports = {
  rateLimits,
  helmetConfig,
  createSecurityMiddleware,
  createLoggingMiddleware
};

