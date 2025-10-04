const pino = require('pino');
const pinoHttp = require('pino-http');
const { v4: uuidv4 } = require('uuid');

// Get environment from process.env directly to avoid circular dependency
const nodeEnv = process.env.NODE_ENV || 'development';

// Create logger instance
const logger = pino({
  level: nodeEnv === 'production' ? 'info' : 'debug',
  transport: nodeEnv === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: 'sastabazar-api',
    version: process.env.npm_package_version || '1.0.0',
    environment: nodeEnv
  }
});

// Request correlation ID middleware
const correlationIdMiddleware = (req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  
  // Add correlation ID to logger context
  req.logger = logger.child({ correlationId });
  
  next();
};

// HTTP request logging middleware
const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => req.correlationId,
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    } else if (res.statusCode >= 500 || err) {
      return 'error';
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      return 'silent';
    }
    return 'info';
  },
  customSuccessMessage: (req, res) => {
    if (res.statusCode === 404) {
      return 'resource not found';
    }
    return `${req.method} ${req.url}`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} - ${err.message}`;
  },
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error'
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
        'authorization': req.headers.authorization ? '[REDACTED]' : undefined,
        'x-correlation-id': req.headers['x-correlation-id']
      },
      remoteAddress: req.remoteAddress,
      remotePort: req.remotePort
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: {
        'content-type': res.headers['content-type'],
        'x-correlation-id': res.headers['x-correlation-id']
      }
    }),
    err: (err) => ({
      type: err.constructor.name,
      message: err.message,
      stack: nodeEnv === 'development' ? err.stack : undefined
    })
  }
});

// Enhanced logger with correlation ID support
const createLogger = (correlationId) => {
  return logger.child({ correlationId });
};

// Enhanced error logging utility with context
const logError = (error, context = {}) => {
  const errorContext = {
    error: {
      name: error.name,
      message: error.message,
      stack: nodeEnv === 'development' ? error.stack : undefined,
      code: error.code,
      statusCode: error.statusCode,
      isOperational: error.isOperational
    },
    context: {
      ...context,
      timestamp: new Date().toISOString(),
      environment: nodeEnv
    }
  };
  
  logger.error(errorContext, 'Error occurred');
  
  // Also log to console in development for immediate visibility
  if (nodeEnv === 'development') {
    console.error('🚨 Error:', error.message);
    console.error('📍 Context:', context);
    if (error.stack) {
      console.error('📚 Stack:', error.stack);
    }
  }
};

// Performance logging utility
const logPerformance = (operation, duration, metadata = {}) => {
  logger.info({
    operation,
    duration,
    metadata
  }, 'Performance metric');
};

// Security event logging
const logSecurityEvent = (event, details = {}) => {
  logger.warn({
    securityEvent: event,
    details,
    timestamp: new Date().toISOString()
  }, 'Security event detected');
};

// Business event logging
const logBusinessEvent = (event, data = {}) => {
  logger.info({
    businessEvent: event,
    data,
    timestamp: new Date().toISOString()
  }, 'Business event');
};

// Request context logging utility
const logRequestContext = (req, operation, metadata = {}) => {
  const context = {
    correlationId: req.correlationId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
    operation,
    metadata,
    timestamp: new Date().toISOString()
  };
  
  logger.info(context, `Request context: ${operation}`);
  return context;
};

// Database query logging utility
const logDatabaseQuery = (operation, collection, query, duration, metadata = {}) => {
  logger.debug({
    dbOperation: operation,
    collection,
    query: nodeEnv === 'development' ? query : '[REDACTED]',
    duration,
    metadata,
    timestamp: new Date().toISOString()
  }, 'Database query executed');
};

// Database operation logging utility (alias for logDatabaseQuery)
const logDatabaseOperation = logDatabaseQuery;

// Payment event logging
const logPaymentEvent = (event, paymentData = {}) => {
  // Sanitize sensitive payment data
  const sanitizedData = {
    ...paymentData,
    cardNumber: paymentData.cardNumber ? '[REDACTED]' : undefined,
    cvv: paymentData.cvv ? '[REDACTED]' : undefined,
    password: paymentData.password ? '[REDACTED]' : undefined,
    token: paymentData.token ? '[REDACTED]' : undefined
  };

  logger.info({
    paymentEvent: event,
    data: sanitizedData,
    timestamp: new Date().toISOString()
  }, 'Payment event');
};

// User action logging
const logUserAction = (userId, action, details = {}) => {
  logger.info({
    userId,
    userAction: action,
    details,
    timestamp: new Date().toISOString()
  }, 'User action');
};

// API usage logging
const logApiUsage = (endpoint, method, userId, responseTime, statusCode) => {
  logger.info({
    endpoint,
    method,
    userId: userId || 'anonymous',
    responseTime,
    statusCode,
    timestamp: new Date().toISOString()
  }, 'API usage');
};

// Health check logging
const logHealthCheck = (service, status, details = {}) => {
  logger.info({
    healthCheck: {
      service,
      status,
      details,
      timestamp: new Date().toISOString()
    }
  }, 'Health check');
};

// Startup logging
const logStartup = (service, version, environment, port) => {
  logger.info({
    startup: {
      service,
      version,
      environment,
      port,
      timestamp: new Date().toISOString()
    }
  }, 'Service startup');
};

// Shutdown logging
const logShutdown = (service, reason) => {
  logger.info({
    shutdown: {
      service,
      reason,
      timestamp: new Date().toISOString()
    }
  }, 'Service shutdown');
};

module.exports = {
  logger,
  httpLogger,
  correlationIdMiddleware,
  createLogger,
  logError,
  logPerformance,
  logSecurityEvent,
  logBusinessEvent,
  logDatabaseOperation,
  logDatabaseQuery,
  logRequestContext,
  logPaymentEvent,
  logUserAction,
  logApiUsage,
  logHealthCheck,
  logStartup,
  logShutdown
};

