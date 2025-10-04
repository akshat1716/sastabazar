const express = require('express');
const router = express.Router();
const shopifyClient = require('../config/shopify');

// GET /api/shopify/products - Fetch all active products from Shopify
router.get('/products', async (req, res) => {
  try {
    if (!shopifyClient) {
      return res.status(503).json({
        success: false,
        message: 'Shopify integration not configured. Please add valid Shopify credentials to .env file.',
        error: 'Shopify client not initialized'
      });
    }

    console.log('🔄 Fetching products from Shopify...');
    const response = await shopifyClient.get('/products.json', {
      params: { status: 'active' }
    });

    console.log(`✅ Successfully fetched ${response.data.products.length} products from Shopify.`);
    res.status(200).json({
      success: true,
      count: response.data.products.length,
      products: response.data.products
    });
  } catch (error) {
    console.error('❌ Failed to fetch products:', error.response ? error.response.data : error.message);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch products from Shopify',
      error: error.message 
    });
  }
});

// GET /api/shopify/products/:id - Fetch a specific product by ID
router.get('/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    console.log(`🔄 Fetching product ${productId} from Shopify...`);
    
    const response = await shopifyClient.get(`/products/${productId}.json`);

    console.log(`✅ Successfully fetched product ${productId} from Shopify.`);
    res.status(200).json({
      success: true,
      product: response.data.product
    });
  } catch (error) {
    console.error(`❌ Failed to fetch product ${req.params.id}:`, error.response ? error.response.data : error.message);
    res.status(500).json({ 
      success: false,
      message: `Failed to fetch product ${req.params.id} from Shopify`,
      error: error.message 
    });
  }
});

// GET /api/shopify/orders - Fetch orders from Shopify
router.get('/orders', async (req, res) => {
  try {
    console.log('🔄 Fetching orders from Shopify...');
    const response = await shopifyClient.get('/orders.json', {
      params: { limit: 50 }
    });

    console.log(`✅ Successfully fetched ${response.data.orders.length} orders from Shopify.`);
    res.status(200).json({
      success: true,
      count: response.data.orders.length,
      orders: response.data.orders
    });
  } catch (error) {
    console.error('❌ Failed to fetch orders:', error.response ? error.response.data : error.message);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch orders from Shopify',
      error: error.message 
    });
  }
});

// GET /api/shopify/customers - Fetch customers from Shopify
router.get('/customers', async (req, res) => {
  try {
    console.log('🔄 Fetching customers from Shopify...');
    const response = await shopifyClient.get('/customers.json', {
      params: { limit: 50 }
    });

    console.log(`✅ Successfully fetched ${response.data.customers.length} customers from Shopify.`);
    res.status(200).json({
      success: true,
      count: response.data.customers.length,
      customers: response.data.customers
    });
  } catch (error) {
    console.error('❌ Failed to fetch customers:', error.response ? error.response.data : error.message);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch customers from Shopify',
      error: error.message 
    });
  }
});

// GET /api/shopify/store-info - Get store information
router.get('/store-info', async (req, res) => {
  try {
    console.log('🔄 Fetching store information from Shopify...');
    const response = await shopifyClient.get('/shop.json');

    console.log('✅ Successfully fetched store information from Shopify.');
    res.status(200).json({
      success: true,
      store: response.data.shop
    });
  } catch (error) {
    console.error('❌ Failed to fetch store info:', error.response ? error.response.data : error.message);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch store information from Shopify',
      error: error.message 
    });
  }
});

module.exports = router;
