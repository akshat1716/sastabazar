import { useLocalCart } from "../context/LocalCartContext";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { formatCurrency } from "../services/utils";

const Cart = () => {
  const { cart, updateCartItem, removeFromCart, clearCart } = useLocalCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    // Check both AuthContext user and localStorage for authentication
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!user && !token && !storedUser) {
      toast.error("Please login to proceed with checkout");
      navigate("/login");
      return;
    }
    navigate("/checkout");
  };

  if (!cart || cart.items?.length === 0) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
        <Link to="/products" className="btn-primary">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Cart</h1>
      <div className="space-y-4">
        {cart.items.map((item) => (
          <div
            key={item._id}
            className="flex items-center justify-between border border-aura-200 p-3"
          >
            <div className="flex items-center space-x-3">
              <img
                src={
                  item.productId?.images?.[0]?.url || "/placeholder-product.jpg"
                }
                className="w-16 h-16 object-cover border border-aura-200"
              />
              <div>
                <div className="font-medium">{item.productId?.name}</div>
                {item.selectedVariant && (
                  <div className="text-sm text-aura-600">
                    {item.selectedVariant.name}: {item.selectedVariant.value}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() =>
                  updateCartItem(item._id, Math.max(1, item.quantity - 1))
                }
                className="btn-ghost px-3 py-1"
              >
                -
              </button>
              <span>{item.quantity}</span>
              <button
                onClick={() => updateCartItem(item._id, item.quantity + 1)}
                className="btn-ghost px-3 py-1"
              >
                +
              </button>
              <div className="w-24 text-right font-semibold">
                {formatCurrency(
                  (item.selectedVariant?.price ||
                    item.productId?.basePrice ||
                    0) * item.quantity,
                )}
              </div>
              <button
                onClick={() => removeFromCart(item._id)}
                className="btn-secondary"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-6">
        <button onClick={clearCart} className="btn-secondary">
          Clear Cart
        </button>
        <div className="text-xl font-bold">
          Total: {formatCurrency(cart.totalPrice)}
        </div>
        <button onClick={handleCheckout} className="btn-primary">
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart;
