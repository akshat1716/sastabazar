const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user's cart
router.get('/', auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id })
      .populate('items.productId');

    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
      await cart.save();
    }

    res.json({ cart });
  } catch (error) {
    console.error('Cart fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch cart.' });
  }
});

// Add item to cart
router.post('/add', auth, async (req, res) => {
  try {
    const { productId, quantity = 1, variant } = req.body;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock.' });
    }

    // Get or create cart
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }

    // Add item to cart
    await cart.addItem(productId, quantity, variant);

    // Populate product details
    await cart.populate('items.productId');

    res.json({
      message: 'Item added to cart successfully.',
      cart
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add item to cart.' });
  }
});

// Update item quantity
router.put('/update/:itemId', auth, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1.' });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found.' });
    }

    // Check if item exists in cart
    const item = cart.items.find(item => item._id.toString() === itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found in cart.' });
    }

    // Check stock
    const product = await Product.findById(item.productId);
    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock.' });
    }

    await cart.updateQuantity(itemId, quantity);
    await cart.populate('items.productId');

    res.json({
      message: 'Cart updated successfully.',
      cart
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Failed to update cart.' });
  }
});

// Remove item from cart
router.delete('/remove/:itemId', auth, async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found.' });
    }

    await cart.removeItem(itemId);
    await cart.populate('items.productId');

    res.json({
      message: 'Item removed from cart successfully.',
      cart
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove item from cart.' });
  }
});

// Clear cart
router.delete('/clear', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found.' });
    }

    await cart.clearCart();

    res.json({
      message: 'Cart cleared successfully.',
      cart
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart.' });
  }
});

// Get cart summary (for header display)
router.get('/summary', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    
    if (!cart) {
      return res.json({
        totalItems: 0,
        totalPrice: 0
      });
    }

    res.json({
      totalItems: cart.totalItems,
      totalPrice: cart.totalPrice
    });
  } catch (error) {
    console.error('Cart summary error:', error);
    res.status(500).json({ error: 'Failed to fetch cart summary.' });
  }
});

// Validate cart items (check stock and availability)
router.post('/validate', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id })
      .populate('items.productId');

    if (!cart || cart.items.length === 0) {
      return res.json({
        isValid: false,
        message: 'Cart is empty.'
      });
    }

    const validationResults = [];
    let isValid = true;

    for (const item of cart.items) {
      const product = item.productId;
      
      if (!product || !product.isActive) {
        validationResults.push({
          itemId: item._id,
          productId: item.productId,
          error: 'Product no longer available.'
        });
        isValid = false;
      } else if (product.stock < item.quantity) {
        validationResults.push({
          itemId: item._id,
          productId: product._id,
          error: `Only ${product.stock} items available in stock.`
        });
        isValid = false;
      }
    }

    res.json({
      isValid,
      validationResults
    });
  } catch (error) {
    console.error('Cart validation error:', error);
    res.status(500).json({ error: 'Failed to validate cart.' });
  }
});

module.exports = router; 