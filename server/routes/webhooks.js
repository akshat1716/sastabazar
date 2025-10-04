const express = require('express');
const crypto = require('crypto');
const { config } = require('../config');
const { logger, logPaymentEvent, logError } = require('../config/logger');
const { asyncHandler } = require('../middleware/errorHandler');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const router = express.Router();

// POST /webhooks/razorpay - Razorpay webhook handler
router.post('/razorpay', express.raw({type: 'application/json'}), asyncHandler(async (req, res) => {
  try {
    const sig = req.headers['x-razorpay-signature'];
    const webhookSecret = config.payments.razorpay.webhookSecret || config.payments.razorpay.keySecret;

    if (!sig) {
      logger.warn({
        correlationId: req.correlationId,
        headers: req.headers
      }, 'Razorpay webhook received without signature');
      return res.status(400).json({ error: 'Missing signature' });
    }

    if (!webhookSecret) {
      logger.error({
        correlationId: req.correlationId
      }, 'Razorpay webhook secret not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.body)
      .digest('hex');

    if (sig !== expectedSignature) {
      logger.warn({
        correlationId: req.correlationId,
        receivedSignature: sig,
        expectedSignature: expectedSignature
      }, 'Razorpay webhook signature verification failed');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(req.body);
    
    logger.info({
      eventType: event.event,
      eventId: event.event_id,
      createdAt: event.created_at,
      correlationId: req.correlationId
    }, 'Razorpay webhook received');

    // Handle the event
    switch (event.event) {
      case 'payment.captured':
        await handleRazorpayPaymentCaptured(event.payload.payment.entity, req.correlationId);
        break;
      case 'payment.failed':
        await handleRazorpayPaymentFailed(event.payload.payment.entity, req.correlationId);
        break;
      case 'payment.authorized':
        await handleRazorpayPaymentAuthorized(event.payload.payment.entity, req.correlationId);
        break;
      case 'order.paid':
        await handleRazorpayOrderPaid(event.payload.order.entity, req.correlationId);
        break;
      default:
        logger.info({
          eventType: event.event,
          eventId: event.event_id,
          correlationId: req.correlationId
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
async function handleRazorpayPaymentCaptured(payment, correlationId) {
  try {
    const orderId = payment.notes?.order_id;
    if (!orderId) {
      logger.warn({
        paymentId: payment.id,
        correlationId
      }, 'Razorpay payment captured without order_id in notes');
      return;
    }

    const order = await Order.findById(orderId);
    if (!order) {
      logger.error({ 
        orderId,
        paymentId: payment.id,
        correlationId 
      }, 'Order not found for Razorpay payment captured');
      return;
    }

    // Check if already processed (idempotency)
    if (order.paymentStatus === 'paid') {
      logger.info({ 
        orderId,
        paymentId: payment.id,
        correlationId 
      }, 'Payment already processed for order');
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
      webhook_processed: true,
      correlationId
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
      userId: order.userId,
      correlationId
    });

    logger.info({
      orderId: order._id,
      orderNumber: order.orderNumber,
      razorpayPaymentId: payment.id,
      correlationId
    }, 'Order payment confirmed via webhook');

  } catch (error) {
    logError(error, {
      operation: 'handle_razorpay_payment_captured',
      razorpayPaymentId: payment?.id,
      correlationId
    });
  }
}

// Helper function to handle Razorpay payment failed
async function handleRazorpayPaymentFailed(payment, correlationId) {
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
      webhook_processed: true,
      correlationId
    };

    await order.save();

    logPaymentEvent('payment_failed_webhook', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      razorpayPaymentId: payment.id,
      razorpayOrderId: payment.order_id,
      failureReason: payment.error_description,
      userId: order.userId,
      correlationId
    });

    logger.info({
      orderId: order._id,
      orderNumber: order.orderNumber,
      razorpayPaymentId: payment.id,
      failureReason: payment.error_description,
      correlationId
    }, 'Order payment failed via webhook');

  } catch (error) {
    logError(error, {
      operation: 'handle_razorpay_payment_failed',
      razorpayPaymentId: payment?.id,
      correlationId
    });
  }
}

// Helper function to handle Razorpay payment authorized
async function handleRazorpayPaymentAuthorized(payment, correlationId) {
  try {
    const orderId = payment.notes?.order_id;
    if (!orderId) return;

    const order = await Order.findById(orderId);
    if (!order) return;

    // Update order status to authorized
    order.paymentStatus = 'authorized';
    order.status = 'confirmed';
    order.paymentDetails = {
      razorpay_payment_id: payment.id,
      razorpay_order_id: payment.order_id,
      authorized_at: new Date(),
      webhook_processed: true,
      correlationId
    };

    await order.save();

    logPaymentEvent('payment_authorized_webhook', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      razorpayPaymentId: payment.id,
      razorpayOrderId: payment.order_id,
      userId: order.userId,
      correlationId
    });

    logger.info({
      orderId: order._id,
      orderNumber: order.orderNumber,
      razorpayPaymentId: payment.id,
      correlationId
    }, 'Order payment authorized via webhook');

  } catch (error) {
    logError(error, {
      operation: 'handle_razorpay_payment_authorized',
      razorpayPaymentId: payment?.id,
      correlationId
    });
  }
}

// Helper function to handle Razorpay order paid
async function handleRazorpayOrderPaid(order, correlationId) {
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
      webhook_processed: true,
      correlationId
    };

    await internalOrder.save();

    logPaymentEvent('order_paid_webhook', {
      orderId: internalOrder._id,
      orderNumber: internalOrder.orderNumber,
      razorpayOrderId: order.id,
      userId: internalOrder.userId,
      correlationId
    });

    logger.info({
      orderId: internalOrder._id,
      orderNumber: internalOrder.orderNumber,
      razorpayOrderId: order.id,
      correlationId
    }, 'Order paid confirmed via webhook');

  } catch (error) {
    logError(error, {
      operation: 'handle_razorpay_order_paid',
      razorpayOrderId: order?.id,
      correlationId
    });
  }
}

module.exports = router;



