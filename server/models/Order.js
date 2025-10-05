const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  selectedVariant: {
    name: String,
    value: String,
  },
  image: {
    type: String,
    required: true,
  },
});

const shippingAddressSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  state: {
    type: String,
    required: true,
    trim: true,
  },
  zipCode: {
    type: String,
    required: true,
    trim: true,
  },
  country: {
    type: String,
    required: true,
    trim: true,
    default: "United States",
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    shipping: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["credit_card", "paypal", "apple_pay", "google_pay", "stripe"],
    },
    paymentIntentId: {
      type: String,
      default: null,
    },
    refundId: {
      type: String,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
    shippingAddress: shippingAddressSchema,
    billingAddress: shippingAddressSchema,
    shippingMethod: {
      type: String,
      required: true,
      enum: ["standard", "express", "overnight"],
    },
    trackingNumber: {
      type: String,
      default: null,
    },
    estimatedDelivery: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    cancellationReason: {
      type: String,
      maxlength: 200,
    },
  },
  {
    timestamps: true,
  },
);

// Generate order number before saving
orderSchema.pre("save", function (next) {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    this.orderNumber = `AURA-${timestamp}-${random}`;
  }
  next();
});

// Virtual for order status display
orderSchema.virtual("statusDisplay").get(function () {
  const statusMap = {
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    refunded: "Refunded",
  };
  return statusMap[this.status] || this.status;
});

// Method to update order status
orderSchema.methods.updateStatus = function (newStatus, userId = null) {
  this.status = newStatus;
  if (newStatus === "cancelled") {
    this.cancelledAt = new Date();
    this.cancelledBy = userId;
  }
  return this.save();
};

// Method to add tracking information
orderSchema.methods.addTracking = function (trackingNumber, estimatedDelivery) {
  this.trackingNumber = trackingNumber;
  this.estimatedDelivery = estimatedDelivery;
  this.status = "shipped";
  return this.save();
};

// Indexes for better query performance
orderSchema.index({ userId: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "shippingAddress.email": 1 });

module.exports = mongoose.model("Order", orderSchema);
