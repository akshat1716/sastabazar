const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  value: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
  },
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    shortDescription: {
      type: String,
      required: true,
      maxlength: 200,
    },
    category: {
      type: String,
      required: true,
      enum: ["apparel", "home-goods", "tech-accessories", "art-prints"],
    },
    subcategory: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        alt: {
          type: String,
          default: "",
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    variants: [variantSchema],
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    salePrice: {
      type: Number,
      min: 0,
    },
    isOnSale: {
      type: Boolean,
      default: false,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    specifications: {
      type: Map,
      of: String,
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      weight: Number,
      unit: {
        type: String,
        enum: ["cm", "inch", "kg", "lb"],
        default: "cm",
      },
    },
    materials: [
      {
        type: String,
        trim: true,
      },
    ],
    colors: [
      {
        type: String,
        trim: true,
      },
    ],
    style: {
      type: String,
      enum: ["modern", "industrial", "artisan", "minimalist", "luxury"],
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    reviews: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          maxlength: 500,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    seo: {
      title: String,
      description: String,
      keywords: [String],
    },
  },
  {
    timestamps: true,
  },
);

// Virtual for discount percentage
productSchema.virtual("discountPercentage").get(function () {
  if (this.isOnSale && this.salePrice && this.basePrice) {
    return Math.round(
      ((this.basePrice - this.salePrice) / this.basePrice) * 100,
    );
  }
  return 0;
});

// Virtual for current price
productSchema.virtual("currentPrice").get(function () {
  return this.isOnSale && this.salePrice ? this.salePrice : this.basePrice;
});

// Method to check if product is in stock
productSchema.methods.isInStock = function () {
  return this.stock > 0;
};

// Method to get primary image
productSchema.methods.getPrimaryImage = function () {
  const primaryImage = this.images.find((img) => img.isPrimary);
  return primaryImage || this.images[0];
};

// Indexes for better query performance
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ style: 1 });
productSchema.index({ isNewArrival: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isOnSale: 1 });
productSchema.index({ "rating.average": -1 });
productSchema.index({ createdAt: -1 });

// Text index for search
productSchema.index({
  name: "text",
  description: "text",
  brand: "text",
  tags: "text",
});

module.exports = mongoose.model("Product", productSchema);
