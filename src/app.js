//require("dotenv").config();
const express = require("express");
const compression = require("compression");
const { httpLogger } = require("./middleware/logger.middleware");
const { sanitizeRequest } = require("./middleware/validation.middleware");
const authRoutes = require("./routes/auth.routes");
const routes = require("./routes/index");

const app = express();

// Add logging middleware
app.use(httpLogger);

// Add sanitization middleware
app.use(sanitizeRequest);

// Built-in middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(compression());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", routes);

// Error handling middleware
app.use((err, req, res, next) => {
  const { logger } = require("./middleware/logger.middleware");
  const errorLogger = logger("error");
  errorLogger.error(err.message, err);

  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// 404 handler
app.use((req, res) => {
  const { logger } = require("./middleware/logger.middleware");
  const httpLogger = logger("http");
  httpLogger.warn(`404 - ${req.method} ${req.url}`);

  res.status(404).json({
    error: "Not Found",
    message: "Route not found",
  });
});

module.exports = app;
