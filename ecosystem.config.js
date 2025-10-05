module.exports = {
  apps: [
    {
      name: "sastabazar-server",
      script: "server/index.js",
      instances: "max", // Use all CPU cores
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      // Logging configuration
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // Process management
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,
      kill_timeout: 5000,
      listen_timeout: 3000,

      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,

      // Advanced PM2 features
      source_map_support: true,
      instance_var: "INSTANCE_ID",

      // Environment-specific configurations
      env_development: {
        NODE_ENV: "development",
        PORT: 5000,
        LOG_LEVEL: "debug",
      },
      env_staging: {
        NODE_ENV: "staging",
        PORT: 5000,
        LOG_LEVEL: "info",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
        LOG_LEVEL: "info",
      },
    },
  ],

  deploy: {
    production: {
      user: "node",
      host: "your-server.com",
      ref: "origin/main",
      repo: "git@github.com:your-username/sastabazar.git",
      path: "/var/www/sastabazar",
      "pre-deploy-local": "",
      "post-deploy":
        "npm install && npm run build && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
      env: {
        NODE_ENV: "production",
      },
    },
    staging: {
      user: "node",
      host: "staging-server.com",
      ref: "origin/develop",
      repo: "git@github.com:your-username/sastabazar.git",
      path: "/var/www/sastabazar-staging",
      "pre-deploy-local": "",
      "post-deploy":
        "npm install && npm run build && pm2 reload ecosystem.config.js --env staging",
      "pre-setup": "",
      env: {
        NODE_ENV: "staging",
      },
    },
  },
};
