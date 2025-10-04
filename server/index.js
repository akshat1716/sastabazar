const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');

// Load configuration
const { config, validateConfig, getCorsConfig } = require('./config');
const dbConnection = require('./config/database');
const { rateLimits, createSecurityMiddleware } = require('./config/security');
const { 
  logger, 
  httpLogger, 
  correlationIdMiddleware, 
  logStartup, 
  logShutdown,
  logHealthCheck 
} = require('./config/logger');
const { 
  sentryMiddleware, 
  errorReportingMiddleware, 
  performanceMiddleware 
} = require('./config/sentry');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Validate configuration
validateConfig();

logger.info('DEBUG: Shopify Domain Loaded =', config.shopify.storeDomain);

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');
const wishlistRoutes = require('./routes/wishlist');
const reviewRoutes = require('./routes/reviews');
const paymentRoutes = require('./routes/payments');
const webhookRoutes = require('./routes/webhooks');
const databaseViewerRoutes = require('./routes/database-viewer');
const shopifyRoutes = require('./routes/shopify');

const app = express();
const PORT = config.port;

// Sentry middleware (must be first)
app.use(sentryMiddleware.requestHandler);
app.use(sentryMiddleware.tracingHandler);

// Correlation ID middleware
app.use(correlationIdMiddleware);

// Security middleware
app.use(...createSecurityMiddleware());
app.use(compression());

// CORS configuration
app.use(cors(getCorsConfig()));

// HTTP request logging
app.use(httpLogger);

// Performance monitoring
app.use(performanceMiddleware);

// General rate limiting
app.use('/api/', rateLimits.general);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
dbConnection.connect();

// Health check endpoint
app.get('/api/health', (req, res) => {
  const healthData = {
    status: 'OK',
    message: 'API is running',
    service: 'sastabazar',
    timestamp: new Date().toISOString(),
    correlationId: req.correlationId
  };
  
  logHealthCheck('api', 'healthy', { correlationId: req.correlationId });
  res.json(healthData);
});

// Database health check endpoint
app.get('/api/health/db', async (req, res) => {
  try {
    const healthStatus = await dbConnection.healthCheck();
    logHealthCheck('database', healthStatus.status, { 
      correlationId: req.correlationId,
      dbName: healthStatus.dbName,
      host: healthStatus.host 
    });
    res.json(healthStatus);
  } catch (error) {
    logHealthCheck('database', 'unhealthy', { 
      correlationId: req.correlationId,
      error: error.message 
    });
    res.status(500).json({
      status: 'error',
      message: 'Database health check failed',
      error: error.message,
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId
    });
  }
});

// Serve static files from React app in production
if (config.nodeEnv === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// API Routes with specific rate limiting
app.use('/api/auth', rateLimits.auth, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', rateLimits.admin, adminRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', rateLimits.payment, paymentRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/db', databaseViewerRoutes);
app.use('/api/shopify', shopifyRoutes);

// Error reporting middleware
app.use(errorReportingMiddleware);

// Error handling middleware
app.use(errorHandler);

// 404 handler for API routes
app.use('/api/*', notFoundHandler);

// Serve React app for all non-API routes in production
if (config.nodeEnv === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
} else {
  // 404 handler for development
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

const server = app.listen(PORT, () => {
  logStartup('sastabazar-api', '1.0.0', config.nodeEnv, PORT);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logShutdown('sastabazar-api', `Received ${signal}`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close database connection
    dbConnection.disconnect().then(() => {
      logger.info('Database connection closed');
      process.exit(0);
    }).catch((error) => {
      logger.error({ error }, 'Error closing database connection');
      process.exit(1);
    });
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Sentry error handler (must be last)
app.use(sentryMiddleware.errorHandler);