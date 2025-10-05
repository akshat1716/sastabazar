const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { auth } = require('../middleware/auth');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { config } = require('../config');
const { logger, logPaymentEvent, logError } = require('../config/logger');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Initialize Razorpay only if keys are provided
let razorpayInstance;
if (config.payments.razorpay.keyId && config.payments.razorpay.keySecret) {
  razorpayInstance = new Razorpay({
    key_id: config.payments.razorpay.keyId,
    key_secret: config.payments.razorpay.keySecret,
  });
  logger.info('✅ Razorpay initialized with provided keys');
} else {
  logger.warn('⚠️ Razorpay keys not found. Payment routes will be disabled or use dummy data');
}

// Helper function to calculate order totals
const calculateOrderTotals = (items) => {
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const price = item.selectedVariant?.price || item.basePrice;
    const itemTotal = price * item.quantity;
    subtotal += itemTotal;

    orderItems.push({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: price,
      selectedVariant: item.selectedVariant,
      image: item.image
    });
  }

  // Calculate shipping (free for orders above ₹1000, otherwise ₹50)
  const shipping = subtotal >= 1000 ? 0 : 50;
  
  // Calculate GST (18%)
  const tax = Math.round(subtotal * 0.18);
  
  const total = subtotal + shipping + tax;

  return {
    subtotal,
    shipping,
    tax,
    total,
    orderItems
  };
};

// POST /payments/razorpay/order - Create Razorpay order
router.post('/razorpay/order', auth, asyncHandler(async (req, res) => {
  if (!razorpayInstance) {
    return res.status(500).json({ 
      success: false,
      error: 'Razorpay not configured. Please provide API keys.' 
    });
  }

  try {
    const { 
      items, 
      shippingAddress, 
      billingAddress, 
      shippingMethod = 'standard',
      notes 
    } = req.body;

    // Validate cart items
    const cart = await Cart.findOne({ userId: req.user._id })
      .populate('items.productId');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Cart is empty.' 
      });
    }

    // Calculate totals
    const { subtotal, shipping, tax, total, orderItems } = calculateOrderTotals(cart.items);

    // Create internal order first
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const order = new Order({
      orderNumber,
      userId: req.user._id,
      items: orderItems,
      subtotal,
      tax,
      shipping,
      total,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'razorpay',
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      shippingMethod,
      notes
    });

    await order.save();

    // Create Razorpay order
    const razorpayOptions = {
      amount: total * 100, // Convert to paise
      currency: 'INR',
      receipt: orderNumber,
      payment_capture: 1, // Auto capture
      notes: {
        order_id: order._id.toString(),
        user_id: req.user._id.toString()
      }
    };

    const razorpayOrder = await razorpayInstance.orders.create(razorpayOptions);

    // Update order with Razorpay order ID
    order.paymentIntentId = razorpayOrder.id;
    await order.save();

    // Log payment event
    logPaymentEvent('order_created', {
      orderId: order._id,
      orderNumber: orderNumber,
      amount: total,
      currency: 'INR',
      razorpayOrderId: razorpayOrder.id,
      userId: req.user._id
    });

    res.json({
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt
      },
      internalOrderId: order._id,
      orderNumber: orderNumber
    });

  } catch (error) {
    logError(error, {
      correlationId: req.correlationId,
      userId: req.user._id,
      operation: 'create_razorpay_order'
    });
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}));

