const path = require("path");

// 不同平台读取env文件
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : ".env";
console.log(envFile);
require("dotenv").config({ path: path.resolve(process.cwd(), envFile) });

const app = require("./app");
const { logger } = require("./middleware/logger.middleware");
const db = require("./utils/database.util");

const serverLogger = logger("server");

const PORT = process.env.PORT || 3000;

// Test database connection
(async () => {
  try {
    const [rows] = await db.query("SELECT 1");
    serverLogger.info("Database connection established");

    // Start server
    app.listen(PORT, () => {
      serverLogger.info(`Server is running on port ${PORT}`);
      //console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    serverLogger.error("Failed to connect to database", error);
    process.exit(1);
  }
})();
