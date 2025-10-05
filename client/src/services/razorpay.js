// Razorpay payment service
import { loadScript } from "./utils";

class RazorpayService {
  constructor() {
    this.razorpayLoaded = false;
  }

  async loadRazorpay() {
    if (this.razorpayLoaded) return true;

    try {
      await loadScript("https://checkout.razorpay.com/v1/checkout.js");
      this.razorpayLoaded = true;
      return true;
    } catch (error) {
      console.error("Failed to load Razorpay:", error);
      return false;
    }
  }

  async createOrder(orderData) {
    try {
      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error("Failed to create order");
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  async initiatePayment(orderData) {
    try {
      // Load Razorpay script
      const loaded = await this.loadRazorpay();
      if (!loaded) {
        throw new Error("Failed to load Razorpay");
      }

      // Create order
      const order = await this.createOrder(orderData);

      // Payment options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "sastabazar",
        description: order.description,
        order_id: order.id,
        prefill: {
          name: orderData.customer_name,
          email: orderData.customer_email,
          contact: orderData.customer_phone,
        },
        theme: {
          color: "#1f2937",
        },
        handler: function (response) {
          // Payment successful
          console.log("Payment successful:", response);
          return response;
        },
        modal: {
          ondismiss: function () {
            console.log("Payment modal dismissed");
          },
        },
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();

      return new Promise((resolve, reject) => {
        razorpay.on("payment.success", (response) => {
          resolve(response);
        });
        razorpay.on("payment.error", (error) => {
          reject(error);
        });
      });
    } catch (error) {
      console.error("Payment initiation failed:", error);
      throw error;
    }
  }
}

export default new RazorpayService();
