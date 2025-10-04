const express = require('express');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// Get user's wishlist
router.get('/', async (req, res) => {
  try {
    const wishlist = await Wishlist.find({ userId: req.user._id })
      .populate('productId')
      .sort({ createdAt: -1 });

    res.json({ wishlist });
  } catch (error) {
    console.error('Wishlist fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist.' });
  }
});

// Add product to wishlist
router.post('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Check if already in wishlist
    const existingItem = await Wishlist.findOne({
      userId: req.user._id,
      productId
    });

    if (existingItem) {
      return res.status(400).json({ error: 'Product already in wishlist.' });
    }

    // Add to wishlist
    const wishlistItem = new Wishlist({
      userId: req.user._id,
      productId
    });

    await wishlistItem.save();
    
    const populatedItem = await Wishlist.findById(wishlistItem._id)
      .populate('productId');

    res.status(201).json({ wishlistItem: populatedItem });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ error: 'Failed to add to wishlist.' });
  }
});

// Remove product from wishlist
router.delete('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    const deletedItem = await Wishlist.findOneAndDelete({
      userId: req.user._id,
      productId
    });

    if (!deletedItem) {
      return res.status(404).json({ error: 'Wishlist item not found.' });
    }

    res.json({ message: 'Removed from wishlist.' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ error: 'Failed to remove from wishlist.' });
  }
});

// Clear entire wishlist
router.delete('/clear', async (req, res) => {
  try {
    await Wishlist.deleteMany({ userId: req.user._id });
    res.json({ message: 'Wishlist cleared.' });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({ error: 'Failed to clear wishlist.' });
  }
});

// Check if product is in wishlist
router.get('/check/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    const wishlistItem = await Wishlist.findOne({
      userId: req.user._id,
      productId
    });

    res.json({ isInWishlist: !!wishlistItem });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({ error: 'Failed to check wishlist.' });
  }
});

module.exports = router; 