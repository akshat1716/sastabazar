const { z } = require("zod");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

// Import logger after env is loaded
const { logger } = require("./logger");

// Environment validation schema
const envSchema = z.object({
  // Server configuration
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().transform(Number).default("5000"),

  // URLs
  CLIENT_URL: z.string().url().default("http://localhost:5173"),
  SERVER_URL: z.string().url().default("http://localhost:5000"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),

  // Database
  MONGODB_URI: z.string().min(1, "MongoDB URI is required"),

  // JWT
  JWT_SECRET: z
    .string()
    .min(32, "JWT secret must be at least 32 characters long")
    .refine(
      (secret) =>
        secret !== "your-super-secret-jwt-key-change-this-in-production",
      "JWT secret must be changed from default value",
    ),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default("900000"), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default("100"),

  // Payment gateways
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Shopify
  SHOPIFY_STORE_DOMAIN: z.string().optional(),
  SHOPIFY_ADMIN_API_TOKEN: z.string().optional(),
  SHOPIFY_API_SECRET_KEY: z.string().optional(),

  // Logging
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),

  // Error tracking
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().default("development"),

  // Monitoring
  ENABLE_METRICS: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
  METRICS_PORT: z.string().transform(Number).default("9090"),

  // Security
  ENABLE_SECURITY_HEADERS: z
    .string()
    .transform((val) => val === "true")
    .default("true"),
  ENABLE_RATE_LIMITING: z
    .string()
    .transform((val) => val === "true")
    .default("true"),

  // File uploads
  MAX_FILE_SIZE: z.string().transform(Number).default("10485760"), // 10MB
  ALLOWED_FILE_TYPES: z
    .string()
    .default("image/jpeg,image/png,image/gif,image/webp"),

  // Email (if needed)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),

  // Redis (for session storage, caching)
  REDIS_URL: z.string().optional(),

  // Feature flags
  ENABLE_AI_FEATURES: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
  ENABLE_ANALYTICS: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
  ENABLE_DEBUG_MODE: z
    .string()
    .transform((val) => val === "true")
    .default("false"),
});

// Validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error("❌ Environment validation failed:");
    if (error.errors) {
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
    } else {
      console.error(`  - ${error.message}`);
    }
    process.exit(1);
  }
};

const env = parseEnv();

// Typed configuration object
const config = {
  // Server
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  isDevelopment: env.NODE_ENV === "development",
  isProduction: env.NODE_ENV === "production",
  isTest: env.NODE_ENV === "test",

  // URLs
  urls: {
    client: env.CLIENT_URL,
    server: env.SERVER_URL,
    corsOrigin: env.CORS_ORIGIN,
  },

  // Database
  database: {
    uri: env.MONGODB_URI,
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    },
  },

  // JWT
  jwt: {
    secret: env.JWT_SECRET,
    accessTokenExpiry: "15m",
    refreshTokenExpiry: "7d",
    algorithm: "HS256",
    issuer: "sastabazar",
    audience: "sastabazar-users",
  },

  // Rate limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
    },
    payment: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 10,
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
    },
    registration: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5,
    },
    admin: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 20,
    },
  },

  // Payment gateways
  payments: {
    razorpay: {
      keyId: env.RAZORPAY_KEY_ID,
      keySecret: env.RAZORPAY_KEY_SECRET,
      webhookSecret: env.RAZORPAY_WEBHOOK_SECRET,
      enabled: !!(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET),
    },
    stripe: {
      secretKey: env.STRIPE_SECRET_KEY,
      publishableKey: env.STRIPE_PUBLISHABLE_KEY,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
      enabled: !!(env.STRIPE_SECRET_KEY && env.STRIPE_PUBLISHABLE_KEY),
    },
  },

  // Shopify
  shopify: {
    storeDomain: env.SHOPIFY_STORE_DOMAIN,
    apiKey: env.SHOPIFY_ADMIN_API_TOKEN,
    apiSecret: env.SHOPIFY_API_SECRET_KEY,
    enabled: !!(env.SHOPIFY_STORE_DOMAIN && env.SHOPIFY_ADMIN_API_TOKEN),
  },

  // Logging
  logging: {
    level: env.LOG_LEVEL,
    enablePrettyPrint: env.NODE_ENV === "development",
    enableRequestLogging: true,
    enableErrorLogging: true,
    enablePerformanceLogging: env.NODE_ENV === "development",
  },

  // Error tracking
  sentry: {
    dsn: env.SENTRY_DSN,
    environment: env.SENTRY_ENVIRONMENT,
    enabled: !!env.SENTRY_DSN,
  },

  // Monitoring
  monitoring: {
    enabled: env.ENABLE_METRICS,
    port: env.METRICS_PORT,
  },

  // Security
  security: {
    enableHeaders: env.ENABLE_SECURITY_HEADERS,
    enableRateLimiting: env.ENABLE_RATE_LIMITING,
    enableCORS: true,
    enableHelmet: true,
  },

  // File uploads
  uploads: {
    maxFileSize: env.MAX_FILE_SIZE,
    allowedTypes: env.ALLOWED_FILE_TYPES.split(","),
    destination: "uploads/",
  },

  // Email
  email: {
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    from: env.FROM_EMAIL,
    enabled: !!(env.SMTP_HOST && env.SMTP_USER),
  },

  // Redis
  redis: {
    url: env.REDIS_URL,
    enabled: !!env.REDIS_URL,
  },

  // Feature flags
  features: {
    ai: env.ENABLE_AI_FEATURES,
    analytics: env.ENABLE_ANALYTICS,
    debug: env.ENABLE_DEBUG_MODE,
  },
};