// POST /payments/razorpay/verify - Verify Razorpay payment
router.post('/razorpay/verify', auth, asyncHandler(async (req, res) => {
  if (!razorpayInstance) {
    return res.status(500).json({ 
      success: false,
      error: 'Razorpay not configured.' 
    });
  }

  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      internal_order_id 
    } = req.body;

    // Verify signature
    const shasum = crypto.createHmac('sha256', config.payments.razorpay.keySecret);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpay_signature) {
      logPaymentEvent('signature_verification_failed', {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        userId: req.user._id,
        correlationId: req.correlationId
      });
      
      return res.status(400).json({ 
        success: false,
        error: 'Invalid signature' 
      });
    }

    // Find the order
    const order = await Order.findById(internal_order_id);
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: 'Order not found' 
      });
    }

    // Check if already paid (idempotency)
    if (order.paymentStatus === 'paid') {
      logPaymentEvent('duplicate_payment_attempt', {
        orderId: order._id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        userId: req.user._id
      });
      
      return res.json({
        success: true,
        message: 'Payment already verified',
        order: order
      });
    }

    // Update order status
    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.paidAt = new Date();
    order.paymentDetails = {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      verified_at: new Date()
    };

    await order.save();

    // Clear user's cart
    await Cart.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { items: [] } }
    );

    // Update product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Log successful payment
    logPaymentEvent('payment_verified', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      amount: order.total,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      userId: req.user._id
    });

    res.json({
      success: true,
      message: 'Payment verified successfully',
      order: order
    });

  } catch (error) {
    logError(error, {
      correlationId: req.correlationId,
      userId: req.user._id,
      operation: 'verify_razorpay_payment'
    });
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}));

