const mongoose = require('mongoose');
const { config } = require('./index');
const { logger, logDatabaseOperation, logDatabaseQuery } = require('./logger');

class DatabaseConnection {
  constructor() {
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
    this.connectionPool = null;
    this.indexesCreated = false;
  }

  async connect() {
    try {
      const uri = process.env.MONGODB_URI;
      if (!uri) throw new Error('MONGODB_URI is missing');
      
      logger.info('🔄 Connecting to MongoDB Atlas...');
      
      const options = {
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 10,
        socketTimeoutMS: 45000,
        bufferCommands: false
      };

      const startTime = Date.now();
      await mongoose.connect(uri, options);
      const connectionTime = Date.now() - startTime;
      
      this.isConnected = true;
      this.retryCount = 0;
      this.connectionPool = mongoose.connection;
      
      logger.info({
        database: mongoose.connection.db.databaseName,
        host: mongoose.connection.host,
        connectionTime: `${connectionTime}ms`,
        poolSize: options.maxPoolSize,
        minPoolSize: options.minPoolSize
      }, '✅ Connected to MongoDB Atlas successfully');
      
      // Set up connection event listeners
      this.setupEventListeners();
      
      // Skip complex operations for now to prevent startup issues
      // await this.validateUserPermissions();
      // await this.createAndValidateIndexes();
      // await this.runConnectionPoolTest();
      
      return true;
    } catch (error) {
      logger.error({ error: error.message }, '❌ MongoDB connection failed');
      this.isConnected = false;
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        logger.info({
          retryCount: this.retryCount,
          maxRetries: this.maxRetries,
          retryDelay: this.retryDelay
        }, `🔄 Retrying connection (${this.retryCount}/${this.maxRetries}) in ${this.retryDelay/1000}s...`);
        
        setTimeout(() => {
          this.connect();
        }, this.retryDelay);
      } else {
        logger.error('❌ Max retry attempts reached. MongoDB connection failed.');
        throw new Error('MongoDB connection failed after max retries');
      }
      
      return false;
    }
  }

  setupEventListeners() {
    mongoose.connection.on('connected', () => {
      logger.info('✅ Mongoose connected to MongoDB');
      this.isConnected = true;
    });

    mongoose.connection.on('error', (err) => {
      logger.error({ error: err.message }, '❌ Mongoose connection error');
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    // Connection pool monitoring
    mongoose.connection.on('fullsetup', () => {
      logger.info('📊 MongoDB connection pool fully established');
    });

    mongoose.connection.on('all', () => {
      logger.info('📊 All MongoDB connections established');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await this.disconnect();
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
    });
  }

  async validateUserPermissions() {
    try {
      logger.info('🔐 Validating database user permissions...');
      
      const db = mongoose.connection.db;
      const adminDb = db.admin();
      
      // Get current user info
      const currentUser = await adminDb.currentUser();
      
      logger.info({
        user: currentUser.user,
        roles: currentUser.roles
      }, 'Current database user information');
      
      // Test read permissions
      const testRead = await db.collection('users').findOne({});
      logDatabaseOperation('permission_test', 'users', 0, { operation: 'read_test' });
      
      // Test write permissions
      const testWrite = await db.collection('permission_test').insertOne({ 
        test: true, 
        timestamp: new Date() 
      });
      await db.collection('permission_test').deleteOne({ _id: testWrite.insertedId });
      logDatabaseOperation('permission_test', 'permission_test', 0, { operation: 'write_test' });
      
      // Test index creation permissions
      try {
        await db.collection('permission_test').createIndex({ test: 1 });
        await db.collection('permission_test').dropIndex({ test: 1 });
        logDatabaseOperation('permission_test', 'permission_test', 0, { operation: 'index_test' });
      } catch (indexError) {
        logger.warn({ error: indexError.message }, 'Limited index creation permissions');
      }
      
      logger.info('✅ Database user permissions validated');
      
    } catch (error) {
      logger.error({ error: error.message }, '❌ Database user permission validation failed');
      throw error;
    }
  }

  async createAndValidateIndexes() {
    try {
      logger.info('🔧 Creating and validating database indexes...');
      const startTime = Date.now();

      const db = mongoose.connection.db;
      const indexes = [
        // Users collection indexes
        {
          collection: 'users',
          index: { email: 1 },
          options: { unique: true, name: 'email_unique' }
        },
        {
          collection: 'users',
          index: { createdAt: 1 },
          options: { name: 'createdAt_1' }
        },
        {
          collection: 'users',
          index: { 'profile.firstName': 1, 'profile.lastName': 1 },
          options: { name: 'profile_name_1' }
        },
        {
          collection: 'users',
          index: { role: 1 },
          options: { name: 'role_1' }
        },

        // Products collection indexes
        {
          collection: 'products',
          index: { slug: 1 },
          options: { unique: true, name: 'slug_unique' }
        },
        {
          collection: 'products',
          index: { category: 1 },
          options: { name: 'category_1' }
        },
        {
          collection: 'products',
          index: { name: 'text', description: 'text' },
          options: { name: 'text_search' }
        },
        {
          collection: 'products',
          index: { price: 1 },
          options: { name: 'price_1' }
        },
        {
          collection: 'products',
          index: { stock: 1 },
          options: { name: 'stock_1' }
        },
        {
          collection: 'products',
          index: { createdAt: 1 },
          options: { name: 'createdAt_1' }
        },
        {
          collection: 'products',
          index: { 'variants.sku': 1 },
          options: { sparse: true, name: 'variants_sku_1' }
        },

        // Orders collection indexes
        {
          collection: 'orders',
          index: { userId: 1 },
          options: { name: 'userId_1' }
        },
        {
          collection: 'orders',
          index: { createdAt: 1 },
          options: { name: 'createdAt_1' }
        },
        {
          collection: 'orders',
          index: { orderNumber: 1 },
          options: { unique: true, name: 'orderNumber_unique' }
        },
        {
          collection: 'orders',
          index: { status: 1 },
          options: { name: 'status_1' }
        },
        {
          collection: 'orders',
          index: { paymentStatus: 1 },
          options: { name: 'paymentStatus_1' }
        },
        {
          collection: 'orders',
          index: { paymentIntentId: 1 },
          options: { sparse: true, name: 'paymentIntentId_1' }
        },
        {
          collection: 'orders',
          index: { userId: 1, createdAt: -1 },
          options: { name: 'userId_createdAt_1' }
        },

        // Cart collection indexes
        {
          collection: 'carts',
          index: { userId: 1 },
          options: { unique: true, name: 'userId_unique' }
        },
        {
          collection: 'carts',
          index: { updatedAt: 1 },
          options: { name: 'updatedAt_1' }
        },

        // Reviews collection indexes
        {
          collection: 'reviews',
          index: { productId: 1 },
          options: { name: 'productId_1' }
        },
        {
          collection: 'reviews',
          index: { userId: 1 },
          options: { name: 'userId_1' }
        },
        {
          collection: 'reviews',
          index: { rating: 1 },
          options: { name: 'rating_1' }
        },
        {
          collection: 'reviews',
          index: { createdAt: 1 },
          options: { name: 'createdAt_1' }
        },
        {
          collection: 'reviews',
          index: { productId: 1, userId: 1 },
          options: { unique: true, name: 'productId_userId_unique' }
        },

        // Wishlist collection indexes
        {
          collection: 'wishlists',
          index: { userId: 1 },
          options: { unique: true, name: 'userId_unique' }
        },
        {
          collection: 'wishlists',
          index: { updatedAt: 1 },
          options: { name: 'updatedAt_1' }
        }
      ];

      const createdIndexes = [];
      const existingIndexes = [];

      for (const indexConfig of indexes) {
        try {
          const collection = db.collection(indexConfig.collection);
          
          // Check if index already exists
          const existingIndexes = await collection.indexes();
          const indexExists = existingIndexes.some(idx => 
            JSON.stringify(idx.key) === JSON.stringify(indexConfig.index)
          );

          if (!indexExists) {
            await collection.createIndex(indexConfig.index, indexConfig.options);
            createdIndexes.push({
              collection: indexConfig.collection,
              index: indexConfig.index,
              name: indexConfig.options.name
            });
            logDatabaseOperation('createIndex', indexConfig.collection, 0, {
              index: indexConfig.index,
              options: indexConfig.options
            });
          } else {
            existingIndexes.push({
              collection: indexConfig.collection,
              index: indexConfig.index,
              name: indexConfig.options.name
            });
          }
        } catch (indexError) {
          logger.warn({
            collection: indexConfig.collection,
            index: indexConfig.index,
            error: indexError.message
          }, 'Failed to create index');
        }
      }

      const indexTime = Date.now() - startTime;
      
      logger.info({
        indexTime: `${indexTime}ms`,
        totalIndexes: indexes.length,
        createdIndexes: createdIndexes.length,
        existingIndexes: existingIndexes.length,
        created: createdIndexes,
        existing: existingIndexes
      }, '✅ Database indexes validated and created');

      this.indexesCreated = true;
      return { created: createdIndexes, existing: existingIndexes };

    } catch (error) {
      logger.error({ error: error.message }, '❌ Failed to create/validate database indexes');
      throw error;
    }
  }

  async runConnectionPoolTest() {
    try {
      logger.info('📊 Running connection pool load test...');
      
      const db = mongoose.connection.db;
      const testCollection = db.collection('connection_pool_test');
      
      // Clean up any existing test data
      await testCollection.deleteMany({ test: true });
      
      const concurrentConnections = 10;
      const operationsPerConnection = 5;
      const promises = [];
      
      const startTime = Date.now();
      
      // Simulate concurrent database operations
      for (let i = 0; i < concurrentConnections; i++) {
        const promise = (async () => {
          const operations = [];
          for (let j = 0; j < operationsPerConnection; j++) {
            operations.push(
              testCollection.insertOne({
                test: true,
                connectionId: i,
                operationId: j,
                timestamp: new Date()
              })
            );
          }
          await Promise.all(operations);
        })();
        promises.push(promise);
      }
      
      await Promise.all(promises);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const totalOperations = concurrentConnections * operationsPerConnection;
      const operationsPerSecond = Math.round((totalOperations / totalTime) * 1000);
      
      // Clean up test data
      await testCollection.deleteMany({ test: true });
      
      logger.info({
        concurrentConnections,
        operationsPerConnection,
        totalOperations,
        totalTime: `${totalTime}ms`,
        operationsPerSecond,
        avgLatency: `${Math.round(totalTime / totalOperations)}ms`
      }, '✅ Connection pool load test completed');
      
      return {
        concurrentConnections,
        totalOperations,
        totalTime,
        operationsPerSecond,
        avgLatency: Math.round(totalTime / totalOperations)
      };
      
    } catch (error) {
      logger.error({ error: error.message }, '❌ Connection pool load test failed');
      throw error;
    }
  }

  async disconnect() {
    if (mongoose.connection.readyState !== 0) {
      try {
        await mongoose.disconnect();
        logger.info('✅ MongoDB connection closed');
        this.isConnected = false;
      } catch (error) {
        logger.error({ error: error.message }, '❌ Error closing MongoDB connection');
      }
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      retryCount: this.retryCount,
      indexesCreated: this.indexesCreated,
      poolSize: mongoose.connection.readyState === 1 ? mongoose.connection.db.serverConfig.s.pool.size : 0
    };
  }

  async healthCheck() {
    const state = mongoose.connection.readyState; // 1=connected
    return {
      status: state === 1 ? 'healthy' : 'unhealthy',
      dbName: mongoose.connection.name || null,
      host: mongoose.connection.host || null
    };
  }

  // Get index information for monitoring
  async getIndexInfo() {
    try {
      const db = mongoose.connection.db;
      const collections = ['users', 'products', 'orders', 'carts', 'reviews', 'wishlists'];
      const indexInfo = {};
      
      for (const collectionName of collections) {
        const collection = db.collection(collectionName);
        const indexes = await collection.indexes();
        indexInfo[collectionName] = indexes.map(idx => ({
          name: idx.name,
          key: idx.key,
          unique: idx.unique || false,
          sparse: idx.sparse || false
        }));
      }
      
      return indexInfo;
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to get index information');
      return {};
    }
  }
}

// Create singleton instance
const dbConnection = new DatabaseConnection();

module.exports = dbConnection;