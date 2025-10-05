const mongoose = require("mongoose");
const { config } = require("./server/config");

// Import models to ensure they're registered
require("./server/models/User");
require("./server/models/Product");
require("./server/models/Order");
require("./server/models/Cart");
require("./server/models/Review");
require("./server/models/Wishlist");

async function runMigration() {
  try {
    console.log("🔄 Starting database migration...");

    // Connect to database
    await mongoose.connect(config.mongodbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB");
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);

    // Create indexes for better performance
    console.log("🔄 Creating database indexes...");

    // User indexes
    await mongoose.connection.db
      .collection("users")
      .createIndex({ email: 1 }, { unique: true });
    await mongoose.connection.db
      .collection("users")
      .createIndex({ createdAt: -1 });

    // Product indexes
    await mongoose.connection.db
      .collection("products")
      .createIndex({ category: 1 });
    await mongoose.connection.db
      .collection("products")
      .createIndex({ isActive: 1 });
    await mongoose.connection.db
      .collection("products")
      .createIndex({ isFeatured: 1 });
    await mongoose.connection.db
      .collection("products")
      .createIndex({ isOnSale: 1 });
    await mongoose.connection.db
      .collection("products")
      .createIndex({ basePrice: 1 });
    await mongoose.connection.db
      .collection("products")
      .createIndex({ createdAt: -1 });
    await mongoose.connection.db
      .collection("products")
      .createIndex({ name: "text", description: "text" });

    // Order indexes
    await mongoose.connection.db
      .collection("orders")
      .createIndex({ userId: 1 });
    await mongoose.connection.db
      .collection("orders")
      .createIndex({ orderNumber: 1 }, { unique: true });
    await mongoose.connection.db
      .collection("orders")
      .createIndex({ status: 1 });
    await mongoose.connection.db
      .collection("orders")
      .createIndex({ paymentStatus: 1 });
    await mongoose.connection.db
      .collection("orders")
      .createIndex({ createdAt: -1 });

    // Cart indexes
    await mongoose.connection.db
      .collection("carts")
      .createIndex({ userId: 1 }, { unique: true });
    await mongoose.connection.db
      .collection("carts")
      .createIndex({ updatedAt: -1 });

    // Review indexes
    await mongoose.connection.db
      .collection("reviews")
      .createIndex({ productId: 1 });
    await mongoose.connection.db
      .collection("reviews")
      .createIndex({ userId: 1 });
    await mongoose.connection.db
      .collection("reviews")
      .createIndex({ rating: 1 });
    await mongoose.connection.db
      .collection("reviews")
      .createIndex({ createdAt: -1 });

    // Wishlist indexes
    await mongoose.connection.db
      .collection("wishlists")
      .createIndex({ userId: 1 }, { unique: true });
    await mongoose.connection.db
      .collection("wishlists")
      .createIndex({ updatedAt: -1 });

    console.log("✅ Database indexes created successfully");

    // Verify collections exist
    console.log("🔄 Verifying collections...");
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    const collectionNames = collections.map((col) => col.name);

    const requiredCollections = [
      "users",
      "products",
      "orders",
      "carts",
      "reviews",
      "wishlists",
    ];
    const missingCollections = requiredCollections.filter(
      (name) => !collectionNames.includes(name),
    );

    if (missingCollections.length > 0) {
      console.log("⚠️ Missing collections:", missingCollections);
      console.log(
        "📝 Collections will be created automatically when first document is inserted",
      );
    } else {
      console.log("✅ All required collections exist");
    }

    // Check if we have any products
    const productCount = await mongoose.connection.db
      .collection("products")
      .countDocuments();
    if (productCount === 0) {
      console.log("⚠️ No products found in database");
      console.log('💡 Run "npm run seed" to add sample products');
    } else {
      console.log(`✅ Found ${productCount} products in database`);
    }

    console.log("🎉 Database migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("✅ Database connection closed");
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
