import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useLocalCart } from "../context/LocalCartContext";
import { formatCurrency } from "../services/utils";
import { Heart, Share2, ChevronLeft, ChevronRight, X } from "lucide-react";
import api from "../utils/api";

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useLocalCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        if (response.data && response.data.product) {
          const productData = response.data.product;

          // Use the product data directly from our database
          setProduct(productData);
          if (productData.variants && productData.variants.length > 0) {
            setSelectedVariant(productData.variants[0]);
          }
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariant);
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setSelectedImageIndex(
      (prev) => (prev - 1 + product.images.length) % product.images.length,
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="aspect-square bg-gray-200 rounded"></div>
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-gray-200 rounded"
                    ></div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-light text-gray-900 mb-4">
            Product not found
          </h1>
          <Link
            to="/products"
            className="text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Link
              to="/products"
              className="hover:text-gray-900 transition-colors"
            >
              PRODUCTS
            </Link>
            <span>/</span>
            <span className="text-gray-900">{product.name.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-gray-100 overflow-hidden group">
              <img
                src={
                  product.images[selectedImageIndex]?.url ||
                  "https://via.placeholder.com/600x600?text=No+Image"
                }
                alt={product.images[selectedImageIndex]?.alt || product.name}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setShowImageModal(true)}
              />

              {/* Navigation Arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft size={20} className="text-gray-700" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight size={20} className="text-gray-700" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              {product.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                  {selectedImageIndex + 1} / {product.images.length}
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square bg-gray-100 overflow-hidden border-2 transition-colors ${
                      index === selectedImageIndex
                        ? "border-gray-900"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.alt || product.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Product Title */}
            <div>
              <h1 className="text-2xl font-light text-gray-900 tracking-wide mb-2">
                {product.name.toUpperCase()}
              </h1>
              <p className="text-sm text-gray-500 uppercase tracking-wide">
                {product.brand}
              </p>
            </div>

            {/* Price */}
            <div>
              {product.isOnSale ? (
                <div className="flex items-center space-x-3">
                  <span className="text-2xl font-light text-gray-900">
                    {formatCurrency(product.salePrice)}
                  </span>
                  <span className="text-lg text-gray-500 line-through">
                    {formatCurrency(product.basePrice)}
                  </span>
                  <span className="text-sm text-red-600 font-medium">
                    {Math.round(
                      ((product.basePrice - product.salePrice) /
                        product.basePrice) *
                        100,
                    )}
                    % OFF
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-light text-gray-900">
                  {formatCurrency(product.basePrice)}
                </span>
              )}
              <p className="text-xs text-gray-500 mt-1">
                MRP INCL. OF ALL TAXES
              </p>
            </div>

            {/* Description */}
            <div className="prose prose-sm max-w-none">
              <div dangerouslySetInnerHTML={{ __html: product.description }} />
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 1 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  SELECT VARIANT
                </h3>
                <div className="space-y-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`w-full text-left p-3 border transition-colors ${
                        selectedVariant?.id === variant.id
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {variant.name}
                        </span>
                        <span className="text-sm text-gray-600">
                          {formatCurrency(variant.price)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                QUANTITY
              </h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  -
                </button>
                <span className="text-sm font-medium w-8 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                className="w-full bg-gray-900 text-white py-3 px-6 hover:bg-gray-800 transition-colors text-sm font-medium tracking-wide"
              >
                ADD TO CART
              </button>

              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <Heart size={16} />
                  <span className="text-sm">ADD TO WISHLIST</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <Share2 size={16} />
                  <span className="text-sm">SHARE</span>
                </button>
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-4 pt-6 border-t border-gray-100">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  PRODUCT DETAILS
                </h3>
                <p className="text-sm text-gray-600">
                  High-quality product from {product.brand}. Carefully crafted
                  with attention to detail.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  SHIPPING & RETURNS
                </h3>
                <p className="text-sm text-gray-600">
                  Free shipping on orders over ₹999. Easy returns within 30
                  days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X size={24} />
            </button>

            <div className="relative">
              <img
                src={product.images[selectedImageIndex]?.url}
                alt={product.images[selectedImageIndex]?.alt || product.name}
                className="max-w-full max-h-[80vh] object-contain"
              />

              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            <div className="text-center mt-4 text-white">
              <p className="text-sm">
                {selectedImageIndex + 1} / {product.images.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
