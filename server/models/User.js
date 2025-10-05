const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
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
    avatar: {
      type: String,
      default: null,
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    preferences: {
      categories: [
        {
          type: String,
          enum: ["apparel", "home-goods", "tech-accessories", "art-prints"],
        },
      ],
      style: {
        type: String,
        enum: ["modern", "industrial", "artisan", "minimalist", "luxury"],
      },
    },
    browsingHistory: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    purchaseHistory: [
      {
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
        },
        purchasedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get user profile (without password)
userSchema.methods.getProfile = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ "preferences.categories": 1 });
userSchema.index({ stripeCustomerId: 1 });
userSchema.index({ "browsingHistory.productId": 1 });

module.exports = mongoose.model("User", userSchema);
