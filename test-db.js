const mongoose = require("mongoose");
require("dotenv").config();

async function testDatabaseConnection() {
  try {
    console.log("🔗 Testing database connection...");

    const mongoUri = process.env.MONGODB_URI;
    console.log(`MongoDB URI: ${mongoUri.replace(/\/\/.*@/, "//***:***@")}`);

    await mongoose.connect(mongoUri, {
      dbName: "sastabazar",
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
    });

    console.log("✅ Database connected successfully");

    const db = mongoose.connection.db;

    // Test basic operations
    const testCollection = db.collection("health_test");

    // Test write
    const writeResult = await testCollection.insertOne({
      test: true,
      timestamp: new Date(),
      verification: "pre-launch",
    });

    console.log("✅ Write test passed");

    // Test read
    const readResult = await testCollection.findOne({
      _id: writeResult.insertedId,
    });

    if (readResult && readResult.test) {
      console.log("✅ Read test passed");
    } else {
      console.log("❌ Read test failed");
    }

    // Cleanup
    await testCollection.deleteOne({ _id: writeResult.insertedId });
    console.log("✅ Cleanup completed");

    // Check indexes
    const collections = ["users", "products", "orders"];
    for (const collectionName of collections) {
      const collection = db.collection(collectionName);
      const indexes = await collection.indexes();
      console.log(`📊 ${collectionName}: ${indexes.length} indexes`);
    }

    await mongoose.disconnect();
    console.log("✅ Database connection test completed successfully");
  } catch (error) {
    console.error("❌ Database connection test failed:", error.message);
    process.exit(1);
  }
}

testDatabaseConnection();
