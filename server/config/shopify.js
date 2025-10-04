const axios = require('axios');
const { config } = require('./index');

// Only create Shopify client if valid credentials are provided
let shopifyClient = null;

if (config.shopify.storeDomain && config.shopify.apiKey && config.shopify.apiSecret) {
  try {
    shopifyClient = axios.create({
      baseURL: `https://${config.shopify.storeDomain}/admin/api/2024-01`,
      headers: {
        'X-Shopify-Access-Token': config.shopify.apiKey,
        'Content-Type': 'application/json',
      },
    });
    console.log('✅ Shopify client initialized successfully');
  } catch (error) {
    console.warn('⚠️ Failed to initialize Shopify client:', error.message);
  }
} else {
  console.warn('⚠️ Shopify credentials not provided. Shopify integration disabled.');
}

module.exports = shopifyClient;
