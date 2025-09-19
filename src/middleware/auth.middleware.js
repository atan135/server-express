const jwt = require("jsonwebtoken");
const { logger } = require("./logger.middleware");
const UserModel = require("../models/user.model");

const authLogger = logger("auth");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await UserModel.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token",
      });
    }

    // Attach user to request
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    authLogger.error("Authentication error", { error: error.message });

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token",
      });
    }

    return res.status(500).json({
      error: "Internal Server Error",
      message: "Authentication failed",
    });
  }
};

module.exports = { authenticate };