// Validation helper
const validateConfig = () => {
  const errors = [];
  const warnings = [];

  // Check required configurations
  if (!config.database.uri) {
    errors.push("MongoDB URI is required");
  }

  if (!config.jwt.secret) {
    errors.push("JWT secret is required");
  }

  // Production-specific validations
  if (config.isProduction) {
    // Check for production URLs
    if (!config.urls.client.startsWith("https://")) {
      errors.push("CLIENT_URL must use HTTPS in production");
    }

    if (!config.urls.server.startsWith("https://")) {
      errors.push("SERVER_URL must use HTTPS in production");
    }

    // Check for default JWT secret
    if (
      config.jwt.secret.includes("your-super-secret") ||
      config.jwt.secret.includes("change-this") ||
      config.jwt.secret.length < 32
    ) {
      errors.push(
        "JWT secret must be changed from default and be at least 32 characters",
      );
    }

    // Check for MongoDB Atlas URI
    if (!config.database.uri.includes("mongodb+srv://")) {
      warnings.push("Consider using MongoDB Atlas for production");
    }

    // Check for payment gateway configuration
    if (!config.payments.razorpay.enabled && !config.payments.stripe.enabled) {
      errors.push(
        "At least one payment gateway must be configured for production",
      );
    }

    // Check for Sentry configuration
    if (!config.sentry.enabled) {
      warnings.push("Error tracking (Sentry) not configured for production");
    }
  }

  // Check payment gateway configuration
  if (!config.payments.razorpay.enabled && !config.payments.stripe.enabled) {
    warnings.push("No payment gateways configured");
  }

  // Check Shopify configuration
  if (!config.shopify.enabled) {
    warnings.push("Shopify integration not configured");
  }

  // Display warnings
  if (warnings.length > 0) {
    console.warn("⚠️ Configuration warnings:");
    warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  // Display errors and exit if any
  if (errors.length > 0) {
    console.error("❌ Configuration validation failed:");
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  console.log("✅ Configuration validated successfully");
};

// CORS configuration helper
const getCorsConfig = () => {
  const origins = [config.urls.corsOrigin];

  if (config.isDevelopment) {
    // Allow localhost ports for development
    origins.push(
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
    );
  }

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (origins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(
          {
            blockedOrigin: origin,
            allowedOrigins: origins,
          },
          "CORS: Blocked request from unauthorized origin",
        );
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: false, // Don't allow credentials for security
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "X-Correlation-ID",
    ],
    exposedHeaders: ["X-Correlation-ID"],
  };
};

// Export configuration
module.exports = {
  config,
  validateConfig,
  getCorsConfig,
  env,
};
