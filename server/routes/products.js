const express = require('express');
const Product = require('../models/Product');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all products with filtering and pagination
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      brand,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      isNewArrival,
      isOnSale,
      isFeatured,
      style,
      tags
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (brand) filter.brand = { $regex: brand, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = parseFloat(minPrice);
      if (maxPrice) filter.basePrice.$lte = parseFloat(maxPrice);
    }
    if (isNewArrival === 'true') filter.isNewArrival = true;
    if (isOnSale === 'true') filter.isOnSale = true;
    if (isFeatured === 'true') filter.isFeatured = true;
    if (style) filter.style = style;
    if (tags) filter.tags = { $in: tags.split(',') };

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('reviews.userId', 'firstName lastName');

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total,
        hasNext: skip + products.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// Get new arrivals
router.get('/new-arrivals', optionalAuth, async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const products = await Product.find({ 
      isNewArrival: true, 
      isActive: true 
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

    res.json({ products });
  } catch (error) {
    console.error('New arrivals fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch new arrivals.' });
  }
});

// Get featured products
router.get('/featured', optionalAuth, async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const products = await Product.find({ 
      isFeatured: true, 
      isActive: true 
    })
    .sort({ 'rating.average': -1 })
    .limit(parseInt(limit));

    res.json({ products });
  } catch (error) {
    console.error('Featured products fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch featured products.' });
  }
});

// Get sale products
router.get('/sale', optionalAuth, async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const products = await Product.find({ 
      isOnSale: true, 
      isActive: true 
    })
    .sort({ discountPercentage: -1 })
    .limit(parseInt(limit));

    res.json({ products });
  } catch (error) {
    console.error('Sale products fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch sale products.' });
  }
});

// Search products
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { q, page = 1, limit = 12 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required.' });
    }

    const filter = {
      $text: { $search: q },
      isActive: true
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(filter)
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      query: q,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total
      }
    });
  } catch (error) {
    console.error('Product search error:', error);
    res.status(500).json({ error: 'Search failed.' });
  }
});

// Get product categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    
    const categoryStats = await Promise.all(
      categories.map(async (category) => {
        const count = await Product.countDocuments({ 
          category, 
          isActive: true 
        });
        return { category, count };
      })
    );

    res.json({ categories: categoryStats });
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

// Get product brands
router.get('/brands', async (req, res) => {
  try {
    const brands = await Product.distinct('brand', { isActive: true });
    res.json({ brands });
  } catch (error) {
    console.error('Brands fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch brands.' });
  }
});

// Get products by category
router.get('/category/:category', optionalAuth, async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 12, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const filter = { 
      category, 
      isActive: true 
    };

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      category,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total
      }
    });
  } catch (error) {
    console.error('Category products fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch category products.' });
  }
});

// Get related products
router.get('/:id/related', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      category: product.category,
      isActive: true
    })
    .limit(4)
    .sort({ 'rating.average': -1 });

    res.json({ products: relatedProducts });
  } catch (error) {
    console.error('Related products fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch related products.' });
  }
});

// Get single product by ID (must be last to avoid conflicts)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('reviews.userId', 'firstName lastName')
      .populate('reviews');

    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Add to browsing history if user is authenticated
    if (req.user) {
      // This will be handled by the frontend calling the browsing history endpoint
    }

    res.json({ product });
  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch product.' });
  }
});

module.exports = router; 