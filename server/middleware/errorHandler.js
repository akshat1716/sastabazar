const { logger, logError, logSecurityEvent } = require('../config/logger');
const { config } = require('../config');

class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, field) {
    super(message, 400);
    this.field = field;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429);
  }
}

class PaymentError extends AppError {
  constructor(message, paymentData = {}) {
    super(message, 402);
    this.paymentData = paymentData;
  }
}

class DatabaseError extends AppError {
  constructor(message, operation) {
    super(message, 500);
    this.operation = operation;
  }
}

// Error sanitization for production
const sanitizeError = (error) => {
  if (config.nodeEnv === 'production') {
    // Don't expose internal errors in production
    if (!error.isOperational) {
      return {
        message: 'Internal server error',
        statusCode: 500,
        code: 'INTERNAL_ERROR'
      };
    }
    
    // Sanitize sensitive information
    const sanitized = {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code || error.name
    };
    
    // Add field information for validation errors
    if (error.field) {
      sanitized.field = error.field;
    }
    
    return sanitized;
  }
  
  // Development: return full error details
  return {
    message: error.message,
    statusCode: error.statusCode,
    code: error.code || error.name,
    stack: error.stack,
    field: error.field,
    operation: error.operation,
    paymentData: error.paymentData
  };
};

// Centralized error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = err;
  
  // Convert known error types
  if (err.name === 'ValidationError') {
    error = new ValidationError(err.message, err.path);
  } else if (err.name === 'CastError') {
    error = new ValidationError(`Invalid ${err.path}: ${err.value}`);
  } else if (err.name === 'MongoError' && err.code === 11000) {
    error = new ConflictError('Duplicate field value');
  } else if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Invalid token');
  } else if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expired');
  } else if (err.name === 'MulterError') {
    error = new ValidationError(`File upload error: ${err.message}`);
  } else if (!(err instanceof AppError)) {
    error = new AppError(err.message || 'Internal server error', err.statusCode || 500, false);
  }
  
  // Log the error
  logError(error, {
    correlationId: req.correlationId,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id
  });
  
  // Log security events for authentication/authorization errors
  if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
    logSecurityEvent('AUTH_FAILURE', {
      correlationId: req.correlationId,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      errorType: error.constructor.name
    });
  }
  
  // Log payment errors
  if (error instanceof PaymentError) {
    logger.warn({
      paymentError: {
        message: error.message,
        paymentData: error.paymentData,
        correlationId: req.correlationId,
        userId: req.user?.id
      }
    }, 'Payment error occurred');
  }
  
  // Send error response
  const sanitizedError = sanitizeError(error);
  res.status(error.statusCode).json({
    error: sanitizedError.message,
    code: sanitizedError.code,
    ...(sanitizedError.field && { field: sanitizedError.field }),
    ...(sanitizedError.operation && { operation: sanitizedError.operation }),
    correlationId: req.correlationId,
    timestamp: new Date().toISOString()
  });
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.method} ${req.url}`);
  next(error);
};

// Unhandled promise rejection handler
const unhandledRejectionHandler = (reason, promise) => {
  logger.error({
    error: {
      name: 'UnhandledPromiseRejection',
      message: reason.message || reason,
      stack: reason.stack
    },
    promise: promise.toString()
  }, 'Unhandled promise rejection');
  
  // In production, you might want to exit the process
  if (config.nodeEnv === 'production') {
    process.exit(1);
  }
};

// Uncaught exception handler
const uncaughtExceptionHandler = (error) => {
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  }, 'Uncaught exception');
  
  // In production, you might want to exit the process
  if (config.nodeEnv === 'production') {
    process.exit(1);
  }
};

// Set up global error handlers
process.on('unhandledRejection', unhandledRejectionHandler);
process.on('uncaughtException', uncaughtExceptionHandler);

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  PaymentError,
  DatabaseError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
  sanitizeError
};
