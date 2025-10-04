const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const jwtSecurity = require('../config/jwt');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName
    });

    await user.save();

    // Generate JWT tokens
    const accessToken = jwtSecurity.createAccessToken({
      userId: user._id,
      email: user.email,
      role: user.role
    });
    
    const refreshToken = jwtSecurity.createRefreshToken({
      userId: user._id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      message: 'User registered successfully.',
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
      user: user.getProfile()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT tokens
    const accessToken = jwtSecurity.createAccessToken({
      userId: user._id,
      email: user.email,
      role: user.role
    });
    
    const refreshToken = jwtSecurity.createRefreshToken({
      userId: user._id,
      email: user.email,
      role: user.role
    });

    res.json({
      message: 'Login successful.',
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
      user: user.getProfile()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ 
        error: 'Refresh token required.',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    const result = jwtSecurity.refreshAccessToken(refreshToken);
    
    res.json({
      message: 'Token refreshed successfully.',
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    
    if (error.message.includes('expired')) {
      return res.status(401).json({ 
        error: 'Refresh token has expired.',
        code: 'REFRESH_TOKEN_EXPIRED'
      });
    } else if (error.message.includes('Invalid')) {
      return res.status(401).json({ 
        error: 'Invalid refresh token.',
        code: 'INVALID_REFRESH_TOKEN'
      });
    } else {
      return res.status(401).json({ 
        error: 'Token refresh failed.',
        code: 'REFRESH_FAILED'
      });
    }
  }
});

// Logout user
router.post('/logout', auth, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      jwtSecurity.revokeRefreshToken(refreshToken);
    }
    
    res.json({
      message: 'Logout successful.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed.' });
  }
});

// Logout from all devices
router.post('/logout-all', auth, async (req, res) => {
  try {
    jwtSecurity.revokeAllUserTokens(req.user._id);
    
    res.json({
      message: 'Logged out from all devices successfully.'
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ error: 'Logout from all devices failed.' });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({
      user: req.user
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, preferences } = req.body;
    const updates = {};

    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (preferences) updates.preferences = preferences;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully.',
      user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// Update user preferences
router.put('/preferences', auth, async (req, res) => {
  try {
    const { categories, style } = req.body;
    const updates = {};

    if (categories) updates['preferences.categories'] = categories;
    if (style) updates['preferences.style'] = style;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Preferences updated successfully.',
      user
    });
  } catch (error) {
    console.error('Preferences update error:', error);
    res.status(500).json({ error: 'Failed to update preferences.' });
  }
});

// Add product to browsing history
router.post('/browsing-history', auth, async (req, res) => {
  try {
    const { productId } = req.body;

    // Add to browsing history (limit to last 50 items)
    const user = await User.findById(req.user._id);
    user.browsingHistory.unshift({ productId });
    
    // Keep only the last 50 items
    if (user.browsingHistory.length > 50) {
      user.browsingHistory = user.browsingHistory.slice(0, 50);
    }

    await user.save();

    res.json({
      message: 'Browsing history updated.'
    });
  } catch (error) {
    console.error('Browsing history error:', error);
    res.status(500).json({ error: 'Failed to update browsing history.' });
  }
});

// Get browsing history
router.get('/browsing-history', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('browsingHistory.productId')
      .select('browsingHistory');

    res.json({
      browsingHistory: user.browsingHistory
    });
  } catch (error) {
    console.error('Browsing history fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch browsing history.' });
  }
});

// Logout (client-side token removal)
router.post('/logout', auth, async (req, res) => {
  try {
    res.json({
      message: 'Logged out successfully.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed.' });
  }
});

module.exports = router; 