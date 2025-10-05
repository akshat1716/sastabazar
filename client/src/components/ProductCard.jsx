import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import { useLocalCart } from "../context/LocalCartContext";
import { formatCurrency } from "../services/utils";

const ProductCard = ({ product, viewMode = "grid" }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const { addToCart } = useLocalCart();

  // Use product data directly from our API (no transformation needed)
  const transformedProduct = {
    _id: product._id,
    name: product.name,
    brand: product.brand || "sastabazar",
    images: product.images || [],
    basePrice: product.basePrice || 0,
    salePrice: product.salePrice || product.basePrice || 0,
    isOnSale: product.isOnSale || false,
    isNewArrival: product.isNewArrival || false,
    tags: product.tags || [],
    category: product.category,
    rating: product.rating || { average: 0, count: 0 },
    ...product, // Keep original product data for cart functionality
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(transformedProduct, 1);
  };

  const handleImageChange = (index) => {
    setCurrentImageIndex(index);
  };

  if (viewMode === "list") {
    return (
      <Link to={`/products/${transformedProduct._id}`} className="block">
        <div className="flex items-center space-x-6 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors">
          <div className="relative w-24 h-24 flex-shrink-0">
            <img
              src={
                transformedProduct.images[currentImageIndex]?.url ||
                "https://via.placeholder.com/96x96?text=No+Image"
              }
              alt={
                transformedProduct.images[currentImageIndex]?.alt ||
                transformedProduct.name
              }
              className="w-full h-full object-cover"
              onLoad={() => {
                setImageLoading(false);
                setImageError(false);
              }}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {transformedProduct.name}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {transformedProduct.brand}
            </p>
            <div className="mt-2">
              {transformedProduct.isOnSale ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(transformedProduct.salePrice)}
                  </span>
                  <span className="text-xs text-gray-500 line-through">
                    {formatCurrency(transformedProduct.basePrice)}
                  </span>
                </div>
              ) : (
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(transformedProduct.basePrice)}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleAddToCart}
            className="px-4 py-2 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors text-xs font-medium"
          >
            ADD TO CART
          </button>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/products/${transformedProduct._id}`} className="block group">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {/* Loading State */}
          {imageLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            </div>
          )}

          {/* Main Image */}
          <img
            src={
              transformedProduct.images[currentImageIndex]?.url ||
              "https://via.placeholder.com/400x400?text=No+Image"
            }
            alt={
              transformedProduct.images[currentImageIndex]?.alt ||
              transformedProduct.name
            }
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onLoad={() => {
              setImageLoading(false);
              setImageError(false);
            }}
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
          />

          {/* Error State */}
          {imageError && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <div className="text-gray-400 text-center">
                <div className="text-2xl mb-1">📷</div>
                <div className="text-xs">Image not available</div>
              </div>
            </div>
          )}

          {/* Image Thumbnails */}
          {transformedProduct.images.length > 1 && (
            <div className="absolute bottom-2 left-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {transformedProduct.images.slice(0, 4).map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleImageChange(index);
                  }}
                  className={`flex-1 h-1 rounded-full transition-colors ${
                    index === currentImageIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

          {/* Quick Actions */}
          <div className="absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={handleAddToCart}
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
            >
              <ShoppingBag size={14} className="text-gray-700" />
            </button>
            <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors">
              <Heart size={14} className="text-gray-700" />
            </button>
          </div>

          {/* Sale Badge */}
          {transformedProduct.isOnSale && (
            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-medium px-2 py-1">
              SALE
            </div>
          )}

          {/* New Badge */}
          {transformedProduct.isNewArrival && (
            <div className="absolute top-2 left-2 bg-green-600 text-white text-xs font-medium px-2 py-1">
              NEW
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="mt-3 space-y-1">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-gray-700 transition-colors">
            {transformedProduct.name}
          </h3>
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            {transformedProduct.brand}
          </p>
          <div className="flex items-center justify-between">
            <div>
              {transformedProduct.isOnSale ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(transformedProduct.salePrice)}
                  </span>
                  <span className="text-xs text-gray-500 line-through">
                    {formatCurrency(transformedProduct.basePrice)}
                  </span>
                </div>
              ) : (
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(transformedProduct.basePrice)}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-xs">
                    ★
                  </span>
                ))}
              </div>
              <span className="text-xs text-gray-500">
                ({transformedProduct.rating.count})
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default ProductCard;
