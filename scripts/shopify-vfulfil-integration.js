#!/usr/bin/env node

/**
 * Shopify + VFulfil Integration Script
 * 
 * This script helps you integrate VFulfil products with Shopify
 * and sync them to your custom sastabazar website
 */

const axios = require('axios')
const fs = require('fs')
const path = require('path')

// Configuration
const CONFIG = {
  // Shopify Store Configuration
  shopify: {
    shopName: 'your-shop-name', // Replace with your Shopify store name
    apiKey: 'your-api-key',     // Replace with your Shopify API key
    apiSecret: 'your-api-secret', // Replace with your Shopify API secret
    accessToken: 'your-access-token' // Replace with your Shopify access token
  },
  
  // VFulfil Configuration (when API becomes available)
  vfulfil: {
    apiKey: 'your-vfulfil-api-key',
    apiSecret: 'your-vfulfil-api-secret'
  },
  
  // Your sastabazar database
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sastabazar'
  }
}

class ShopifyVFulfilIntegration {
  constructor() {
    this.shopifyBaseUrl = `https://${CONFIG.shopify.shopName}.myshopify.com/admin/api/2023-10`
    this.headers = {
      'X-Shopify-Access-Token': CONFIG.shopify.accessToken,
      'Content-Type': 'application/json'
    }
  }

  /**
   * Method 1: Import products from Shopify to your sastabazar database
   */
  async importFromShopify() {
    try {
      console.log('🔄 Importing products from Shopify...')
      
      const response = await axios.get(`${this.shopifyBaseUrl}/products.json`, {
        headers: this.headers,
        params: {
          limit: 250 // Shopify's max limit per request
        }
      })

      const products = response.data.products
      console.log(`📦 Found ${products.length} products in Shopify`)

      // Transform Shopify products to sastabazar format
      const transformedProducts = products.map(product => ({
        name: product.title,
        description: product.body_html ? this.stripHtml(product.body_html) : '',
        shortDescription: product.title,
        category: this.mapCategory(product.product_type),
        brand: product.vendor || 'sastabazar',
        price: this.parsePrice(product.variants[0]?.price),
        originalPrice: this.parsePrice(product.variants[0]?.compare_at_price) || this.parsePrice(product.variants[0]?.price),
        stock: product.variants[0]?.inventory_quantity || 0,
        images: product.images.map(img => img.src),
        tags: product.tags.split(',').map(tag => tag.trim()),
        isActive: true,
        isFeatured: product.tags.includes('featured'),
        isDropshipping: product.tags.includes('dropshipping'),
        supplier: 'VFulfil',
        supplierProductId: product.id.toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      console.log('✅ Products transformed successfully')
      return transformedProducts

    } catch (error) {
      console.error('❌ Error importing from Shopify:', error.message)
      throw error
    }
  }

  /**
   * Method 2: Sync products to your MongoDB database
   */
  async syncToDatabase(products) {
    try {
      console.log('🔄 Syncing products to sastabazar database...')
      
      const mongoose = require('mongoose')
      await mongoose.connect(CONFIG.mongodb.uri)
      
      const Product = require('../server/models/Product')
      
      let syncedCount = 0
      let skippedCount = 0

      for (const productData of products) {
        try {
          // Check if product already exists
          const existingProduct = await Product.findOne({ 
            supplierProductId: productData.supplierProductId 
          })

          if (existingProduct) {
            // Update existing product
            await Product.findByIdAndUpdate(existingProduct._id, productData)
            console.log(`🔄 Updated: ${productData.name}`)
            syncedCount++
          } else {
            // Create new product
            const product = new Product(productData)
            await product.save()
            console.log(`✅ Added: ${productData.name}`)
            syncedCount++
          }
        } catch (error) {
          console.log(`⚠️ Skipped: ${productData.name} - ${error.message}`)
          skippedCount++
        }
      }

      console.log(`\n📊 Sync Summary:`)
      console.log(`✅ Synced: ${syncedCount} products`)
      console.log(`⚠️ Skipped: ${skippedCount} products`)
      
      await mongoose.disconnect()
      return { syncedCount, skippedCount }

    } catch (error) {
      console.error('❌ Error syncing to database:', error.message)
      throw error
    }
  }

  /**
   * Method 3: Export products to CSV for manual import
   */
  async exportToCSV(products) {
    try {
      console.log('📄 Exporting products to CSV...')
      
      const csvHeader = 'name,description,shortDescription,category,brand,price,originalPrice,stock,images,tags,isActive,isFeatured,isDropshipping,supplier,supplierProductId'
      
      const csvRows = products.map(product => [
        `"${product.name}"`,
        `"${product.description}"`,
        `"${product.shortDescription}"`,
        product.category,
        product.brand,
        product.price,
        product.originalPrice,
        product.stock,
        `"${product.images.join(',')}"`,
        `"${product.tags.join(',')}"`,
        product.isActive,
        product.isFeatured,
        product.isDropshipping,
        product.supplier,
        product.supplierProductId
      ].join(','))

      const csvContent = [csvHeader, ...csvRows].join('\n')
      
      const filename = `shopify-products-${new Date().toISOString().split('T')[0]}.csv`
      const filepath = path.join(__dirname, '..', filename)
      
      fs.writeFileSync(filepath, csvContent)
      console.log(`✅ CSV exported to: ${filepath}`)
      
      return filepath

    } catch (error) {
      console.error('❌ Error exporting CSV:', error.message)
      throw error
    }
  }

  // Helper methods
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  }

  mapCategory(productType) {
    const categoryMap = {
      'Electronics': 'electronics',
      'Clothing': 'clothing',
      'Home & Garden': 'home-goods',
      'Sports': 'sports',
      'Beauty': 'beauty',
      'Books': 'books',
      'Toys': 'toys',
      'Automotive': 'automotive'
    }
    
    return categoryMap[productType] || 'general'
  }

  parsePrice(price) {
    return price ? parseFloat(price) : 0
  }

  /**
   * Main execution method
   */
  async run(mode = 'sync') {
    try {
      console.log('🚀 Starting Shopify + VFulfil Integration...\n')

      // Step 1: Import products from Shopify
      const products = await this.importFromShopify()

      if (mode === 'sync') {
        // Step 2: Sync to database
        await this.syncToDatabase(products)
      } else if (mode === 'export') {
        // Step 2: Export to CSV
        await this.exportToCSV(products)
      }

      console.log('\n🎉 Integration completed successfully!')

    } catch (error) {
      console.error('\n💥 Integration failed:', error.message)
      process.exit(1)
    }
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2)
  const mode = args[0] || 'sync' // 'sync' or 'export'
  
  const integration = new ShopifyVFulfilIntegration()
  integration.run(mode)
}

module.exports = ShopifyVFulfilIntegration
