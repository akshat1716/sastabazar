const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { config } = require("./index");

class JWTSecurity {
  constructor() {
    this.accessTokenExpiry = "15m"; // 15 minutes
    this.refreshTokenExpiry = "7d"; // 7 days
    this.clockSkewTolerance = 30; // 30 seconds
    this.refreshTokens = new Map(); // In production, use Redis
  }

  // Generate a strong JWT secret if not provided
  generateStrongSecret() {
    return crypto.randomBytes(64).toString("hex");
  }

  // Validate JWT secret strength
  validateSecretStrength(secret) {
    if (!secret || secret.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters long");
    }

    if (secret === "your-super-secret-jwt-key-change-this-in-production") {
      throw new Error("JWT_SECRET must be changed from default value");
    }

    if (secret.includes("test") || secret.includes("development")) {
      console.warn("⚠️ JWT_SECRET contains test/development keywords");
    }

    return true;
  }

  // Create access token
  createAccessToken(payload) {
    this.validateSecretStrength(config.jwtSecret);

    const tokenPayload = {
      ...payload,
      type: "access",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
    };

    return jwt.sign(tokenPayload, config.jwtSecret, {
      algorithm: "HS256",
      expiresIn: this.accessTokenExpiry,
      issuer: "sastabazar",
      audience: "sastabazar-users",
    });
  }

  // Create refresh token
  createRefreshToken(payload) {
    this.validateSecretStrength(config.jwtSecret);

    const tokenPayload = {
      ...payload,
      type: "refresh",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    };

    const refreshToken = jwt.sign(tokenPayload, config.jwtSecret, {
      algorithm: "HS256",
      expiresIn: this.refreshTokenExpiry,
      issuer: "sastabazar",
      audience: "sastabazar-users",
    });

    // Store refresh token (in production, use Redis)
    this.refreshTokens.set(refreshToken, {
      userId: payload.userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return refreshToken;
  }

  // Verify access token
  verifyAccessToken(token) {
    try {
      this.validateSecretStrength(config.jwtSecret);

      const decoded = jwt.verify(token, config.jwtSecret, {
        algorithms: ["HS256"],
        issuer: "sastabazar",
        audience: "sastabazar-users",
        clockTolerance: this.clockSkewTolerance,
      });

      if (decoded.type !== "access") {
        throw new Error("Invalid token type");
      }

      return decoded;
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new Error("Access token has expired");
      } else if (error.name === "JsonWebTokenError") {
        throw new Error("Invalid access token");
      } else if (error.name === "NotBeforeError") {
        throw new Error("Token not active yet");
      }
      throw error;
    }
  }

  // Verify refresh token
  verifyRefreshToken(token) {
    try {
      this.validateSecretStrength(config.jwtSecret);

      const decoded = jwt.verify(token, config.jwtSecret, {
        algorithms: ["HS256"],
        issuer: "sastabazar",
        audience: "sastabazar-users",
        clockTolerance: this.clockSkewTolerance,
      });

      if (decoded.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      // Check if refresh token exists in storage
      if (!this.refreshTokens.has(token)) {
        throw new Error("Refresh token not found");
      }

      const storedToken = this.refreshTokens.get(token);
      if (storedToken.expiresAt < new Date()) {
        this.refreshTokens.delete(token);
        throw new Error("Refresh token has expired");
      }

      return decoded;
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        this.refreshTokens.delete(token);
        throw new Error("Refresh token has expired");
      } else if (error.name === "JsonWebTokenError") {
        throw new Error("Invalid refresh token");
      }
      throw error;
    }
  }

  // Refresh access token
  refreshAccessToken(refreshToken) {
    const decoded = this.verifyRefreshToken(refreshToken);

    // Create new access token
    const newAccessToken = this.createAccessToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: refreshToken, // Keep the same refresh token
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  // Revoke refresh token
  revokeRefreshToken(token) {
    this.refreshTokens.delete(token);
  }

  // Revoke all refresh tokens for a user
  revokeAllUserTokens(userId) {
    for (const [token, data] of this.refreshTokens.entries()) {
      if (data.userId === userId) {
        this.refreshTokens.delete(token);
      }
    }
  }

  // Clean expired tokens
  cleanExpiredTokens() {
    const now = new Date();
    for (const [token, data] of this.refreshTokens.entries()) {
      if (data.expiresAt < now) {
        this.refreshTokens.delete(token);
      }
    }
  }

  // Get token info without verification (for debugging)
  decodeToken(token) {
    return jwt.decode(token, { complete: true });
  }

  // Validate token format
  validateTokenFormat(token) {
    if (!token || typeof token !== "string") {
      return false;
    }

    const parts = token.split(".");
    if (parts.length !== 3) {
      return false;
    }

    try {
      // Check if header and payload can be decoded
      JSON.parse(Buffer.from(parts[0], "base64").toString());
      JSON.parse(Buffer.from(parts[1], "base64").toString());
      return true;
    } catch (error) {
      return false;
    }
  }

  // Generate secure random string
  generateSecureRandom(length = 32) {
    return crypto.randomBytes(length).toString("hex");
  }

  // Hash password (for user passwords)
  hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto
      .pbkdf2Sync(password, salt, 10000, 64, "sha512")
      .toString("hex");
    return `${salt}:${hash}`;
  }

  // Verify password
  verifyPassword(password, hashedPassword) {
    const [salt, hash] = hashedPassword.split(":");
    const verifyHash = crypto
      .pbkdf2Sync(password, salt, 10000, 64, "sha512")
      .toString("hex");
    return hash === verifyHash;
  }
}

// Create singleton instance
const jwtSecurity = new JWTSecurity();

// Clean expired tokens every hour
setInterval(
  () => {
    jwtSecurity.cleanExpiredTokens();
  },
  60 * 60 * 1000,
);

module.exports = jwtSecurity;
