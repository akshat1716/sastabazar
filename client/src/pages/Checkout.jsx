import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalCart } from '../context/LocalCartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '../services/utils';
import paymentService from '../services/payment';

const Checkout = () => {
  const { cart, clearCart } = useLocalCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [shippingAddress, setShippingAddress] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India'
  });

  // Update shipping address when user data changes or loads from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    let userData = user;
    
    if (!userData && storedUser) {
      try {
        userData = JSON.parse(storedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }
    
    if (userData) {
      setShippingAddress(prev => ({
        ...prev,
        firstName: userData.firstName || userData.name?.split(' ')[0] || '',
        lastName: userData.lastName || userData.name?.split(' ')[1] || '',
        email: userData.email || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      navigate('/cart');
    }
    
    // For demo purposes, we'll skip authentication requirement
    // In production, you would want to require authentication
    // const token = localStorage.getItem('token');
    // const storedUser = localStorage.getItem('user');
    // 
    // if (!user && !token && !storedUser) {
    //   navigate('/login');
    //   return;
    // }
  }, [cart, navigate, user]);

  const calculateTotal = () => {
    if (!cart) return 0;
    const subtotal = cart.totalPrice || 0;
    const shipping = 100; // Fixed shipping cost
    const tax = subtotal * 0.18; // 18% GST
    return subtotal + shipping + tax;
  };

  const handlePayment = async () => {
    if (!shippingAddress.firstName || !shippingAddress.email || !shippingAddress.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      // Demo payment flow - simulate order creation
      const orderData = {
        items: cart.items.map(item => ({
          productId: item.productId,
          name: item.productId.name,
          quantity: item.quantity,
          basePrice: item.productId.basePrice,
          selectedVariant: item.selectedVariant,
          image: item.productId.images?.[0]?.url
        })),
        shippingAddress,
        billingAddress: shippingAddress,
        shippingMethod: 'standard',
        notes: ''
      };

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a demo order ID
      const demoOrderId = `DEMO_${Date.now()}`;
      
      // Clear cart
      clearCart();
      
      // Show success message
      toast.success('Order placed successfully!');
      
      // Redirect to success page
      navigate(`/payment/success?order_id=${demoOrderId}`);
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>
        <p>Your cart is empty.</p>
      </div>
    );
  }

  const total = calculateTotal();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div key={item._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={item.productId.images[0]?.url || '/placeholder-product.jpg'}
                      alt={item.productId.name}
                      className="w-12 h-12 object-cover border border-aura-200"
                    />
                    <div>
                      <div className="font-medium">{item.productId.name}</div>
                      <div className="text-sm text-aura-600">Qty: {item.quantity}</div>
                    </div>
                  </div>
                  <div className="font-semibold">
                    {formatCurrency((item.productId.salePrice || item.productId.basePrice) * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-aura-200 mt-4 pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(cart.totalPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>{formatCurrency(100)}</span>
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
          </div>

          {/* Shipping Address */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First Name *"
                value={shippingAddress.firstName}
                onChange={(e) => setShippingAddress({...shippingAddress, firstName: e.target.value})}
                className="input-field"
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={shippingAddress.lastName}
                onChange={(e) => setShippingAddress({...shippingAddress, lastName: e.target.value})}
                className="input-field"
              />
              <input
                type="email"
                placeholder="Email *"
                value={shippingAddress.email}
                onChange={(e) => setShippingAddress({...shippingAddress, email: e.target.value})}
                className="input-field"
                required
              />
              <input
                type="tel"
                placeholder="Phone *"
                value={shippingAddress.phone}
                onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                className="input-field"
                required
              />
              <input
                type="text"
                placeholder="Address"
                value={shippingAddress.address}
                onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})}
                className="input-field col-span-2"
              />
              <input
                type="text"
                placeholder="City"
                value={shippingAddress.city}
                onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                className="input-field"
              />
              <input
                type="text"
                placeholder="State"
                value={shippingAddress.state}
                onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                className="input-field"
              />
              <input
                type="text"
                placeholder="ZIP Code"
                value={shippingAddress.zipCode}
                onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                className="input-field"
              />
              <input
                type="text"
                placeholder="Country"
                value={shippingAddress.country}
                onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
            
            <div className="space-y-4">
              <div className="border border-aura-200 rounded-lg p-4">
                <div className="font-medium">Demo Payment</div>
                <div className="text-sm text-aura-600">
                  This is a demo checkout. No real payment will be processed.
                </div>
              </div>

              <div className="bg-aura-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Demo Features:</h3>
                <div className="text-sm text-aura-600 space-y-1">
                  <div>• Simulated payment processing</div>
                  <div>• Order confirmation</div>
                  <div>• Cart clearing</div>
                  <div>• Success page redirect</div>
                </div>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={loading}
              className="btn-primary w-full mt-6"
            >
              {loading ? 'Processing...' : `Complete Order ${formatCurrency(total)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
