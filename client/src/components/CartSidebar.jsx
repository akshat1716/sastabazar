import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../services/utils";

const CartSidebar = ({ isOpen, onClose }) => {
  const { cart, updateCartItem, removeFromCart, clearCart } = useCart();
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
    } else {
      updateCartItem(itemId, newQuantity);
    }
  };

  const handleClearCart = () => {
    clearCart();
    handleClose();
  };

  const calculateTotal = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce((total, item) => {
      const price =
        item.selectedVariant?.price || item.productId?.basePrice || 0;
      return total + price * item.quantity;
    }, 0);
  };

  const total = calculateTotal();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={handleClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-aura-200">
              <h2 className="text-xl font-semibold text-aura-900">
                Shopping Cart
              </h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-aura-100 rounded-full transition-colors duration-200"
              >
                <X className="h-5 w-5 text-aura-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {!cart?.items || cart.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6">
                  <ShoppingBag className="h-16 w-16 text-aura-300 mb-4" />
                  <h3 className="text-lg font-medium text-aura-600 mb-2">
                    Your cart is empty
                  </h3>
                  <p className="text-aura-500 text-center">
                    Add some products to get started
                  </p>
                </div>
              ) : (
                <div className="p-6">
                  <div className="space-y-4">
                    {cart.items.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-start space-x-3 p-3 border border-aura-200 rounded-lg"
                      >
                        <img
                          src={
                            item.productId?.images?.[0]?.url ||
                            "/placeholder-product.jpg"
                          }
                          alt={item.productId?.name}
                          className="w-16 h-16 object-cover border border-aura-200 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-aura-900 truncate">
                            {item.productId?.name}
                          </h3>
                          {item.selectedVariant && (
                            <p className="text-sm text-aura-600">
                              {item.selectedVariant.name}:{" "}
                              {item.selectedVariant.value}
                            </p>
                          )}
                          <p className="text-sm font-medium text-aura-900 mt-1">
                            {formatCurrency(
                              (item.selectedVariant?.price ||
                                item.productId?.basePrice ||
                                0) * item.quantity,
                            )}
                          </p>

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    item._id,
                                    item.quantity - 1,
                                  )
                                }
                                className="p-1 text-aura-400 hover:text-aura-600 transition-colors duration-200"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="text-sm font-medium text-aura-900 w-8 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    item._id,
                                    item.quantity + 1,
                                  )
                                }
                                className="p-1 text-aura-400 hover:text-aura-600 transition-colors duration-200"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item._id)}
                              className="text-sm text-red-600 hover:text-red-800 transition-colors duration-200"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {cart?.items && cart.items.length > 0 && (
              <div className="border-t border-aura-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-medium text-aura-900">
                    Total
                  </span>
                  <span className="text-lg font-bold text-aura-900">
                    {formatCurrency(total)}
                  </span>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      handleClose();
                      window.location.href = "/checkout";
                    }}
                    className="w-full btn-primary"
                  >
                    Checkout
                  </button>
                  <button
                    onClick={handleClearCart}
                    className="w-full btn-secondary"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;
