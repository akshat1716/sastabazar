const mongoose = require("mongoose");
const Product = require("./server/models/Product");
const readline = require("readline");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/sastabazar");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to ask questions
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Function to add a product
async function addProduct(productData) {
  try {
    const product = new Product(productData);
    await product.save();
    console.log(`\n✅ Product "${productData.name}" added successfully!`);
    console.log(`🆔 Product ID: ${product._id}`);
    return product;
  } catch (error) {
    console.error("❌ Error adding product:", error.message);
    throw error;
  }
}

// Main function
async function main() {
  try {
    console.log("🛍️ sastabazar Product Manager");
    console.log("============================");
    console.log("Let's add your custom product!\n");

    // Get product details
    const name = await askQuestion("Product Name: ");
    const description = await askQuestion("Product Description: ");
    const shortDescription = await askQuestion(
      "Short Description (for cards): ",
    );

    console.log(
      "\nValid categories: apparel, home-goods, tech-accessories, art-prints",
    );
    const category = await askQuestion("Category: ");

    const brand =
      (await askQuestion("Brand (default: sastabazar): ")) || "sastabazar";
    const basePrice = await askQuestion("Base Price (₹): ");
    const salePrice = await askQuestion(
      "Sale Price (₹) - leave empty if no sale: ",
    );
    const stock = await askQuestion("Stock Quantity: ");

    console.log("\nImage URL (use Unsplash or any image URL):");
    const imageUrl = await askQuestion("Image URL: ");

    console.log("\nTags (comma-separated):");
    const tagsInput = await askQuestion("Tags: ");
    const tags = tagsInput ? tagsInput.split(",").map((tag) => tag.trim()) : [];

    // Create product data
    const productData = {
      name,
      description,
      shortDescription,
      category,
      brand,
      images: [
        {
          url: imageUrl,
          alt: name,
          isPrimary: true,
        },
      ],
      variants: [
        {
          name: "Default",
          value: "One Size",
          price: parseInt(basePrice),
          stock: parseInt(stock),
          sku: `${name.toUpperCase().replace(/\s+/g, "-")}-001`,
        },
      ],
      basePrice: parseInt(basePrice),
      salePrice: salePrice ? parseInt(salePrice) : parseInt(basePrice),
      isOnSale: salePrice ? true : false,
      isNewArrival: true,
      isFeatured: true,
      tags,
      dimensions: { unit: "cm" },
      materials: [],
      colors: [],
      rating: { average: 0, count: 0 },
      stock: parseInt(stock),
      isActive: true,
      seo: { keywords: tags },
      reviews: [],
    };

    // Add the product
    await addProduct(productData);

    console.log("\n🎉 Product added successfully!");
    console.log("You can now view it at: http://localhost:5173/products");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    rl.close();
    mongoose.connection.close();
  }
}

// Run the script
main();
