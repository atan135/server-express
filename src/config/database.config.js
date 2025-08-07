//require("dotenv").config();

//console.log("start database");
module.exports = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || "myapp",
  user: process.env.DB_USER || "myuser",
  password: process.env.DB_PASSWORD || "mypassword",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};
