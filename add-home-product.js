const mongoose = require("mongoose");
const Product = require("./server/models/Product");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/sastabazar");

// Sample home-goods product
const homeProduct = {
  name: "Premium Ceramic Dinnerware Set",
  description:
    "Beautiful ceramic dinnerware set perfect for modern dining. Includes plates, bowls, and mugs made from high-quality ceramic with elegant design.",
  shortDescription: "Premium ceramic dinnerware set for modern dining",
  category: "home-goods",
  brand: "sastabazar",
  images: [
    {
      url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=500&fit=crop",
      alt: "Premium Ceramic Dinnerware Set",
      isPrimary: true,
    },
  ],
  variants: [
    {
      name: "Set Size",
      value: "4-Piece Set",
      price: 2499,
      stock: 25,
      sku: "CERAMIC-SET-4PC-001",
    },
    {
      name: "Set Size",
      value: "8-Piece Set",
      price: 4499,
      stock: 15,
      sku: "CERAMIC-SET-8PC-001",
    },
  ],
  basePrice: 2499,
  salePrice: 1999,
  isOnSale: true,
  isNewArrival: true,
  isFeatured: true,
  tags: ["ceramic", "dinnerware", "home", "kitchen", "premium"],
  dimensions: { unit: "cm" },
  materials: ["ceramic"],
  colors: ["white", "cream"],
  rating: { average: 0, count: 0 },
  stock: 40,
  isActive: true,
  seo: { keywords: ["ceramic", "dinnerware", "home", "kitchen"] },
  reviews: [],
};

async function addProduct() {
  try {
    const product = new Product(homeProduct);
    await product.save();
    console.log(`✅ Product "${homeProduct.name}" added successfully!`);
    console.log(`🆔 Product ID: ${product._id}`);
    console.log(`🏠 Category: ${homeProduct.category}`);
    console.log(
      `💰 Price: ₹${homeProduct.basePrice} (Sale: ₹${homeProduct.salePrice})`,
    );
    console.log(`📦 Stock: ${homeProduct.stock} units`);

    // Show current product count
    const totalProducts = await Product.countDocuments();
    console.log(`\n📊 Total products in store: ${totalProducts}`);
  } catch (error) {
    console.error("❌ Error adding product:", error.message);
  } finally {
    mongoose.connection.close();
  }
}

addProduct();
