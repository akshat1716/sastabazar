// eslint.config.js
"use strict";

// Import the ESLint plugin
const globals = require("globals");
const js = require("@eslint/js");

module.exports = [
  // Apply the recommended configuration
  js.configs.recommended,

  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // You can add custom rules here if needed
      "no-unused-vars": "warn",
      "no-console": "off",
    }
  }
];