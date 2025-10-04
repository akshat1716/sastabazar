import api from '../utils/api';

// Razorpay Payment Service
export const razorpayService = {
  // Get Razorpay configuration
  async getConfig() {
    try {
      const response = await api.get('/payments/razorpay/config');
      return response;
    } catch (error) {
      console.error('Error fetching Razorpay config:', error);
      throw error;
    }
  },

  // Create Razorpay order
  async createOrder(orderData) {
    try {
      const response = await api.post('/payments/razorpay/order', orderData);
      return response;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw error;
    }
  },

  // Verify Razorpay payment
  async verifyPayment(paymentData) {
    try {
      const response = await api.post('/payments/razorpay/verify', paymentData);
      return response;
    } catch (error) {
      console.error('Error verifying Razorpay payment:', error);
      throw error;
    }
  },

  // Initialize Razorpay payment
  async initializePayment(orderData) {
    try {
      // Create order on server
      const orderResponse = await this.createOrder(orderData);
      
      if (!orderResponse.success) {
        throw new Error(orderResponse.error || 'Failed to create order');
      }

      // Get Razorpay config
      const config = await this.getConfig();
      
      // Initialize Razorpay
      const options = {
        key: config.keyId,
        amount: orderResponse.order.amount,
        currency: orderResponse.order.currency,
        name: 'sastabazar',
        description: `Order ${orderResponse.orderNumber}`,
        order_id: orderResponse.order.id,
        handler: async (response) => {
          try {
            // Verify payment
            const verifyResponse = await this.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              internal_order_id: orderResponse.internalOrderId
            });

            if (verifyResponse.success) {
              // Redirect to success page
              window.location.href = `/payment/success?order_id=${orderResponse.internalOrderId}`;
            } else {
              throw new Error(verifyResponse.error || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            window.location.href = `/payment/cancel?order_id=${orderResponse.internalOrderId}&error=${encodeURIComponent(error.message)}`;
          }
        },
        prefill: {
          name: orderData.shippingAddress?.firstName + ' ' + orderData.shippingAddress?.lastName,
          email: orderData.shippingAddress?.email,
          contact: orderData.shippingAddress?.phone
        },
        theme: {
          color: '#000000'
        },
        modal: {
          ondismiss: () => {
            window.location.href = `/payment/cancel?order_id=${orderResponse.internalOrderId}`;
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

      return {
        success: true,
        orderId: orderResponse.internalOrderId,
        orderNumber: orderResponse.orderNumber
      };

    } catch (error) {
      console.error('Error initializing Razorpay payment:', error);
      throw error;
    }
  }
};

// Stripe Payment Service
export const stripeService = {
  // Get Stripe configuration
  async getConfig() {
    try {
      const response = await api.get('/payments/stripe/config');
      return response;
    } catch (error) {
      console.error('Error fetching Stripe config:', error);
      throw error;
    }
  },

  // Create Stripe checkout session
  async createCheckoutSession(orderData) {
    try {
      const response = await api.post('/payments/stripe/create-checkout-session', orderData);
      return response;
    } catch (error) {
      console.error('Error creating Stripe checkout session:', error);
      throw error;
    }
  },

  // Initialize Stripe payment
  async initializePayment(orderData) {
    try {
      // Create checkout session
      const sessionResponse = await this.createCheckoutSession(orderData);
      
      if (!sessionResponse.success) {
        throw new Error(sessionResponse.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      window.location.href = sessionResponse.url;

      return {
        success: true,
        orderId: sessionResponse.internalOrderId,
        orderNumber: sessionResponse.orderNumber
      };

    } catch (error) {
      console.error('Error initializing Stripe payment:', error);
      throw error;
    }
  }
};

// Payment Service Factory
export const paymentService = {
  // Initialize payment based on method
  async initializePayment(paymentMethod, orderData) {
    try {
      switch (paymentMethod.toLowerCase()) {
        case 'razorpay':
          return await razorpayService.initializePayment(orderData);
        case 'stripe':
          return await stripeService.initializePayment(orderData);
        default:
          throw new Error(`Unsupported payment method: ${paymentMethod}`);
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      throw error;
    }
  },

  // Get available payment methods
  getAvailableMethods() {
    return [
      {
        id: 'razorpay',
        name: 'Razorpay',
        description: 'Pay with UPI, Cards, Net Banking',
        icon: '💳',
        supportedMethods: ['UPI', 'Cards', 'Net Banking', 'Wallets']
      },
      {
        id: 'stripe',
        name: 'Stripe',
        description: 'Pay with Credit/Debit Cards',
        icon: '💳',
        supportedMethods: ['Cards', 'Apple Pay', 'Google Pay']
      }
    ];
  }
};

export default paymentService;