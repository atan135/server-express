const express = require("express");
const { authenticate } = require("../middleware/auth.middleware");
const { logger } = require("../middleware/logger.middleware");

const UserModel = require("../models/user.model");

const router = express.Router();
const appLogger = logger("app");

// Public route
router.get("/", (req, res) => {
  let projectname = process.env.PROJECT_NAME || "Express App";
  res.json({
    message: `${projectname} Welcome to the Express API with Log4js, Auth and MySQL!`,
  });
});

// write routes here with /test and use async await
router.get("/test", async (req, res) => {
  try {
    appLogger.info("Test route accessed");
    /*
    let user = await UserModel.create({
      username: "testuser",
      email: "test@example.com",
      password: "testpassword",
    });
    */
    let userlist = await UserModel.findAll();
    res.json({
      message: "Test route accessed successfully",
      userlist,
    });
  } catch (error) {
    appLogger.error("Error in test route", error);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

// Protected route example
router.get("/profile", authenticate, (req, res) => {
  appLogger.info("Profile accessed", { userId: req.user.id });

  res.json({
    message: "Profile data retrieved successfully",
    user: req.user,
  });
});

// Health check route
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
