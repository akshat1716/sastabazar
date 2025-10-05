const mongoose = require("mongoose");
const Product = require("./server/models/Product"); // Adjust path as needed

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/sastabazar", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function addGarlicPeelerProduct() {
  try {
    const newProduct = new Product({
      name: "2 in 1 Garlic Peeler Set",
      description:
        "Premium stainless steel garlic peeler set with dual functionality. Perfect for mincing and peeling garlic efficiently. Made from durable materials for long-lasting use.",
      shortDescription: "Premium stainless steel garlic peeler set.",
      category: "home-goods",
      brand: "VFulfil",
      images: [
        {
          url: "https://images.unsplash.com/photo-1583847268964-dd287de79117?w=500&h=500&fit=crop",
          alt: "2 in 1 Garlic Peeler Set",
          isPrimary: true,
        },
      ],
      variants: [
        {
          name: "Color",
          value: "Silver",
          price: 399,
          stock: 100,
          sku: "GARLIC-PEELER-SILVER-VF001",
        },
      ],
      basePrice: 399,
      salePrice: 349,
      isOnSale: true,
      isNewArrival: true,
      isFeatured: true,
      tags: [
        "garlic peeler",
        "kitchen",
        "stainless steel",
        "home goods",
        "vfulfil",
      ],
      stock: 100,
      isActive: true,
      // VFulfil specific details
      supplierPrice: 195, // Cost from VFulfil (Air shipping, MOQ 100)
      shippingTime: "12-16 days",
      profitMargin: "50%",
      minOrderQuantity: 100,
      supplier: "VFulfil",
      productId: "VFPD5478",
    });

    const savedProduct = await newProduct.save();
    console.log(`✅ Product "${savedProduct.name}" added successfully!`);
    console.log(`🆔 Product ID: ${savedProduct._id}`);
    console.log(`🏠 Category: ${savedProduct.category}`);
    console.log(
      `💰 Your Price: ₹${savedProduct.basePrice} (Sale: ₹${savedProduct.salePrice})`,
    );
    console.log(`📦 Stock: ${savedProduct.stock} units`);
    console.log(`🚚 Shipping: ${savedProduct.shippingTime}`);
    console.log(`💵 Profit Margin: ${savedProduct.profitMargin}`);
    console.log(`📋 VFulfil ID: ${savedProduct.productId}`);
  } catch (error) {
    console.error("❌ Error adding product:", error.message);
  } finally {
    mongoose.connection.close();
  }
}

if (require.main === module) {
  addGarlicPeelerProduct();
}
