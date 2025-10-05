const mongoose = require("mongoose");
const Product = require("./server/models/Product");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/sastabazar");

// Valid categories: apparel, home-goods, tech-accessories, art-prints
const productTemplate = {
  name: "Your Product Name",
  description:
    "Detailed description of your product. Include features, benefits, and any important details customers should know.",
  shortDescription: "Short description for product cards",
  category: "apparel", // Options: apparel, home-goods, tech-accessories, art-prints
  brand: "sastabazar",
  images: [
    {
      url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
      alt: "Product Image",
      isPrimary: true,
    },
  ],
  variants: [
    {
      name: "Size",
      value: "M",
      price: 1999,
      stock: 50,
      sku: "PRODUCT-M-001",
    },
  ],
  basePrice: 1999,
  salePrice: 1499,
  isOnSale: true,
  isNewArrival: false,
  isFeatured: true,
  tags: ["premium", "quality", "design"],
  dimensions: { unit: "cm" },
  materials: [],
  colors: [],
  rating: { average: 0, count: 0 },
  stock: 50,
  isActive: true,
  seo: { keywords: [] },
  reviews: [],
};

// Function to add a product
async function addProduct(productData) {
  try {
    const product = new Product(productData);
    await product.save();
    console.log(`✅ Product "${productData.name}" added successfully!`);
    console.log(`🆔 Product ID: ${product._id}`);
    return product;
  } catch (error) {
    console.error("❌ Error adding product:", error.message);
    throw error;
  }
}

// Function to list all products
async function listProducts() {
  try {
    const products = await Product.find(
      {},
      "name basePrice salePrice category isActive",
    ).lean();
    console.log("\n📦 Current Products:");
    console.log("==================");
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(
        `   Price: ₹${product.basePrice} ${product.isOnSale ? `(Sale: ₹${product.salePrice})` : ""}`,
      );
      console.log(`   Category: ${product.category}`);
      console.log(`   Status: ${product.isActive ? "Active" : "Inactive"}`);
      console.log("");
    });
  } catch (error) {
    console.error("❌ Error listing products:", error.message);
  }
}

// Example: Add a new product
async function addExampleProduct() {
  const newProduct = {
    ...productTemplate,
    name: "Premium Wireless Earbuds",
    description:
      "High-quality wireless earbuds with noise cancellation, 30-hour battery life, and premium sound quality. Perfect for music lovers and professionals.",
    shortDescription: "Premium wireless earbuds with noise cancellation",
    category: "tech-accessories", // Using valid category
    images: [
      {
        url: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=500&h=500&fit=crop",
        alt: "Premium Wireless Earbuds",
        isPrimary: true,
      },
    ],
    variants: [
      {
        name: "Color",
        value: "Black",
        price: 2999,
        stock: 30,
        sku: "EARBUDS-BLACK-001",
      },
      {
        name: "Color",
        value: "White",
        price: 2999,
        stock: 25,
        sku: "EARBUDS-WHITE-001",
      },
    ],
    basePrice: 2999,
    salePrice: 2499,
    tags: ["wireless", "noise-cancellation", "premium", "tech"],
  };

  await addProduct(newProduct);
}

// Main function
async function main() {
  try {
    console.log("🛍️ sastabazar Product Manager");
    console.log("============================");

    // List current products
    await listProducts();

    // Add example product
    console.log("Adding example product...");
    await addExampleProduct();

    // List products again
    await listProducts();
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Export functions for use
module.exports = {
  addProduct,
  listProducts,
  productTemplate,
};

// Run if called directly
if (require.main === module) {
  main();
}
