# 🚀 sastabazar Bulk Product Import Guide

## Import Hundreds of Products with One Click!

### 🎯 Quick Start (3 Steps):

1. **Get the template:**

   ```bash
   node bulk-import.js template
   ```

2. **Fill with your products:**
   - Open `products-template.csv` in Excel/Google Sheets
   - Add your products (copy the format)
   - Save as `products.csv`

3. **Import all products:**
   ```bash
   node bulk-import.js import
   ```

### 📋 CSV Template Columns:

| Column             | Description        | Example                           | Required |
| ------------------ | ------------------ | --------------------------------- | -------- |
| `name`             | Product name       | "Premium Cotton T-Shirt"          | ✅       |
| `description`      | Full description   | "Ultra-soft premium cotton..."    | ✅       |
| `shortDescription` | Brief description  | "Premium cotton t-shirt"          | ✅       |
| `category`         | Product category   | "apparel"                         | ✅       |
| `brand`            | Brand name         | "sastabazar"                      | ✅       |
| `basePrice`        | Regular price      | "1299"                            | ✅       |
| `salePrice`        | Sale price         | "999"                             | ❌       |
| `stock`            | Available quantity | "50"                              | ✅       |
| `imageUrl`         | Product image URL  | "https://images.unsplash.com/..." | ✅       |
| `tags`             | Search tags        | "cotton,premium,minimalist"       | ❌       |
| `isOnSale`         | On sale?           | "true" or "false"                 | ❌       |
| `isFeatured`       | Featured product?  | "true" or "false"                 | ❌       |
| `isNewArrival`     | New arrival?       | "true" or "false"                 | ❌       |

### 🏷️ Valid Categories:

- `apparel` - Clothing, shoes, accessories
- `home-goods` - Furniture, decor, kitchen items
- `tech-accessories` - Electronics, gadgets
- `art-prints` - Artwork, prints, decorative items

### 📝 Example Product Row:

```csv
name,description,shortDescription,category,brand,basePrice,salePrice,stock,imageUrl,tags,isOnSale,isFeatured,isNewArrival
"Premium Cotton T-Shirt","Ultra-soft premium cotton t-shirt with minimalist design. Perfect for everyday wear.","Premium cotton t-shirt","apparel","sastabazar","1299","999","50","https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=500&fit=crop","cotton,premium,minimalist","true","true","false"
```

### 🛠️ Available Commands:

```bash
# Create CSV template
node bulk-import.js template

# Import products from products.csv
node bulk-import.js import

# Export current products to CSV
node bulk-import.js export

# Show help
node bulk-import.js
```

### 💡 Pro Tips:

1. **Use Excel/Google Sheets** for easier editing
2. **Copy image URLs** from Unsplash, your website, or cloud storage
3. **Use consistent categories** for better organization
4. **Add relevant tags** for better searchability
5. **Test with a few products first** before importing hundreds

### 🔄 Import Process:

1. **Template Creation:** Creates `products-template.csv` with sample data
2. **Data Entry:** Fill the CSV with your products
3. **Import:** Uploads all products to your database
4. **Verification:** Check your website to see imported products

### 📊 After Import:

- **View Products:** http://localhost:5173/products
- **Database Viewer:** http://localhost:5001/api/db
- **Admin Panel:** http://localhost:5173/admin

### 🚨 Troubleshooting:

- **CSV Format:** Make sure to use commas as separators
- **Image URLs:** Use direct image URLs (not page URLs)
- **Categories:** Only use valid categories listed above
- **Prices:** Use numbers only (no currency symbols)

### 🎉 Success!

Once imported, your products will be:

- ✅ Live on your website
- ✅ Searchable and filterable
- ✅ Ready for customers to purchase
- ✅ Available in your admin panel

**Import hundreds of products in minutes, not hours!** 🚀
