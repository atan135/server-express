//require("dotenv").config();

//console.log("start database");
module.exports = {
  host: process.env.DB_HOST || "localhost",                 // MySQL server hostname or IP address
  port: parseInt(process.env.DB_PORT) || 3306,              // MySQL server port number (default: 3306)
  database: process.env.DB_NAME || "myapp",                 // Name of the database to connect to
  user: process.env.DB_USER || "myuser",                    // MySQL username for authentication
  password: process.env.DB_PASSWORD || "mypassword",        // MySQL password for authentication

  // Pool configuration
  waitForConnections: true,                                 // Queue connection requests when pool limit is reached
  connectionLimit: 20,                                      // Maximum number of connections in the pool
  idleTimeout: 600000,                                      // Maximum time (ms) a connection can be idle before being released
  queueLimit: 0,                                            // Maximum number of connection requests to queue (0 = unlimited)

  // Connection options
  enableKeepAlive: true,                                     // Enable TCP keep-alive to detect dead connections
  keepAliveInitialDelay: 0,                                  // Initial delay (ms) before sending keep-alive probes
  charset: 'utf8mb4',                                        // Character set for the connection (supports full UTF-8)
  timezone: '+00:00',                                        // Timezone for the connection (UTC)

  // Additional security and performance options
  ssl: process.env.DB_SSL === 'true' ? {                     // SSL configuration for encrypted connections
    rejectUnauthorized: false
  } : false,
  multipleStatements: false,                                 // Prevent multiple SQL statements in one query (security)
  dateStrings: false,                                        // Return DATE/DATETIME as Date objects instead of strings
  supportBigNumbers: true,                                   // Support for numbers beyond JavaScript's safe integer limit
  bigNumberStrings: false,                                   // Return big numbers as JavaScript numbers, not strings

  // Debugging (only in development)
  debug: process.env.NODE_ENV === 'development' ? false : false // Enable query debugging in development
};
