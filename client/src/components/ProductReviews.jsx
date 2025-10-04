import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import { Star, ThumbsUp, MessageCircle } from 'lucide-react';

const ProductReviews = ({ productId }) => {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: ''
  });

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/products/${productId}/reviews`);
      setReviews(response.data.reviews);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(`/products/${productId}/reviews`, newReview);
      setReviews([response.data.review, ...reviews]);
      setNewReview({ rating: 5, title: '', comment: '' });
      setShowReviewForm(false);
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  const handleLikeReview = async (reviewId) => {
    try {
      await api.post(`/reviews/${reviewId}/like`);
      setReviews(reviews.map(review => 
        review._id === reviewId 
          ? { ...review, likes: review.likes + 1, userLiked: true }
          : review
      ));
    } catch (error) {
      console.error('Failed to like review:', error);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={`${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aura-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Customer Reviews ({reviews.length})
        </h3>
        {isAuthenticated && (
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="btn-primary text-sm"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Write Your Review</h4>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex space-x-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setNewReview({ ...newReview, rating: i + 1 })}
                    className="focus:outline-none"
                  >
                    <Star
                      size={24}
                      className={`${i < newReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={newReview.title}
                onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                className="input-field"
                placeholder="Summarize your experience"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment
              </label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                rows={4}
                className="input-field"
                placeholder="Share your detailed experience with this product"
                required
              />
            </div>

            <div className="flex space-x-3">
              <button type="submit" className="btn-primary">
                Submit Review
              </button>
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h4>
          <p className="text-gray-500">
            Be the first to share your experience with this product.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review._id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-aura-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-aura-900">
                      {review.userId?.firstName?.[0]}{review.userId?.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">
                      {review.userId?.firstName} {review.userId?.lastName}
                    </h5>
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {renderStars(review.rating)}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {review.title && (
                <h6 className="font-medium text-gray-900 mb-2">{review.title}</h6>
              )}

              <p className="text-gray-700 mb-4">{review.comment}</p>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleLikeReview(review._id)}
                  className={`flex items-center space-x-1 text-sm ${
                    review.userLiked ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
                  }`}
                >
                  <ThumbsUp size={16} />
                  <span>{review.likes || 0}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductReviews; 