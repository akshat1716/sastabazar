const mongoose = require("mongoose");
const Order = require("./server/models/Order");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/sastabazar");

// Shipping configuration
const shippingConfig = {
  // Domestic shipping rates
  domestic: {
    standard: { price: 50, days: "5-7", name: "Standard Shipping" },
    express: { price: 150, days: "2-3", name: "Express Shipping" },
    premium: { price: 300, days: "1-2", name: "Premium Shipping" },
  },

  // International shipping rates
  international: {
    standard: { price: 500, days: "10-15", name: "International Standard" },
    express: { price: 1200, days: "5-7", name: "International Express" },
  },

  // Free shipping threshold
  freeShippingThreshold: 2000,

  // Shipping zones
  zones: {
    metro: [
      "Mumbai",
      "Delhi",
      "Bangalore",
      "Chennai",
      "Kolkata",
      "Hyderabad",
      "Pune",
    ],
    tier1: ["Ahmedabad", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore"],
    tier2: ["Other cities"],
    rural: ["Rural areas"],
  },
};

// Function to calculate shipping cost
function calculateShipping(orderValue, destination, shippingType = "standard") {
  let basePrice = shippingConfig.domestic[shippingType].price;

  // Free shipping for orders above threshold
  if (orderValue >= shippingConfig.freeShippingThreshold) {
    return {
      cost: 0,
      method: "Free Shipping",
      estimatedDays: "5-7",
      message: `Free shipping on orders above ₹${shippingConfig.freeShippingThreshold}`,
    };
  }

  // Zone-based pricing
  if (shippingConfig.zones.metro.includes(destination)) {
    basePrice = basePrice * 0.8; // 20% discount for metro cities
  } else if (shippingConfig.zones.rural.includes(destination)) {
    basePrice = basePrice * 1.5; // 50% extra for rural areas
  }

  return {
    cost: Math.round(basePrice),
    method: shippingConfig.domestic[shippingType].name,
    estimatedDays: shippingConfig.domestic[shippingType].days,
    message: `Shipping to ${destination}`,
  };
}

// Function to create shipping label
function createShippingLabel(orderId, customerDetails, productDetails) {
  const label = {
    orderId: orderId,
    customerName: customerDetails.name,
    customerAddress: customerDetails.address,
    customerPhone: customerDetails.phone,
    products: productDetails,
    shippingMethod: "Standard",
    trackingNumber: `SB${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    createdAt: new Date(),
    status: "Ready to Ship",
  };

  return label;
}

// Example usage
async function demonstrateShipping() {
  try {
    console.log("🚚 sastabazar Shipping System");
    console.log("============================");

    // Example order
    const orderValue = 1500;
    const destination = "Mumbai";

    console.log(`\n📦 Order Value: ₹${orderValue}`);
    console.log(`📍 Destination: ${destination}`);

    // Calculate shipping
    const shipping = calculateShipping(orderValue, destination, "standard");
    console.log(`\n💰 Shipping Cost: ₹${shipping.cost}`);
    console.log(`🚚 Method: ${shipping.method}`);
    console.log(`⏰ Estimated Delivery: ${shipping.estimatedDays} days`);
    console.log(`📝 Note: ${shipping.message}`);

    // Create shipping label
    const customerDetails = {
      name: "John Doe",
      address: "123 Main Street, Mumbai, Maharashtra 400001",
      phone: "+91 9876543210",
    };

    const productDetails = [
      { name: "Premium Cotton T-Shirt", quantity: 2, weight: "0.5kg" },
    ];

    const label = createShippingLabel(
      "ORD001",
      customerDetails,
      productDetails,
    );
    console.log(`\n🏷️ Shipping Label Created:`);
    console.log(`   Order ID: ${label.orderId}`);
    console.log(`   Tracking Number: ${label.trackingNumber}`);
    console.log(`   Status: ${label.status}`);

    console.log(`\n✅ Shipping system ready!`);
    console.log(`📋 Next steps:`);
    console.log(`   1. Integrate with courier service`);
    console.log(`   2. Add tracking to orders`);
    console.log(`   3. Set up automated notifications`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Export functions
module.exports = {
  calculateShipping,
  createShippingLabel,
  shippingConfig,
};

// Run demonstration
if (require.main === module) {
  demonstrateShipping();
}
