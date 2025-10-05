const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  selectedVariant: {
    name: String,
    value: String,
    price: Number,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [cartItemSchema],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Virtual for total items count
cartSchema.virtual("totalItems").get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for total price
cartSchema.virtual("totalPrice").get(function () {
  return this.items.reduce((total, item) => {
    const price = item.selectedVariant?.price || 0;
    return total + price * item.quantity;
  }, 0);
});

// Method to add item to cart
cartSchema.methods.addItem = function (
  productId,
  quantity = 1,
  variant = null,
) {
  const existingItem = this.items.find(
    (item) =>
      item.productId.toString() === productId.toString() &&
      (!variant ||
        (item.selectedVariant?.name === variant.name &&
          item.selectedVariant?.value === variant.value)),
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({
      productId,
      quantity,
      selectedVariant: variant,
    });
  }

  this.lastUpdated = new Date();
  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function (itemId) {
  this.items = this.items.filter(
    (item) => item._id.toString() !== itemId.toString(),
  );
  this.lastUpdated = new Date();
  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateQuantity = function (itemId, quantity) {
  const item = this.items.find(
    (item) => item._id.toString() === itemId.toString(),
  );
  if (item) {
    item.quantity = Math.max(1, quantity);
    this.lastUpdated = new Date();
  }
  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = function () {
  this.items = [];
  this.lastUpdated = new Date();
  return this.save();
};

// Index for better query performance
cartSchema.index({ userId: 1 });

module.exports = mongoose.model("Cart", cartSchema);
