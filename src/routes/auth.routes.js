const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const UserModel = require("../models/user.model");
const { logger } = require("../middleware/logger.middleware");
const { validationChains, handleValidationErrors } = require("../middleware/validation.middleware");
const { authenticate } = require("../middleware/auth.middleware");
const router = express.Router();
const authLogger = logger("auth");

// Register endpoint
router.post("/register", validationChains.userRegistration(), handleValidationErrors, async (req, res) => {
  try {
    const { username, email, password, confirmPassword, role, fullName } = req.body;

    // Check if password and confirmPassword match
    if (password !== confirmPassword) {
      return res.status(400).json({
        errcode: 1,
        error: "Bad Request",
        errmsg: "Password and confirmPassword do not match",
      });
    }

    // get roleid
    const roleinfo = await UserModel.getRole(role);
    if (!roleinfo) {
      return res.status(400).json({
        errcode: 1,
        error: "Bad Request",
        errmsg: "Role not found",
      });
    }
    const { id: roleid, paramlist } = roleinfo;

    // Check if user already exists
    const existingUser = await UserModel.checkUsernameOrEmail(username, email);
    if (existingUser) {
      return res.status(409).json({
        errcode: 1,
        error: "Conflict",
        errmsg: "User with this email already exists",
      });
    }

    // Create user
    const user = await UserModel.create({ username, email, password, roleid, fullName });

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    authLogger.info("User registered", { userId: user.id, username: user.username, email: user.email });

    res.status(200).json({
      errcode: 0,
      errmsg: "User registered successfully",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    authLogger.error("Registration error", { error: error.message });
    res.status(500).json({
      errcode: 1,
      error: "Internal Server Error",
      errmsg: "Failed to register user",
    });
  }
});

// Login endpoint
router.post("/login", validationChains.userLogin(), handleValidationErrors, async (req, res) => {
  try {
    const { username, password } = req.body;
    authLogger.info("Login request", { username: username, password: password });
    // Find user
    const user = await UserModel.findByUsername(username);
    if (!user) {
      return res.status(401).json({
        errcode: 1,
        error: "Unauthorized",
        errmsg: "Invalid credentials",
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        errcode: 1,
        error: "Unauthorized",
        errmsg: "Invalid credentials",
      });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    authLogger.info("User logged in", { userId: user.id, username: user.username });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      errcode: 0,
      errmsg: "Login successful",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    authLogger.error("Login error", { error: error.message });
    res.status(500).json({
      errcode: 1,
      error: "Internal Server Error",
      errmsg: "Failed to login",
    });
  }
});

// Logout endpoint
router.post("/logout", authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    authLogger.info("Logout request", { userId: userId });
    res.status(200).json({
      errcode: 0,
      errmsg: "Logout successful",
    });
  } catch (error) {
    authLogger.error("Logout error", { error: error.message });
    res.status(500).json({
      errcode: 1,
      error: "Internal Server Error",
      errmsg: "Failed to logout",
    });
  }
});

module.exports = router;
