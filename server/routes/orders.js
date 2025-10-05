const express = require("express");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Create new order
router.post("/", auth, async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      shippingMethod,
      notes,
    } = req.body;

    // Validate cart items
    const cart = await Cart.findOne({ userId: req.user._id }).populate(
      "items.productId",
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty." });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const cartItem of cart.items) {
      const product = cartItem.productId;
      if (!product || !product.isActive) {
        return res.status(400).json({
          error: `Product ${product?.name || "Unknown"} is no longer available.`,
        });
      }

      if (product.stock < cartItem.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}. Only ${product.stock} available.`,
        });
      }

      const price = cartItem.selectedVariant?.price || product.currentPrice;
      const itemTotal = price * cartItem.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product._id,
        name: product.name,
        quantity: cartItem.quantity,
        price: price,
        selectedVariant: cartItem.selectedVariant,
        image: product.getPrimaryImage()?.url || product.images[0]?.url,
      });
    }

    // Calculate shipping and tax
    const shipping = calculateShipping(shippingMethod, subtotal);
    const tax = calculateTax(subtotal, shippingAddress.state);
    const total = subtotal + shipping + tax;

    // Create order
    const order = new Order({
      userId: req.user._id,
      items: orderItems,
      subtotal,
      shipping,
      tax,
      total,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      shippingMethod,
      notes,
    });

    await order.save();

    // Update product stock
    for (const cartItem of cart.items) {
      const product = cartItem.productId;
      product.stock -= cartItem.quantity;
      await product.save();
    }

    // Clear cart
    await cart.clearCart();

    // Add to user's purchase history
    const user = await User.findById(req.user._id);
    user.purchaseHistory.push({ orderId: order._id });
    await user.save();

    res.status(201).json({
      message: "Order created successfully.",
      order,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
});

// Get user's orders
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = { userId: req.user._id };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalOrders: total,
      },
    });
  } catch (error) {
    console.error("Orders fetch error:", error);
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

// Get single order
router.get("/:orderId", auth, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      userId: req.user._id,
    }).populate("items.productId");

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    res.json({ order });
  } catch (error) {
    console.error("Order fetch error:", error);
    res.status(500).json({ error: "Failed to fetch order." });
  }
});

// Cancel order
router.put("/:orderId/cancel", auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      userId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({ error: "Order is already cancelled." });
    }

    if (order.status === "shipped" || order.status === "delivered") {
      return res
        .status(400)
        .json({ error: "Cannot cancel shipped or delivered orders." });
    }

    // Update order status
    order.status = "cancelled";
    order.cancelledAt = new Date();
    order.cancelledBy = req.user._id;
    order.cancellationReason = reason;

    await order.save();

    // Restore product stock
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    res.json({
      message: "Order cancelled successfully.",
      order,
    });
  } catch (error) {
    console.error("Order cancellation error:", error);
    res.status(500).json({ error: "Failed to cancel order." });
  }
});

// Get order tracking
router.get("/:orderId/tracking", auth, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      userId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    const tracking = {
      orderNumber: order.orderNumber,
      status: order.status,
      statusDisplay: order.statusDisplay,
      trackingNumber: order.trackingNumber,
      estimatedDelivery: order.estimatedDelivery,
      shippingAddress: order.shippingAddress,
      items: order.items.length,
      total: order.total,
    };

    res.json({ tracking });
  } catch (error) {
    console.error("Order tracking error:", error);
    res.status(500).json({ error: "Failed to fetch order tracking." });
  }
});

// Helper functions

function calculateShipping(method, subtotal) {
  const shippingRates = {
    standard: subtotal > 100 ? 0 : 10,
    express: subtotal > 150 ? 15 : 25,
    overnight: 35,
  };
  return shippingRates[method] || 10;
}

function calculateTax(subtotal, state) {
  // Simplified tax calculation
  const taxRates = {
    CA: 0.085,
    NY: 0.08,
    TX: 0.0625,
    FL: 0.06,
  };

  const rate = taxRates[state] || 0.07;
  return Math.round(subtotal * rate * 100) / 100;
}

module.exports = router;
