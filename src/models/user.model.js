const db = require("../utils/database.util");
const bcrypt = require("bcryptjs");

class UserModel {
  // Create a new user
  static async create(userData) {
    const { username, email, password } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );

    return {
      id: result.insertId,
      username,
      email,
    };
  }

  // Find user by email
  static async findByEmail(email) {
    const [rows] = await db.query(
      "SELECT id, username, email, password FROM users WHERE email = ?",
      [email]
    );

    return rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const [rows] = await db.query(
      "SELECT id, username, email FROM users WHERE id = ?",
      [id]
    );

    return rows[0];
  }

  static async findAll() {
    const [rows] = await db.query("SELECT id, username, email FROM users ");

    return rows;
  }
}

module.exports = UserModel;
