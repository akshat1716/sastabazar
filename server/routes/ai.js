const express = require('express');
const Product = require('../models/Product');
const User = require('../models/User');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// AI Shopping Assistant - Chatbot endpoint
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    // Simple AI logic to understand user intent and provide recommendations
    const response = await processChatMessage(message, conversationHistory, req.user);

    res.json({
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message.' });
  }
});

// Visual Search - Analyze uploaded image and find similar products
router.post('/visual-search', optionalAuth, async (req, res) => {
  try {
    const { imageData, category } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'Image data is required.' });
    }

    // Simulate AI image analysis and product matching
    const similarProducts = await performVisualSearch(imageData, category);

    res.json({
      products: similarProducts,
      searchType: 'visual',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Visual search error:', error);
    res.status(500).json({ error: 'Failed to perform visual search.' });
  }
});

// Personalized Recommendations
router.get('/recommendations/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 8 } = req.query;

    // Verify user is requesting their own recommendations
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const recommendations = await generatePersonalizedRecommendations(userId, limit);

    res.json({
      recommendations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations.' });
  }
});

// Get recommendations for current user
router.get('/recommendations', auth, async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const recommendations = await generatePersonalizedRecommendations(req.user._id, limit);

    res.json({
      recommendations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations.' });
  }
});

// AI Helper Functions

async function processChatMessage(message, conversationHistory, user) {
  const lowerMessage = message.toLowerCase();
  
  // Extract keywords and intent
  const keywords = extractKeywords(lowerMessage);
  const intent = determineIntent(lowerMessage);
  
  // Generate response based on intent and user preferences
  let response = {
    message: '',
    products: [],
    suggestions: []
  };

  switch (intent) {
    case 'greeting':
      response.message = "Hello! I'm your AI shopping assistant. What are you looking for today? I can help you find products across all categories.";
      response.suggestions = [
        "Show me modern furniture",
        "I need tech accessories",
        "What's trending in apparel?",
        "Help me find art prints"
      ];
      break;

    case 'product_search': {
      const searchResults = await searchProductsByKeywords(keywords, user);
      response.message = `I found ${searchResults.length} products that match your request. Here are some recommendations:`;
      response.products = searchResults.slice(0, 4);
      break;
    }

    case 'style_advice': {
      response.message = "I'd be happy to help you with style recommendations! What aesthetic are you going for? (e.g., Modern, Industrial, Artisan, Minimalist, Luxury)";
      break;
    }

    case 'category_explore': {
      const category = extractCategory(lowerMessage);
      if (category) {
        const categoryProducts = await Product.find({ 
          category, 
          isActive: true 
        }).limit(4);
        response.message = `Here are some great ${category} items:`;
        response.products = categoryProducts;
      }
      break;
    }

    case 'price_inquiry': {
      response.message = "I can help you find products within your budget. What price range are you looking for?";
      break;
    }

    default:
      response.message = "I understand you're looking for something. Could you tell me more about what you need? I can help with specific products, style advice, or category recommendations.";
  }

  return response;
}

function extractKeywords(message) {
  const keywords = [];
  const commonWords = ['looking', 'for', 'need', 'want', 'find', 'show', 'me', 'some', 'good', 'nice', 'beautiful', 'modern', 'minimalist', 'luxury'];
  
  const words = message.split(' ');
  words.forEach(word => {
    if (!commonWords.includes(word) && word.length > 2) {
      keywords.push(word);
    }
  });
  
  return keywords;
}

function determineIntent(message) {
  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    return 'greeting';
  }
  if (message.includes('looking') || message.includes('find') || message.includes('need') || message.includes('want')) {
    return 'product_search';
  }
  if (message.includes('style') || message.includes('aesthetic') || message.includes('look')) {
    return 'style_advice';
  }
  if (message.includes('category') || message.includes('apparel') || message.includes('furniture') || message.includes('tech')) {
    return 'category_explore';
  }
  if (message.includes('price') || message.includes('cost') || message.includes('budget')) {
    return 'price_inquiry';
  }
  return 'general';
}

function extractCategory(message) {
  if (message.includes('apparel') || message.includes('clothing') || message.includes('fashion')) {
    return 'apparel';
  }
  if (message.includes('home') || message.includes('furniture') || message.includes('decor')) {
    return 'home-goods';
  }
  if (message.includes('tech') || message.includes('accessories') || message.includes('gadgets')) {
    return 'tech-accessories';
  }
  if (message.includes('art') || message.includes('prints') || message.includes('wall')) {
    return 'art-prints';
  }
  return null;
}

async function searchProductsByKeywords(keywords, user) {
  const query = {
    isActive: true,
    $or: [
      { name: { $regex: keywords.join('|'), $options: 'i' } },
      { description: { $regex: keywords.join('|'), $options: 'i' } },
      { tags: { $in: keywords } },
      { style: { $in: keywords } }
    ]
  };

  // Add user preferences if available
  if (user && user.preferences) {
    if (user.preferences.categories && user.preferences.categories.length > 0) {
      query.category = { $in: user.preferences.categories };
    }
    if (user.preferences.style) {
      query.style = user.preferences.style;
    }
  }

  return await Product.find(query).limit(8);
}

async function performVisualSearch(imageData, category) {
  // Simulate AI image analysis
  // In a real implementation, this would use computer vision APIs
  
  const query = { isActive: true };
  if (category) {
    query.category = category;
  }

  // Simulate finding visually similar products based on common visual features
  const allProducts = await Product.find(query);
  
  // Randomly select products to simulate AI matching
  const shuffled = allProducts.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 6);
}

async function generatePersonalizedRecommendations(userId, limit) {
  const user = await User.findById(userId)
    .populate('browsingHistory.productId')
    .populate('purchaseHistory.orderId');

  const recommendations = [];

  // Get user preferences
  const userPreferences = user.preferences || {};
  const userCategories = userPreferences.categories || [];
  const userStyle = userPreferences.style;

  // Build recommendation query
  const query = { isActive: true };

  // Add category preference
  if (userCategories.length > 0) {
    query.category = { $in: userCategories };
  }

  // Add style preference
  if (userStyle) {
    query.style = userStyle;
  }

  // Get products based on preferences
  const preferenceProducts = await Product.find(query)
    .sort({ 'rating.average': -1 })
    .limit(Math.floor(limit / 2));

  recommendations.push(...preferenceProducts);

  // Get products based on browsing history
  const browsedProductIds = user.browsingHistory.map(item => item.productId);
  if (browsedProductIds.length > 0) {
    const similarProducts = await Product.find({
      _id: { $nin: recommendations.map(p => p._id) },
      category: { $in: user.browsingHistory.map(item => item.productId?.category).filter(Boolean) },
      isActive: true
    })
    .sort({ 'rating.average': -1 })
    .limit(Math.floor(limit / 2));

    recommendations.push(...similarProducts);
  }

  // Fill remaining slots with trending products
  const remainingSlots = limit - recommendations.length;
  if (remainingSlots > 0) {
    const trendingProducts = await Product.find({
      _id: { $nin: recommendations.map(p => p._id) },
      isActive: true
    })
    .sort({ 'rating.average': -1, createdAt: -1 })
    .limit(remainingSlots);

    recommendations.push(...trendingProducts);
  }

  return recommendations.slice(0, limit);
}

module.exports = router; 