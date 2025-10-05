const fs = require("fs");
const path = require("path");

// Files to update with INR currency formatting
const filesToUpdate = [
  "client/src/components/ProductCard.jsx",
  "client/src/components/CartSidebar.jsx",
  "client/src/pages/Cart.jsx",
  "client/src/pages/OrderDetail.jsx",
  "client/src/pages/Checkout.jsx",
];

// Function to fix currency formatting
function fixCurrencyFormatting(filePath) {
  try {
    let content = fs.readFileSync(filePath, "utf8");

    // Replace USD currency formatting with INR
    content = content.replace(
      /new Intl\.NumberFormat\('en-US',\s*{\s*style:\s*'currency',\s*currency:\s*'USD',\s*}\)\.format\(price\)/g,
      "new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(price)",
    );

    // Replace $ symbols with ₹ symbols
    content = content.replace(/\$\{/g, "₹{");
    content = content.replace(/\$\(/g, "₹(");
    content = content.replace(/\$([0-9])/g, "₹$1");
    content = content.replace(/\$([a-zA-Z])/g, "₹$1");

    // Replace .toFixed(2) with proper INR formatting where needed
    content = content.replace(
      /\.toFixed\(2\)/g,
      ".toLocaleString('en-IN', { style: 'currency', currency: 'INR' })",
    );

    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated currency formatting in ${filePath}`);
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

// Update all files
filesToUpdate.forEach((filePath) => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    fixCurrencyFormatting(fullPath);
  } else {
    console.log(`⚠️ File not found: ${fullPath}`);
  }
});

console.log("🎉 Currency formatting updated to INR!");
