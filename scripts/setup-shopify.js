#!/usr/bin/env node

/**
 * Shopify Setup Helper Script
 *
 * This script helps you set up Shopify integration for sastabazar
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupShopifyIntegration() {
  console.log("🚀 Shopify Integration Setup for sastabazar\n");

  console.log("This script will help you set up Shopify integration.");
  console.log("You'll need to create a Shopify store first.\n");

  const hasShopifyStore = await question(
    "Do you already have a Shopify store? (y/n): ",
  );

  if (hasShopifyStore.toLowerCase() !== "y") {
    console.log("\n📋 First, create a Shopify store:");
    console.log("1. Go to https://shopify.com");
    console.log('2. Click "Start free trial"');
    console.log("3. Enter your email and create password");
    console.log("4. Choose store name (e.g., sastabazar-store)");
    console.log("5. Complete the setup wizard\n");

    const continueSetup = await question("Have you created the store? (y/n): ");
    if (continueSetup.toLowerCase() !== "y") {
      console.log(
        "Please create your Shopify store first, then run this script again.",
      );
      rl.close();
      return;
    }
  }

  console.log("\n🔑 Now let's get your Shopify API credentials:");
  console.log("1. In Shopify Admin, go to Settings → Apps and sales channels");
  console.log('2. Click "Develop apps"');
  console.log('3. Click "Create an app"');
  console.log("4. Name it: sastabazar-integration");
  console.log("5. Configure Admin API access:");
  console.log("   - Products: Read access");
  console.log("   - Orders: Read/Write access");
  console.log("   - Customers: Read access");
  console.log("   - Inventory: Read access");
  console.log('6. Click "Save"');
  console.log('7. Click "Install app"');
  console.log("8. Copy your Admin API access token\n");

  const shopName = await question(
    "Enter your Shopify store name (without .myshopify.com): ",
  );
  const accessToken = await question(
    "Enter your Shopify Admin API access token: ",
  );

  if (!shopName || !accessToken) {
    console.log("❌ Both store name and access token are required.");
    rl.close();
    return;
  }

  // Update .env file
  const envPath = path.join(__dirname, "..", ".env");
  let envContent = "";

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
  }

  // Remove existing Shopify config
  envContent = envContent.replace(/SHOPIFY_.*\n/g, "");

  // Add new Shopify config
  envContent += `\n# Shopify Integration\n`;
  envContent += `SHOPIFY_SHOP_NAME=${shopName}\n`;
  envContent += `SHOPIFY_ACCESS_TOKEN=${accessToken}\n`;

  fs.writeFileSync(envPath, envContent);
  console.log("\n✅ Shopify credentials saved to .env file");

  // Test connection
  console.log("\n🔄 Testing connection...");
  try {
    const ShopifyIntegration = require("./shopify-integration");
    const integration = new ShopifyIntegration();
    await integration.run("test");
  } catch (error) {
    console.log("❌ Connection test failed. Please check your credentials.");
    rl.close();
    return;
  }

  console.log("\n🎉 Setup completed successfully!");
  console.log("\n📋 Next steps:");
  console.log("1. Run: node scripts/shopify-integration.js sync-products");
  console.log("2. Run: node scripts/shopify-integration.js sync-orders");
  console.log("3. Set up webhooks for real-time sync (optional)");

  rl.close();
}

// Run setup
setupShopifyIntegration().catch(console.error);
