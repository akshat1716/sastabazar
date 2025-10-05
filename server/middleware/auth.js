const jwtSecurity = require("../config/jwt");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Access denied. No token provided.",
        code: "NO_TOKEN",
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Validate token format
    if (!jwtSecurity.validateTokenFormat(token)) {
      return res.status(401).json({
        error: "Invalid token format.",
        code: "INVALID_TOKEN_FORMAT",
      });
    }

    // Verify token
    const decoded = jwtSecurity.verifyAccessToken(token);

    // Get user from database
    const user = await User.findById(decoded.userId).select("-password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: "Invalid token or user not found.",
        code: "USER_NOT_FOUND",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);

    if (error.message.includes("expired")) {
      return res.status(401).json({
        error: "Token has expired.",
        code: "TOKEN_EXPIRED",
      });
    } else if (error.message.includes("Invalid")) {
      return res.status(401).json({
        error: "Invalid token.",
        code: "INVALID_TOKEN",
      });
    } else {
      return res.status(401).json({
        error: "Token verification failed.",
        code: "TOKEN_VERIFICATION_FAILED",
      });
    }
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      if (jwtSecurity.validateTokenFormat(token)) {
        try {
          const decoded = jwtSecurity.verifyAccessToken(token);
          const user = await User.findById(decoded.userId).select("-password");

          if (user && user.isActive) {
            req.user = user;
          }
        } catch (error) {
          // Continue without authentication
        }
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== "admin") {
        return res.status(403).json({
          error: "Access denied. Admin privileges required.",
          code: "ADMIN_REQUIRED",
        });
      }
      next();
    });
  } catch (error) {
    res.status(401).json({
      error: "Authentication failed.",
      code: "AUTH_FAILED",
    });
  }
};

module.exports = { auth, optionalAuth, adminAuth };
