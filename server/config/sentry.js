const Sentry = require("@sentry/node");
const { Integrations } = require("@sentry/integrations");
const { config } = require("./index");
const { logger } = require("./logger");

// Initialize Sentry if DSN is provided
if (config.sentry.enabled) {
  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.sentry.environment,
    integrations: [
      new Integrations.Http({ tracing: true }),
      new Integrations.Express({ app: undefined }),
      new Integrations.Mongo({ useMongoose: true }),
    ],
    tracesSampleRate: config.isDevelopment ? 1.0 : 0.1,
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request) {
        // Remove sensitive headers
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
          delete event.request.headers["x-api-key"];
        }

        // Remove sensitive query parameters
        if (event.request.query_string) {
          const queryParams = new URLSearchParams(event.request.query_string);
          queryParams.delete("password");
          queryParams.delete("token");
          queryParams.delete("secret");
          event.request.query_string = queryParams.toString();
        }
      }

      // Remove sensitive data from extra context
      if (event.extra) {
        delete event.extra.password;
        delete event.extra.token;
        delete event.extra.secret;
        delete event.extra.authorization;
      }

      return event;
    },
    beforeBreadcrumb(breadcrumb) {
      // Filter out sensitive breadcrumbs
      if (breadcrumb.category === "http" && breadcrumb.data) {
        delete breadcrumb.data.authorization;
        delete breadcrumb.data.cookie;
      }

      return breadcrumb;
    },
  });

  logger.info("Sentry initialized successfully");
} else {
  logger.info("Sentry not configured - error tracking disabled");
}

// Sentry middleware for Express
const sentryMiddleware = {
  // Request handler middleware
  requestHandler: config.sentry.enabled
    ? Sentry.requestHandler()
    : (req, res, next) => next(),

  // Tracing handler middleware
  tracingHandler: config.sentry.enabled
    ? Sentry.tracingHandler()
    : (req, res, next) => next(),

  // Error handler middleware
  errorHandler: config.sentry.enabled
    ? Sentry.errorHandler()
    : (err, req, res, next) => next(err),
};

// Helper functions for manual error reporting
const captureException = (error, context = {}) => {
  if (config.sentry.enabled) {
    Sentry.withScope((scope) => {
      // Add context
      Object.keys(context).forEach((key) => {
        scope.setTag(key, context[key]);
      });

      // Capture the exception
      Sentry.captureException(error);
    });
  }

  // Always log locally
  logger.error({ error, context }, "Exception captured");
};

const captureMessage = (message, level = "info", context = {}) => {
  if (config.sentry.enabled) {
    Sentry.withScope((scope) => {
      // Add context
      Object.keys(context).forEach((key) => {
        scope.setTag(key, context[key]);
      });

      // Capture the message
      Sentry.captureMessage(message, level);
    });
  }

  // Always log locally
  logger[level]({ message, context }, "Message captured");
};

const setUser = (user) => {
  if (config.sentry.enabled) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  }
};

const setTag = (key, value) => {
  if (config.sentry.enabled) {
    Sentry.setTag(key, value);
  }
};

const setContext = (key, context) => {
  if (config.sentry.enabled) {
    Sentry.setContext(key, context);
  }
};

const addBreadcrumb = (breadcrumb) => {
  if (config.sentry.enabled) {
    Sentry.addBreadcrumb(breadcrumb);
  }
};

// Performance monitoring helpers
const startTransaction = (name, op) => {
  if (config.sentry.enabled) {
    return Sentry.startTransaction({ name, op });
  }
  return null;
};

const finishTransaction = (transaction) => {
  if (transaction) {
    transaction.finish();
  }
};

// Custom error types for better Sentry categorization
class SentryError extends Error {
  constructor(message, tags = {}, context = {}) {
    super(message);
    this.name = this.constructor.name;
    this.tags = tags;
    this.context = context;
  }
}

class DatabaseError extends SentryError {
  constructor(message, operation, context = {}) {
    super(message, { component: "database", operation }, context);
  }
}

class PaymentError extends SentryError {
  constructor(message, gateway, context = {}) {
    super(message, { component: "payment", gateway }, context);
  }
}

class AuthenticationError extends SentryError {
  constructor(message, context = {}) {
    super(message, { component: "auth" }, context);
  }
}

class ValidationError extends SentryError {
  constructor(message, field, context = {}) {
    super(message, { component: "validation", field }, context);
  }
}

// Error reporting middleware
const errorReportingMiddleware = (error, req, res, next) => {
  if (config.sentry.enabled) {
    // Set user context if available
    if (req.user) {
      setUser(req.user);
    }

    // Set request context
    setContext("request", {
      method: req.method,
      url: req.url,
      headers: {
        "user-agent": req.get("User-Agent"),
        "content-type": req.get("Content-Type"),
      },
      ip: req.ip,
      correlationId: req.correlationId,
    });

    // Capture the error
    captureException(error, {
      correlationId: req.correlationId,
      userId: req.user?.id,
      url: req.url,
      method: req.method,
    });
  }

  next(error);
};

// Performance monitoring middleware
const performanceMiddleware = (req, res, next) => {
  if (config.sentry.enabled) {
    const transaction = startTransaction(
      `${req.method} ${req.route?.path || req.path}`,
      "http.server",
    );

    if (transaction) {
      req.sentryTransaction = transaction;

      res.on("finish", () => {
        transaction.setStatus(res.statusCode >= 400 ? "internal_error" : "ok");
        transaction.setData("http.status_code", res.statusCode);
        finishTransaction(transaction);
      });
    }
  }

  next();
};

module.exports = {
  sentryMiddleware,
  captureException,
  captureMessage,
  setUser,
  setTag,
  setContext,
  addBreadcrumb,
  startTransaction,
  finishTransaction,
  errorReportingMiddleware,
  performanceMiddleware,
  SentryError,
  DatabaseError,
  PaymentError,
  AuthenticationError,
  ValidationError,
};
