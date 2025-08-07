const mysql = require("mysql2/promise");
const { logger } = require("../middleware/logger.middleware");
const dbConfig = require("../config/database.config");

class DatabaseUtil {
  constructor() {
    this.pool = mysql.createPool(dbConfig);
    this.logger = logger("database");
  }

  // Execute a query
  async query(sql, params = []) {
    const start = Date.now();
    try {
      const [rows, fields] = await this.pool.execute(sql, params);
      const duration = Date.now() - start;

      this.logger.info("Executed query", {
        sql,
        duration: `${duration}ms`,
        rowCount: rows.length,
      });

      return [rows, fields];
    } catch (error) {
      this.logger.error("Error executing query", {
        sql,
        params,
        error: error.message,
      });
      throw error;
    }
  }

  // Execute multiple queries in a transaction
  async transaction(queries) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      const results = [];
      for (const { sql, params } of queries) {
        const [rows] = await connection.execute(sql, params);
        results.push(rows);
      }

      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Close the pool
  async close() {
    await this.pool.end();
  }
}

module.exports = new DatabaseUtil();
