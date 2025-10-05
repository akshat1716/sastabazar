const express = require("express");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const { auth, adminAuth } = require("../middleware/auth");

const router = express.Router();

// Apply admin authentication to all routes
router.use(adminAuth);

// Get admin dashboard stats
router.get("/stats", async (req, res) => {
  try {
    const [
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue,
      monthlyRevenue,
      lastMonthRevenue,
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      User.countDocuments({ isActive: true }),
      Order.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Order.aggregate([
        {
          $match: {
            status: "completed",
            createdAt: {
              $gte: new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                1,
              ),
            },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Order.aggregate([
        {
          $match: {
            status: "completed",
            createdAt: {
              $gte: new Date(
                new Date().getFullYear(),
                new Date().getMonth() - 1,
                1,
              ),
              $lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
    ]);

    const topProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: { _id: "$items.productId", sales: { $sum: "$items.quantity" } },
      },
      { $sort: { sales: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
    ]);

    const revenueGrowth =
      lastMonthRevenue[0]?.total > 0
        ? (((monthlyRevenue[0]?.total || 0) - lastMonthRevenue[0].total) /
            lastMonthRevenue[0].total) *
          100
        : 0;

    res.json({
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue: totalRevenue[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      lastMonthRevenue: lastMonthRevenue[0]?.total || 0,
      revenueGrowth: Math.round(revenueGrowth),
      topProducts: topProducts.map((item) => ({
        _id: item._id,
        name: item.product.name,
        sales: item.sales,
      })),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Failed to fetch admin stats." });
  }
});

// Get all products for admin
router.get("/products", async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, status } = req.query;

    const filter = {};
    if (search) {
      filter.$text = { $search: search };
    }
    if (category) {
      filter.category = category;
    }
    if (status !== undefined) {
      filter.isActive = status === "active";
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total,
      },
    });
  } catch (error) {
    console.error("Admin products fetch error:", error);
    res.status(500).json({ error: "Failed to fetch products." });
  }
});

// Create new product
router.post("/products", async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json({ product });
  } catch (error) {
    console.error("Product creation error:", error);
    res.status(500).json({ error: "Failed to create product." });
  }
});

// Update product
router.put("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.json({ product });
  } catch (error) {
    console.error("Product update error:", error);
    res.status(500).json({ error: "Failed to update product." });
  }
});

// Delete product
router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.json({ message: "Product deleted successfully." });
  } catch (error) {
    console.error("Product deletion error:", error);
    res.status(500).json({ error: "Failed to delete product." });
  }
});

// Get all orders for admin
router.get("/orders", async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { _id: { $regex: search, $options: "i" } },
        { "userId.firstName": { $regex: search, $options: "i" } },
        { "userId.lastName": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await Order.find(filter)
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalOrders: total,
      },
    });
  } catch (error) {
    console.error("Admin orders fetch error:", error);
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

// Update order status
router.patch("/orders/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    ).populate("userId", "firstName lastName email");

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    res.json({ order });
  } catch (error) {
    console.error("Order update error:", error);
    res.status(500).json({ error: "Failed to update order." });
  }
});

// Get all users for admin
router.get("/users", async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role) {
      filter.role = role;
    }
    if (status !== undefined) {
      filter.isActive = status === "active";
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total,
      },
    });
  } catch (error) {
    console.error("Admin users fetch error:", error);
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

// Update user
router.patch("/users/:id", async (req, res) => {
  try {
    const { isActive, role } = req.body;
    const updateData = {};

    if (isActive !== undefined) updateData.isActive = isActive;
    if (role) updateData.role = role;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({ user });
  } catch (error) {
    console.error("User update error:", error);
    res.status(500).json({ error: "Failed to update user." });
  }
});

module.exports = router;
