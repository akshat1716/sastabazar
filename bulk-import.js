const mongoose = require("mongoose");
const Product = require("./server/models/Product");
const fs = require("fs");
const csv = require("csv-parser");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/sastabazar");

// Function to create CSV template
function createCSVTemplate() {
  const headers = [
    "name",
    "description",
    "shortDescription",
    "category",
    "brand",
    "basePrice",
    "salePrice",
    "stock",
    "imageUrl",
    "tags",
    "isOnSale",
    "isFeatured",
    "isNewArrival",
  ];

  const sampleData = [
    [
      "Premium Cotton T-Shirt",
      "Ultra-soft premium cotton t-shirt with minimalist design. Perfect for everyday wear.",
      "Premium cotton t-shirt",
      "apparel",
      "sastabazar",
      "1299",
      "999",
      "50",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop",
      "cotton,premium,minimalist",
      "true",
      "true",
      "false",
    ],
    [
      "Wireless Bluetooth Headphones",
      "High-quality wireless headphones with noise cancellation and 30-hour battery life.",
      "Wireless headphones with noise cancellation",
      "tech-accessories",
      "sastabazar",
      "2999",
      "2499",
      "30",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop",
      "wireless,noise-cancellation,premium",
      "true",
      "true",
      "true",
    ],
  ];

  let csvContent = headers.join(",") + "\n";
  sampleData.forEach((row) => {
    csvContent += row.join(",") + "\n";
  });

  fs.writeFileSync("products-template.csv", csvContent);
  console.log("✅ CSV template created: products-template.csv");
  console.log(
    "📝 Fill this file with your products and run: node bulk-import.js import",
  );
}

// Function to import products from CSV
async function importFromCSV(filename = "products.csv") {
  try {
    const products = [];

    return new Promise((resolve, reject) => {
      fs.createReadStream(filename)
        .pipe(csv())
        .on("data", (row) => {
          // Convert CSV row to product object
          const product = {
            name: row.name,
            description: row.description,
            shortDescription: row.shortDescription,
            category: row.category,
            brand: row.brand || "sastabazar",
            images: [
              {
                url: row.imageUrl,
                alt: row.name,
                isPrimary: true,
              },
            ],
            variants: [
              {
                name: "Default",
                value: "One Size",
                price: parseInt(row.basePrice),
                stock: parseInt(row.stock),
                sku: `${row.name.toUpperCase().replace(/\s+/g, "-")}-001`,
              },
            ],
            basePrice: parseInt(row.basePrice),
            salePrice: row.salePrice
              ? parseInt(row.salePrice)
              : parseInt(row.basePrice),
            isOnSale: row.isOnSale === "true",
            isNewArrival: row.isNewArrival === "true",
            isFeatured: row.isFeatured === "true",
            tags: row.tags ? row.tags.split(",").map((tag) => tag.trim()) : [],
            dimensions: { unit: "cm" },
            materials: [],
            colors: [],
            rating: { average: 0, count: 0 },
            stock: parseInt(row.stock),
            isActive: true,
            seo: {
              keywords: row.tags
                ? row.tags.split(",").map((tag) => tag.trim())
                : [],
            },
            reviews: [],
          };

          products.push(product);
        })
        .on("end", async () => {
          try {
            console.log(`📦 Importing ${products.length} products...`);

            // Insert all products
            const insertedProducts = await Product.insertMany(products);

            console.log(
              `✅ Successfully imported ${insertedProducts.length} products!`,
            );
            console.log("🎉 Your products are now live on your website!");

            resolve(insertedProducts);
          } catch (error) {
            console.error("❌ Error importing products:", error.message);
            reject(error);
          }
        })
        .on("error", (error) => {
          console.error("❌ Error reading CSV file:", error.message);
          reject(error);
        });
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  }
}

// Function to export current products to CSV
async function exportToCSV() {
  try {
    const products = await Product.find({}).lean();

    const headers = [
      "name",
      "description",
      "shortDescription",
      "category",
      "brand",
      "basePrice",
      "salePrice",
      "stock",
      "imageUrl",
      "tags",
      "isOnSale",
      "isFeatured",
      "isNewArrival",
    ];

    let csvContent = headers.join(",") + "\n";

    products.forEach((product) => {
      const row = [
        product.name,
        product.description,
        product.shortDescription,
        product.category,
        product.brand,
        product.basePrice,
        product.salePrice || product.basePrice,
        product.stock,
        product.images[0]?.url || "",
        product.tags.join(","),
        product.isOnSale,
        product.isFeatured,
        product.isNewArrival,
      ];
      csvContent += row.join(",") + "\n";
    });

    fs.writeFileSync("products-export.csv", csvContent);
    console.log(
      `✅ Exported ${products.length} products to products-export.csv`,
    );
  } catch (error) {
    console.error("❌ Error exporting products:", error.message);
  }
}

// Main function
async function main() {
  const command = process.argv[2];

  try {
    console.log("🛍️ sastabazar Bulk Import System");
    console.log("================================");

    switch (command) {
      case "template":
        createCSVTemplate();
        break;

      case "import":
        await importFromCSV();
        break;

      case "export":
        await exportToCSV();
        break;

      default:
        console.log("📋 Available commands:");
        console.log("  node bulk-import.js template  - Create CSV template");
        console.log(
          "  node bulk-import.js import    - Import products from products.csv",
        );
        console.log(
          "  node bulk-import.js export    - Export current products to CSV",
        );
        console.log("");
        console.log("📝 Steps to import products:");
        console.log("1. Run: node bulk-import.js template");
        console.log("2. Edit products-template.csv with your products");
        console.log("3. Rename it to products.csv");
        console.log("4. Run: node bulk-import.js import");
        break;
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  createCSVTemplate,
  importFromCSV,
  exportToCSV,
};
