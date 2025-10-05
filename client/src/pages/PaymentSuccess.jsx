import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";
import api from "../utils/api";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const orderId = searchParams.get("order_id");
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (orderId) {
          // Check if it's a demo order
          if (orderId.startsWith("DEMO_")) {
            // Create a demo order object
            const demoOrder = {
              orderNumber: orderId,
              createdAt: new Date().toISOString(),
              paymentMethod: "Demo Payment",
              status: "confirmed",
              items: [
                {
                  name: "Demo Product",
                  quantity: 1,
                  price: 999,
                  image: "https://via.placeholder.com/100x100?text=Demo",
                },
              ],
              subtotal: 999,
              shipping: 100,
              tax: 180,
              total: 1279,
              shippingAddress: {
                firstName: "Demo",
                lastName: "User",
                address: "123 Demo Street",
                city: "Demo City",
                state: "Demo State",
                zipCode: "12345",
                country: "India",
                phone: "9876543210",
              },
            };
            setOrder(demoOrder);
            return;
          }

          // Try to fetch real order
          const response = await api.get(`/orders/${orderId}`);
          setOrder(response);
        } else if (sessionId) {
          // For Stripe payments, we might need to fetch by session ID
          const response = await api.get(`/orders/by-session/${sessionId}`);
          setOrder(response);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        setError("Failed to fetch order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Order Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error ||
              "We couldn't find your order details. Please contact support if you need assistance."}
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600">
            Thank you for your order. We've received your payment and will
            process your order shortly.
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Order Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Order Number</p>
              <p className="font-medium">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order Date</p>
              <p className="font-medium">
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="font-medium capitalize">{order.paymentMethod}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium capitalize text-green-600">
                {order.status}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-3">Items Ordered</h3>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.selectedVariant &&
                        `${item.selectedVariant.name}: ${item.selectedVariant.value}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ₹{item.price.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t pt-4 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>₹{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>₹{order.shipping.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (GST)</span>
                <span>₹{order.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total</span>
                <span>₹{order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {order.shippingAddress && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Shipping Address
            </h2>
            <div className="text-gray-600">
              <p className="font-medium">
                {order.shippingAddress.firstName}{" "}
                {order.shippingAddress.lastName}
              </p>
              <p>{order.shippingAddress.address}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.zipCode}
              </p>
              <p>{order.shippingAddress.country}</p>
              <p className="mt-2">Phone: {order.shippingAddress.phone}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/orders"
            className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            View All Orders
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            to="/"
            className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>

        {/* Support Info */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Need help? Contact us at{" "}
            <a
              href="mailto:support@sastabazar.com"
              className="text-black hover:underline"
            >
              support@sastabazar.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
