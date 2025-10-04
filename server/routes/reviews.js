const express = require('express');
const Product = require('../models/Product');
const Review = require('../models/Review');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get product reviews
router.get('/:productId/reviews', optionalAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const filter = { productId, isActive: true };
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const reviews = await Review.find(filter)
      .populate('userId', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(filter);

    res.json({
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalReviews: total
      }
    });
  } catch (error) {
    console.error('Reviews fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

// Add review (requires authentication)
router.post('/:productId/reviews', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, title, comment } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      userId: req.user._id,
      productId
    });

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this product.' });
    }

    // Create review
    const review = new Review({
      userId: req.user._id,
      productId,
      rating,
      title,
      comment
    });

    await review.save();

    // Update product rating
    const productReviews = await Review.find({ productId, isActive: true });
    const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
    
    await Product.findByIdAndUpdate(productId, {
      'rating.average': avgRating,
      'rating.count': productReviews.length
    });

    const populatedReview = await Review.findById(review._id)
      .populate('userId', 'firstName lastName');

    res.status(201).json({ review: populatedReview });
  } catch (error) {
    console.error('Review creation error:', error);
    res.status(500).json({ error: 'Failed to create review.' });
  }
});

// Update review
router.put('/reviews/:reviewId', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;

    const review = await Review.findOne({
      _id: reviewId,
      userId: req.user._id
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    review.rating = rating;
    review.title = title;
    review.comment = comment;
    await review.save();

    // Update product rating
    const productReviews = await Review.find({ 
      productId: review.productId, 
      isActive: true 
    });
    const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
    
    await Product.findByIdAndUpdate(review.productId, {
      'rating.average': avgRating,
      'rating.count': productReviews.length
    });

    const updatedReview = await Review.findById(reviewId)
      .populate('userId', 'firstName lastName');

    res.json({ review: updatedReview });
  } catch (error) {
    console.error('Review update error:', error);
    res.status(500).json({ error: 'Failed to update review.' });
  }
});

// Delete review
router.delete('/reviews/:reviewId', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findOne({
      _id: reviewId,
      userId: req.user._id
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    review.isActive = false;
    await review.save();

    // Update product rating
    const productReviews = await Review.find({ 
      productId: review.productId, 
      isActive: true 
    });
    const avgRating = productReviews.length > 0 
      ? productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length 
      : 0;
    
    await Product.findByIdAndUpdate(review.productId, {
      'rating.average': avgRating,
      'rating.count': productReviews.length
    });

    res.json({ message: 'Review deleted successfully.' });
  } catch (error) {
    console.error('Review deletion error:', error);
    res.status(500).json({ error: 'Failed to delete review.' });
  }
});

// Like/unlike review
router.post('/reviews/:reviewId/like', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    // Check if user already liked
    const userLiked = review.likes.includes(req.user._id);
    
    if (userLiked) {
      // Unlike
      review.likes = review.likes.filter(id => id.toString() !== req.user._id.toString());
    } else {
      // Like
      review.likes.push(req.user._id);
    }

    await review.save();

    res.json({ 
      likes: review.likes.length,
      userLiked: !userLiked
    });
  } catch (error) {
    console.error('Review like error:', error);
    res.status(500).json({ error: 'Failed to like review.' });
  }
});

module.exports = router; 