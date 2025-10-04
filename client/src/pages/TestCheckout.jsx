import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLocalCart } from '../context/LocalCartContext';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../services/utils';

const TestCheckout = () => {
  const { cart, addToCart, clearCart } = useLocalCart();
  const navigate = useNavigate();

  useEffect(() => {
    // Ensure there's at least one product in the cart for testing
    if (!cart || cart.items.length === 0) {
      // Add a dummy product if cart is empty
      const dummyProduct = {
        _id: 'demo-1',
        name: '2 in 1 Garlic Peeler Set',
        description: 'Premium stainless steel garlic peeler set.',
        basePrice: 399,
        salePrice: 349,
        isOnSale: true,
        images: [{ url: 'https://images.unsplash.com/photo-1583847268964-dd287de79117?w=500&h=500&fit=crop', alt: 'Garlic Peeler' }],
        brand: 'VFulfil',
        category: 'home-goods'
      };
      addToCart(dummyProduct, 1);
      toast.info('Added a dummy product to cart for testing.');
    }
  }, [cart, addToCart]);

  const handleTestCheckout = () => {
    if (!cart || cart.items.length === 0) {
      toast.error('Cart is empty. Please add products to test checkout.');
      return;
    }
    navigate('/checkout');
  };

  const calculateTotal = () => {
    if (!cart) return 0;
    const subtotal = cart.totalPrice || 0;
    const shipping = 100; // Fixed shipping cost
    const tax = subtotal * 0.18; // 18% GST
    return subtotal + shipping + tax;
  };

  const total = calculateTotal();

  return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <h1 className="text-3xl font-bold mb-6">Test Checkout Page</h1>
      <p className="text-lg text-aura-700 mb-4">
        This page is for testing the checkout flow without needing to log in or deal with real payments.
      </p>

      <div className="bg-aura-50 p-6 rounded-lg shadow-inner mb-8">
        <h2 className="text-xl font-semibold text-aura-800 mb-3">Current Cart Summary</h2>
        {cart && cart.items.length > 0 ? (
          <>
            {cart.items.map(item => (
              <p key={item._id} className="text-aura-700">
                {item.productId?.name} (x{item.quantity}) - {formatCurrency((item.selectedVariant?.price || item.productId?.basePrice) * item.quantity)}
              </p>
            ))}
            <div className="border-t border-aura-200 mt-4 pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(cart.totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>{formatCurrency(100.00)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (18% GST):</span>
                <span>{formatCurrency(cart.totalPrice * 0.18)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-aura-600">Your cart is empty. A dummy product will be added.</p>
        )}
      </div>

      <button
        onClick={handleTestCheckout}
        className="btn-primary w-full max-w-xs mx-auto"
      >
        Test Checkout (Demo)
      </button>
      <p className="text-sm text-aura-500 mt-2">
        (This will redirect you to the simplified checkout page)
      </p>
      <Link to="/products" className="btn-secondary mt-4 block w-full max-w-xs mx-auto">
        Continue Shopping
      </Link>
    </div>
  );
};

export default TestCheckout;