// POST /payments/stripe/create-checkout-session - Create Stripe checkout session
router.post('/stripe/create-checkout-session', auth, async (req, res) => {
  try {
    const stripe = require('stripe')(config.stripe.secretKey);
    
    const { 
      items, 
      shippingAddress, 
      billingAddress, 
      shippingMethod = 'standard',
      notes 
    } = req.body;

    // Validate cart items
    const cart = await Cart.findOne({ userId: req.user._id })
      .populate('items.productId');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Cart is empty.' 
      });
    }

    // Calculate totals
    const { subtotal, shipping, tax, total, orderItems } = calculateOrderTotals(cart.items);

    // Create internal order first
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const order = new Order({
      orderNumber,
      userId: req.user._id,
      items: orderItems,
      subtotal,
      tax,
      shipping,
      total,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'stripe',
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      shippingMethod,
      notes
    });

    await order.save();

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: orderItems.map(item => ({
        price_data: {
          currency: 'inr',
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : [],
          },
          unit_amount: item.price * 100, // Convert to paise
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${config.clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order._id}`,
      cancel_url: `${config.clientUrl}/payment/cancel?order_id=${order._id}`,
      metadata: {
        order_id: order._id.toString(),
        user_id: req.user._id.toString(),
        order_number: orderNumber
      },
      shipping_address_collection: {
        allowed_countries: ['IN'],
      },
    });

    // Update order with Stripe session ID
    order.paymentIntentId = session.id;
    await order.save();

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      internalOrderId: order._id,
      orderNumber: orderNumber
    });

  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// POST /payments/webhooks/razorpay - Razorpay webhook handler
router.post('/webhooks/razorpay', express.raw({type: 'application/json'}), asyncHandler(async (req, res) => {
  try {
    const sig = req.headers['x-razorpay-signature'];
    const webhookSecret = config.payments.razorpay.webhookSecret || config.payments.razorpay.keySecret;

    if (!sig) {
      logger.warn('Razorpay webhook received without signature');
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body)
      .digest('hex');

    if (sig !== expectedSignature) {
      logger.warn('Razorpay webhook signature verification failed');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(req.body);
    
    logger.info({
      eventType: event.event,
      eventId: event.event_id,
      createdAt: event.created_at
    }, 'Razorpay webhook received');

    // Handle the event
    switch (event.event) {
      case 'payment.captured':
        await handleRazorpayPaymentCaptured(event.payload.payment.entity);
        break;
      case 'payment.failed':
        await handleRazorpayPaymentFailed(event.payload.payment.entity);
        break;
      case 'order.paid':
        await handleRazorpayOrderPaid(event.payload.order.entity);
        break;
      default:
        logger.info({
          eventType: event.event,
          eventId: event.event_id
        }, 'Unhandled Razorpay webhook event');
    }

    res.json({ received: true });

  } catch (error) {
    logError(error, {
      operation: 'razorpay_webhook',
      correlationId: req.correlationId
    });
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}));

// Helper function to handle Razorpay payment captured
async function handleRazorpayPaymentCaptured(payment) {
  try {
    const orderId = payment.notes?.order_id;
    if (!orderId) {
      logger.warn('Razorpay payment captured without order_id in notes');
      return;
    }

    const order = await Order.findById(orderId);
    if (!order) {
      logger.error({ orderId }, 'Order not found for Razorpay payment captured');
      return;
    }

    // Check if already processed (idempotency)
    if (order.paymentStatus === 'paid') {
      logger.info({ orderId }, 'Payment already processed for order');
      return;
    }

    // Update order status
    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.paidAt = new Date();
    order.paymentDetails = {
      razorpay_payment_id: payment.id,
      razorpay_order_id: payment.order_id,
      captured_at: new Date(),
      webhook_processed: true
    };

    await order.save();

    // Clear user's cart
    await Cart.findOneAndUpdate(
      { userId: order.userId },
      { $set: { items: [] } }
    );

    // Update product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }

    logPaymentEvent('payment_captured_webhook', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      amount: order.total,
      razorpayPaymentId: payment.id,
      razorpayOrderId: payment.order_id,
      userId: order.userId
    });

    logger.info({
      orderId: order._id,
      orderNumber: order.orderNumber,
      razorpayPaymentId: payment.id
    }, 'Order payment confirmed via webhook');

  } catch (error) {
    logError(error, {
      operation: 'handle_razorpay_payment_captured',
      razorpayPaymentId: payment?.id
    });
  }
}

// Helper function to handle Razorpay payment failed
async function handleRazorpayPaymentFailed(payment) {
  try {
    const orderId = payment.notes?.order_id;
    if (!orderId) return;

    const order = await Order.findById(orderId);
    if (!order) return;

    // Update order status
    order.paymentStatus = 'failed';
    order.status = 'cancelled';
    order.paymentDetails = {
      razorpay_payment_id: payment.id,
      razorpay_order_id: payment.order_id,
      failure_reason: payment.error_description,
      failed_at: new Date(),
      webhook_processed: true
    };

    await order.save();

    logPaymentEvent('payment_failed_webhook', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      razorpayPaymentId: payment.id,
      razorpayOrderId: payment.order_id,
      failureReason: payment.error_description,
      userId: order.userId
    });

    logger.info({
      orderId: order._id,
      orderNumber: order.orderNumber,
      razorpayPaymentId: payment.id,
      failureReason: payment.error_description
    }, 'Order payment failed via webhook');

  } catch (error) {
    logError(error, {
      operation: 'handle_razorpay_payment_failed',
      razorpayPaymentId: payment?.id
    });
  }
}

// Helper function to handle Razorpay order paid
async function handleRazorpayOrderPaid(order) {
  try {
    const orderId = order.notes?.order_id;
    if (!orderId) return;

    const internalOrder = await Order.findById(orderId);
    if (!internalOrder) return;

    // Update order status
    internalOrder.paymentStatus = 'paid';
    internalOrder.status = 'confirmed';
    internalOrder.paidAt = new Date();
    internalOrder.paymentDetails = {
      razorpay_order_id: order.id,
      paid_at: new Date(),
      webhook_processed: true
    };

    await internalOrder.save();

    logPaymentEvent('order_paid_webhook', {
      orderId: internalOrder._id,
      orderNumber: internalOrder.orderNumber,
      razorpayOrderId: order.id,
      userId: internalOrder.userId
    });

    logger.info({
      orderId: internalOrder._id,
      orderNumber: internalOrder.orderNumber,
      razorpayOrderId: order.id
    }, 'Order paid confirmed via webhook');

  } catch (error) {
    logError(error, {
      operation: 'handle_razorpay_order_paid',
      razorpayOrderId: order?.id
    });
  }
}

// POST /webhooks/stripe - Stripe webhook handler
router.post('/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  try {
    const stripe = require('stripe')(config.stripe.secretKey);
    const sig = req.headers['stripe-signature'];
    const endpointSecret = config.stripe.webhookSecret;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleSuccessfulPayment(session);
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        await handleFailedPayment(paymentIntent);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});

  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Helper function to handle successful payment
async function handleSuccessfulPayment(session) {
  try {
    const orderId = session.metadata.order_id;
    const order = await Order.findById(orderId);

    if (!order) {
      console.error('Order not found for successful payment:', orderId);
      return;
    }

    // Check if already processed (idempotency)
    if (order.paymentStatus === 'paid') {
      console.log('Payment already processed for order:', orderId);
      return;
    }

    // Update order status
    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.paidAt = new Date();
    order.paymentDetails = {
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent,
      verified_at: new Date()
    };

    await order.save();

    // Clear user's cart
    await Cart.findOneAndUpdate(
      { userId: order.userId },
      { $set: { items: [] } }
    );

    // Update product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }

    console.log('Order payment confirmed:', orderId);

  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

// Helper function to handle failed payment
async function handleFailedPayment(paymentIntent) {
  try {
    const orderId = paymentIntent.metadata?.order_id;
    if (!orderId) return;

    const order = await Order.findById(orderId);
    if (!order) return;

    // Update order status
    order.paymentStatus = 'failed';
    order.status = 'cancelled';
    order.paymentDetails = {
      stripe_payment_intent: paymentIntent.id,
      failure_reason: paymentIntent.last_payment_error?.message,
      failed_at: new Date()
    };

    await order.save();
    console.log('Order payment failed:', orderId);

  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
}

// POST /payments/razorpay/refund - Process Razorpay refund
router.post('/razorpay/refund', auth, asyncHandler(async (req, res) => {
  if (!razorpayInstance) {
    return res.status(500).json({ 
      success: false,
      error: 'Razorpay not configured.' 
    });
  }

  try {
    const { 
      paymentId, 
      amount, 
      reason = 'Refund request',
      orderId 
    } = req.body;

    // Validate required fields
    if (!paymentId) {
      return res.status(400).json({ 
        success: false,
        error: 'Payment ID is required' 
      });
    }

    // Create refund
    const refundOptions = {
      payment_id: paymentId,
      amount: amount || undefined, // If not specified, full refund
      notes: {
        reason: reason,
        refunded_by: req.user._id.toString(),
        refunded_at: new Date().toISOString()
      }
    };

    const refund = await razorpayInstance.payments.refund(paymentId, refundOptions);

    // Update order status if orderId is provided
    if (orderId) {
      const order = await Order.findById(orderId);
      if (order) {
        order.paymentStatus = 'refunded';
        order.status = 'cancelled';
        order.refundDetails = {
          refundId: refund.id,
          refundAmount: refund.amount,
          refundStatus: refund.status,
          refundedAt: new Date(),
          reason: reason
        };
        await order.save();
      }
    }

    // Log refund event
    logPaymentEvent('refund_processed', {
      paymentId: paymentId,
      refundId: refund.id,
      refundAmount: refund.amount,
      refundStatus: refund.status,
      reason: reason,
      userId: req.user._id,
      orderId: orderId
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refund: {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
        notes: refund.notes
      }
    });

  } catch (error) {
    logError(error, {
      correlationId: req.correlationId,
      userId: req.user._id,
      operation: 'process_razorpay_refund',
      paymentId: req.body.paymentId
    });
    
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}));

// GET /payments/razorpay/config - Get Razorpay configuration for client
router.get('/razorpay/config', (req, res) => {
  res.json({
    keyId: config.payments.razorpay.keyId,
    currency: 'INR'
  });
});

// GET /payments/stripe/config - Get Stripe configuration for client
router.get('/stripe/config', (req, res) => {
  res.json({
    publishableKey: config.stripe.publishableKey,
    currency: 'INR'
  });
});

module.exports = router;